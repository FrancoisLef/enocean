import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';

import { EnOceanParser } from './parser.js';
import { EEPDecoder } from './profiles.js';
import {
  ESP3Packet,
  PacketType,
  RadioTelegram,
  RORG,
  SerialConfig,
} from './types.js';

/**
 * Gestionnaire principal pour la communication EnOcean
 */
// eslint-disable-next-line unicorn/prefer-event-target
export class EnOceanManager extends EventEmitter {
  /**
   * Configuration par défaut du port série pour TCM 310
   */
  private readonly defaultSerialConfig: SerialConfig = {
    baudRate: 57_600, // Vitesse standard pour TCM 310
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
  };
  private isConnected: boolean = false;
  private readonly maxReconnectAttempts: number = 5;
  private parser: EnOceanParser;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private serialPort: null | SerialPort = null;

  constructor() {
    super();
    this.parser = new EnOceanParser();
  }

  /**
   * Se connecte au stick USB EnOcean
   * @param portPath - Chemin du port série (ex: '/dev/ttyUSB0' ou 'COM3')
   * @param config - Configuration optionnelle du port série
   */
  public async connect(
    portPath: string,
    config?: Partial<SerialConfig>,
  ): Promise<void> {
    const serialConfig = { ...this.defaultSerialConfig, ...config };

    try {
      this.serialPort = new SerialPort({
        autoOpen: false,
        baudRate: serialConfig.baudRate,
        dataBits: serialConfig.dataBits as 5 | 6 | 7 | 8,
        parity: serialConfig.parity as
          | 'even'
          | 'mark'
          | 'none'
          | 'odd'
          | 'space',
        path: portPath,
        stopBits: serialConfig.stopBits as 1 | 2,
      });

      // Configuration des événements du port série
      this.setupSerialPortEvents();

      // Ouverture du port
      await new Promise<void>((resolve, reject) => {
        this.serialPort!.open((error) => {
          if (error) {
            reject(
              new Error(
                `Impossible d'ouvrir le port ${portPath}: ${error.message}`,
              ),
            );
          } else {
            resolve();
          }
        });
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`Connecté au stick EnOcean sur ${portPath}`);
      this.emit('connected', portPath);
    } catch (error) {
      console.error('Erreur de connexion:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Déconnecte du stick EnOcean
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.serialPort && this.serialPort.isOpen) {
      await new Promise<void>((resolve) => {
        this.serialPort!.close(() => {
          resolve();
        });
      });
    }

    this.isConnected = false;
    this.serialPort = null;
    this.parser.clearBuffer();
    console.log('Déconnecté du stick EnOcean');
  }

  /**
   * Retourne des statistiques sur le parser
   */
  public getParserStats(): { bufferSize: number } {
    return {
      bufferSize: this.parser.getBufferSize(),
    };
  }

  /**
   * Retourne l'état de connexion
   */
  public isPortConnected(): boolean {
    return (
      this.isConnected && this.serialPort !== null && this.serialPort.isOpen
    );
  }

  /**
   * Envoie une commande au module EnOcean
   * @param data - Données à envoyer
   */
  public async sendCommand(data: Buffer): Promise<void> {
    if (!this.isConnected || !this.serialPort) {
      throw new Error('Non connecté au stick EnOcean');
    }

    return new Promise((resolve, reject) => {
      this.serialPort!.write(data, (error) => {
        if (error) {
          reject(new Error(`Erreur d'envoi: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Tente une reconnexion automatique
   */
  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.reconnectTimer
    ) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000); // Backoff exponentiel, max 30s

      console.log(
        `Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`,
      );

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        // Note: Pour une vraie reconnexion, il faudrait stocker le portPath et la config
        this.emit('reconnectAttempt', this.reconnectAttempts);
      }, delay);
    }
  }

  /**
   * Traite les données reçues du port série
   * @param data - Données brutes reçues
   */
  private handleIncomingData(data: Buffer): void {
    try {
      // Ajouter les données au parser
      this.parser.addData(data);

      // Parser les paquets disponibles
      const packets = this.parser.parsePackets();

      // Traiter chaque paquet
      for (const packet of packets) {
        this.processPacket(packet);
      }
    } catch (error) {
      console.error('Erreur lors du traitement des données:', error);
      this.emit('error', error);
    }
  }

  /**
   * Parse basique d'un télégrame radio (version simplifiée pour compatibilité)
   * @param data - Données du télégrame
   * @param optionalData - Données optionnelles
   * @returns Télégrame radio parsé
   */
  private parseRadioTelegramBasic(
    data: Buffer,
    optionalData: Buffer,
  ): null | RadioTelegram {
    if (data.length < 6) {
      console.warn('Télégrame radio trop court');
      return null;
    }

    const rorg = data[0] as RORG;
    const userData = data.slice(1, -5);
    const senderId = data.readUInt32BE(data.length - 5);
    // eslint-disable-next-line unicorn/prefer-at
    const status = data[data.length - 1];

    let subTelNum = 0;
    let destinationId = 0;
    let dbm = -100;
    let securityLevel = 0;

    if (optionalData.length >= 7) {
      subTelNum = optionalData[0];
      destinationId = optionalData.readUInt32BE(1);
      dbm = -Math.abs(optionalData[5]);
      securityLevel = optionalData[6];
    }

    return {
      data: userData,
      dbm,
      destinationId,
      rorg,
      securityLevel,
      senderId,
      status,
      subTelNum,
    };
  }

  /**
   * Traite un paquet d'événement
   * @param packet - Paquet d'événement
   */
  private processEventPacket(packet: ESP3Packet): void {
    console.log('Événement reçu:', packet.data.toString('hex'));
    this.emit('event', packet.data);
  }

  /**
   * Traite un paquet ESP3 parsé
   * @param packet - Paquet à traiter
   */
  private processPacket(packet: ESP3Packet): void {
    this.emit('packet', packet);

    switch (packet.header.packetType) {
      case PacketType.EVENT: {
        this.processEventPacket(packet);
        break;
      }

      case PacketType.RADIO: {
        this.processRadioPacket(packet);
        break;
      }

      case PacketType.RESPONSE: {
        this.processResponsePacket(packet);
        break;
      }

      default: {
        console.log(`Type de paquet non géré: ${packet.header.packetType}`);
        break;
      }
    }
  }

  /**
   * Traite un paquet radio
   * @param packet - Paquet radio à traiter
   */
  private processRadioPacket(packet: ESP3Packet): void {
    try {
      // Parser le télégrame radio avec le parser existant
      const radioTelegram = this.parser.parseRadioTelegram
        ? this.parser.parseRadioTelegram(packet.data, packet.optionalData)
        : this.parseRadioTelegramBasic(packet.data, packet.optionalData);

      if (radioTelegram) {
        console.log(
          `Paquet radio reçu: RORG=0x${radioTelegram.rorg.toString(16).padStart(2, '0')} de ${radioTelegram.senderId.toString(16).padStart(8, '0')}`,
        );
        console.log(`  Signal: ${radioTelegram.dbm} dBm`);

        this.emit('radioTelegram', radioTelegram);

        // Tentative de décodage EEP
        try {
          const decodedData = EEPDecoder.decode(radioTelegram);

          if (decodedData) {
            console.log(`  Profil EEP détecté: ${decodedData.profile}`);
            this.emit('eepData', decodedData);
          }
        } catch (eepError) {
          // Le décodage EEP est optionnel, continuer même en cas d'erreur
          console.warn('Erreur lors du décodage EEP:', eepError);
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement du paquet radio:', error);
      this.emit('error', error);
    }
  }

  /**
   * Traite un paquet de réponse
   * @param packet - Paquet de réponse
   */
  private processResponsePacket(packet: ESP3Packet): void {
    console.log('Réponse reçue du module:', packet.data.toString('hex'));
    this.emit('response', packet.data);
  }

  /**
   * Configure les événements du port série
   */
  private setupSerialPortEvents(): void {
    if (!this.serialPort) return;

    // Réception de données
    this.serialPort.on('data', (data: Buffer) => {
      this.handleIncomingData(data);
    });

    // Erreur sur le port série
    this.serialPort.on('error', (error) => {
      console.error('Erreur du port série:', error);
      this.isConnected = false;
      this.emit('error', error);
      this.attemptReconnect();
    });

    // Port fermé
    this.serialPort.on('close', () => {
      console.log('Port série fermé');
      this.isConnected = false;
      this.emit('disconnected');
      this.attemptReconnect();
    });
  }
}
