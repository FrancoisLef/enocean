import { ByteFieldExtractor } from './bit-operations.js';
import { RORG, RadioTelegram } from './types.js';

/**
 * Énumération des profils EEP supportés
 */
export enum EEPProfile {
  D2_01_12 = 'D2-01-12', // Nodon relay switch
  F6_02_01 = 'F6-02-01', // Interrupteur rocker switch
}

/**
 * Types de données décodées pour chaque profil
 */

// Profil F6-02-01 - Interrupteur rocker switch
export interface F6_02_01_Data {
  energyBow: boolean; // Bow d'énergie pressé
  profile: EEPProfile.F6_02_01;
  rockerA: 'down' | 'none' | 'up';
  rockerAction: 'pressed' | 'released';
  rockerB: 'down' | 'none' | 'up';
  rssi: number;
  secondAction: boolean; // Deuxième action détectée
  senderId: number;
}

// Profil D2-01-12 - Nodon relay switch
export interface D2_01_12_Data {
  channel: number; // Canal (0-29)
  command: 'dimming' | 'status_request' | 'status_response' | 'switching';
  dimTime?: number; // Temps de gradation en secondes (optionnel)
  dimValue?: number; // Valeur de gradation (optionnel)
  outputState: boolean; // État de la sortie
  outputValue: number; // Valeur de sortie (0-100%)
  profile: EEPProfile.D2_01_12;
  rssi: number;
  senderId: number;
}

export type DecodedEEPData = D2_01_12_Data | F6_02_01_Data;

/**
 * Décodeur principal pour les profils EEP
 */
export class EEPDecoder {
  /**
   * Décode un télégrame selon son profil EEP
   * @param telegram - Télégrame radio à décoder
   * @param profile - Profil EEP à utiliser (optionnel, détecté automatiquement sinon)
   * @returns Données décodées ou null si impossible
   */
  public static decode(
    telegram: RadioTelegram,
    profile?: EEPProfile,
  ): DecodedEEPData | null {
    const detectedProfile = profile || this.detectProfile(telegram);

    if (!detectedProfile) {
      return null;
    }

    switch (detectedProfile) {
      case EEPProfile.D2_01_12: {
        return this.decodeD2_01_12(telegram);
      }

      case EEPProfile.F6_02_01: {
        return this.decodeF6_02_01(telegram);
      }

      default: {
        return null;
      }
    }
  }

  /**
   * Détermine le profil EEP basé sur le RORG et potentiellement d'autres données
   * @param telegram - Télégrame radio à analyser
   * @returns Profil EEP détecté ou null
   */
  public static detectProfile(telegram: RadioTelegram): EEPProfile | null {
    switch (telegram.rorg) {
      case RORG.RPS: {
        // F6
        // Pour F6, on suppose F6-02-01 (le plus commun pour les interrupteurs)
        return EEPProfile.F6_02_01;
      }

      case RORG.VLD: {
        // D2
        // Pour D2-01-12, on vérifie la longueur des données et certains patterns
        if (telegram.data.length > 0) {
          const command = ByteFieldExtractor.extractD2Command(telegram.data[0]);
          // Commands typiques du D2-01-12: switching, dimming, status_request, status_response
          if (command !== null) {
            return EEPProfile.D2_01_12;
          }
        }

        break;
      }
    }

    return null;
  }

  /**
   * Retourne une description textuelle d'un profil EEP
   * @param profile - Profil EEP
   * @returns Description du profil
   */
  public static getProfileDescription(profile: EEPProfile): string {
    switch (profile) {
      case EEPProfile.D2_01_12: {
        return 'Electronic switches and dimmers with Energy Measurement and Local Control';
      }

      case EEPProfile.F6_02_01: {
        return 'Rocker Switch, 2 Rocker';
      }

      default: {
        return 'Profil inconnu';
      }
    }
  }

