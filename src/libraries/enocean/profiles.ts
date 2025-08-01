/* eslint-disable complexity */
/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
import { RadioTelegram, RORG } from './types';

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
          const command = (telegram.data[0] >> 4) & 0x0f;
          // Commands typiques du D2-01-12: 1=switching, 2=dimming, 3=status
          if ([1, 2, 3, 4].includes(command)) {
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
    const commandCode = (cmdByte >> 4) & 0x0f;

    let command: 'dimming' | 'status_request' | 'status_response' | 'switching';
    switch (commandCode) {
      case 1: {
        command = 'switching';
        break;
      }

      case 2: {
        command = 'dimming';
        break;
      }

      case 3: {
        command = 'status_request';
        break;
      }

      case 4: {
        command = 'status_response';
        break;
      }

      default: {
        console.warn(`Commande D2-01-12 inconnue: ${commandCode}`);
        return null;
      }
    }

    // Canal (bits 3-0 du premier byte + éventuellement partie du second)
    let channel = cmdByte & 0x0f;

    let outputValue = 0;
    let outputState = false;
    let dimValue: number | undefined;
    let dimTime: number | undefined;

    switch (command) {
      case 'dimming': {
        if (telegram.data.length >= 3) {
          channel = telegram.data[1] & 0x1f;
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
          channel = telegram.data[1] & 0x1f;
        }

        break;
      }

      case 'status_response': {
        if (telegram.data.length >= 3) {
          channel = telegram.data[1] & 0x1f;
          outputValue = telegram.data[2]; // Valeur actuelle 0-100%
          outputState = outputValue > 0;
        }

        break;
      }

      case 'switching': {
        if (telegram.data.length >= 2) {
          // Canal étendu si nécessaire
          if (telegram.data.length >= 3) {
            channel = telegram.data[1] & 0x1f; // 5 bits pour le canal (0-29)
            outputState = (telegram.data[2] & 0x01) === 1;
            outputValue = outputState ? 100 : 0;
          } else {
            outputState = (telegram.data[1] & 0x01) === 1;
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
    const rockerABits = (dataByte >> 5) & 0x03;
    let rockerA: 'down' | 'none' | 'up';
    switch (rockerABits) {
      case 0x00: {
        rockerA = 'none';
        break;
      }

      case 0x01: {
        rockerA = 'up';
        break;
      }

      case 0x02: {
        rockerA = 'down';
        break;
      }

      default: {
        rockerA = 'none';
        break;
      }
    }

    // Bits 5-4: Energy bow (non utilisé dans F6-02-01 standard)
    const energyBow = ((dataByte >> 4) & 0x01) === 1;

    // Bits 3-2: Rocker B

    const rockerBBits = (dataByte >> 1) & 0x03;

    let rockerB: 'down' | 'none' | 'up';

    switch (rockerBBits) {
      case 0x00: {
        rockerB = 'none';
        break;
      }

      case 0x01: {
        rockerB = 'up';
        break;
      }

      case 0x02: {
        rockerB = 'down';
        break;
      }

      default: {
        rockerB = 'none';
        break;
      }
    }

    // Bit 1: Second action (non utilisé dans ce profil)
    const secondAction = (Math.trunc(dataByte) & 0x01) === 1;

    // Déterminer l'action basée sur le bit T21 du status
    const t21Bit = (telegram.status >> 5) & 0x01;

    const rockerAction: 'pressed' | 'released' =
      t21Bit === 1 ? 'pressed' : 'released';

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