  /**
   * Décode un télégrame D2-01-12 (Nodon Relay Switch)
   * @param telegram - Télégrame radio
   * @returns Données décodées D2-01-12
   */
  private static decodeD2_01_12(telegram: RadioTelegram): D2_01_12_Data | null {
    if (telegram.data.length === 0) {
      return null;
    }

    const cmdByte = telegram.data[0];
    const command = ByteFieldExtractor.extractD2Command(cmdByte);

    if (command === null) {
      console.warn(
        `Commande D2-01-12 inconnue: ${ByteFieldExtractor.extractChannel(cmdByte, 0xf0)}`,
      );
      return null;
    }

    // Canal (bits 3-0 du premier byte + éventuellement partie du second)
    let channel = ByteFieldExtractor.extractChannel(cmdByte);

    let outputValue = 0;
    let outputState = false;
    let dimValue: number | undefined;
    let dimTime: number | undefined;

    switch (command) {
      case 'dimming': {
        if (telegram.data.length >= 3) {
          channel = ByteFieldExtractor.extractChannel(telegram.data[1], 0x1f);
          dimValue = telegram.data[2]; // 0-100%
          outputValue = dimValue;
          outputState = dimValue > 0;

          // Temps de gradation si présent
          if (telegram.data.length >= 4) {
            const dimTimeRaw = telegram.data[3];
            // Conversion du temps selon la spécification D2-01-12
            if (dimTimeRaw === 0) {
              dimTime = 0; // Instantané
            } else if (dimTimeRaw <= 127) {
              dimTime = dimTimeRaw; // Secondes
            } else {
              dimTime = (dimTimeRaw - 127) * 60; // Minutes converties en secondes
            }
          }
        }

        break;
      }

      case 'status_request': {
        if (telegram.data.length >= 2) {
          channel = ByteFieldExtractor.extractChannel(telegram.data[1], 0x1f);
        }

        break;
      }

      case 'status_response': {
        if (telegram.data.length >= 3) {
          channel = ByteFieldExtractor.extractChannel(telegram.data[1], 0x1f);
          outputValue = telegram.data[2]; // Valeur actuelle 0-100%
          outputState = outputValue > 0;
        }

        break;
      }

      case 'switching': {
        if (telegram.data.length >= 2) {
          // Canal étendu si nécessaire
          if (telegram.data.length >= 3) {
            channel = ByteFieldExtractor.extractChannel(telegram.data[1], 0x1f); // 5 bits pour le canal (0-29)
            outputState = ByteFieldExtractor.extractBooleanState(
              telegram.data[2],
            );
            outputValue = outputState ? 100 : 0;
          } else {
            outputState = ByteFieldExtractor.extractBooleanState(
              telegram.data[1],
            );
            outputValue = outputState ? 100 : 0;
          }
        }

        break;
      }
    }

    const result: D2_01_12_Data = {
      channel,
      command,
      outputState,
      outputValue,
      profile: EEPProfile.D2_01_12,
      rssi: telegram.dbm,
      senderId: telegram.senderId,
    };

    // Ajouter les champs optionnels s'ils existent
    if (dimValue !== undefined) {
      result.dimValue = dimValue;
    }

    if (dimTime !== undefined) {
      result.dimTime = dimTime;
    }

    return result;
  }

  /**
   * Décode un télégrame F6-02-01 (Rocker Switch)
   * @param telegram - Télégrame radio
   * @returns Données décodées F6-02-01
   */
  private static decodeF6_02_01(telegram: RadioTelegram): F6_02_01_Data | null {
    if (telegram.data.length === 0) {
      return null;
    }

    const dataByte = telegram.data[0];

    // Bits 7-6: Rocker A
    const rockerA = ByteFieldExtractor.extractRockerPosition(dataByte, 5);

    // Bits 5-4: Energy bow (non utilisé dans F6-02-01 standard)
    const energyBow = ByteFieldExtractor.extractBooleanState(dataByte, 4);

    // Bits 3-2: Rocker B
    const rockerB = ByteFieldExtractor.extractRockerPosition(dataByte, 1);

    // Bit 1: Second action (non utilisé dans ce profil)
    const secondAction = ByteFieldExtractor.extractBooleanState(dataByte, 0);

    // Déterminer l'action basée sur le bit T21 du status
    const rockerAction = ByteFieldExtractor.extractRockerAction(
      telegram.status,
    );

    return {
      energyBow,
      profile: EEPProfile.F6_02_01,
      rockerA,
      rockerAction,
      rockerB,
      rssi: telegram.dbm,
      secondAction,
      senderId: telegram.senderId,
    };
  }
}
