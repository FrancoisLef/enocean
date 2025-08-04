import { CRC8Calculator } from './bit-operations.js';
import {
  ESP3Header,
  ESP3Packet,
  PacketType,
  RadioTelegram,
  RORG,
} from './types.js';

/**
 * Classe pour parser les paquets EnOcean ESP3
 */
export class EnOceanParser {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly HEADER_LENGTH = 6;
  private readonly SYNC_BYTE = 0x55;

  /**
   * Ajoute des données au buffer interne
   * @param data - Nouvelles données à ajouter
   */
  public addData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  /**
   * Remet à zéro le buffer interne
   */
  public clearBuffer(): void {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Retourne la taille actuelle du buffer
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Tente de parser les paquets disponibles dans le buffer
   * @returns Array des paquets parsés
   */
  public parsePackets(): ESP3Packet[] {
    const packets: ESP3Packet[] = [];

    while (this.buffer.length >= this.HEADER_LENGTH) {
      // Recherche du byte de synchronisation
      const syncIndex = this.buffer.indexOf(this.SYNC_BYTE);

      if (syncIndex === -1) {
        // Aucun byte de sync trouvé, vider le buffer
        this.buffer = Buffer.alloc(0);
        break;
      }

      // Supprimer les données avant le byte de sync
      if (syncIndex > 0) {
        this.buffer = this.buffer.slice(syncIndex);
      }

      // Vérifier si on a assez de données pour l'en-tête
      if (this.buffer.length < this.HEADER_LENGTH) {
        break;
      }

      // Parser l'en-tête
      const header = this.parseHeader(this.buffer.slice(0, this.HEADER_LENGTH));

      if (!header) {
        // En-tête invalide, supprimer le premier octet et continuer
        this.buffer = this.buffer.slice(1);
        continue;
      }

      // Calculer la taille totale du paquet
      const totalPacketSize =
        this.HEADER_LENGTH + header.dataLength + header.optionalLength + 1; // +1 pour le checksum

      // Vérifier si on a tout le paquet
      if (this.buffer.length < totalPacketSize) {
        break; // Attendre plus de données
      }

      // Extraire les données du paquet
      const dataStart = this.HEADER_LENGTH;
      const data = this.buffer.slice(dataStart, dataStart + header.dataLength);
      const optionalData = this.buffer.slice(
        dataStart + header.dataLength,
        dataStart + header.dataLength + header.optionalLength,
      );
      const checksum = this.buffer[totalPacketSize - 1];

      // Vérifier le checksum du paquet complet
      const packetData = this.buffer.slice(
        this.HEADER_LENGTH,
        totalPacketSize - 1,
      );

      const calculatedChecksum = CRC8Calculator.calculate(packetData);

      if (calculatedChecksum !== checksum) {
        console.warn(
          `Checksum invalide pour le paquet: calculé=${calculatedChecksum}, reçu=${checksum}`,
        );
        this.buffer = this.buffer.slice(1);

        continue;
      }

      // Créer le paquet
      const packet: ESP3Packet = {
        checksum,
        data,
        header,
        optionalData,
      };

      packets.push(packet);

      // Supprimer le paquet traité du buffer
      this.buffer = this.buffer.slice(totalPacketSize);
    }

    return packets;
  }

  /**
   * Parse un télégrame radio
   * @param data - Données du télégrame
   * @param optionalData - Données optionnelles
   * @returns Télégrame radio parsé
   */
  public parseRadioTelegram(
    data: Buffer,
    optionalData: Buffer,
  ): null | RadioTelegram {
    if (data.length < 6) {
      console.warn('Télégrame radio trop court');
      return null;
    }

    const rorg = data[0] as RORG;
    const userData = data.slice(1, -5); // Données utilisateur (sans RORG et les 5 derniers octets)
    const senderId = data.readUInt32BE(data.length - 5);
    const status = data[data.length - 1];

    // Données optionnelles (si présentes)
    let subTelNum = 0;
    let destinationId = 0;
    let dbm = -100; // Valeur par défaut
    let securityLevel = 0;

    if (optionalData.length >= 7) {
      subTelNum = optionalData[0];
      destinationId = optionalData.readUInt32BE(1);
      dbm = -Math.abs(optionalData[5]); // Conversion en dBm négatif
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
   * Parse l'en-tête d'un paquet ESP3
   * @param headerBuffer - Buffer contenant l'en-tête
   * @returns En-tête parsé ou null si invalide
   */
  private parseHeader(headerBuffer: Buffer): ESP3Header | null {
    if (headerBuffer.length < this.HEADER_LENGTH) {
      return null;
    }

    const syncByte = headerBuffer[0];
    if (syncByte !== this.SYNC_BYTE) {
      return null;
    }

    const dataLength = headerBuffer.readUInt16BE(1);
    const optionalLength = headerBuffer[3];
    const packetType = headerBuffer[4] as PacketType;
    const crc8Header = headerBuffer[5];

    // Vérification du CRC de l'en-tête
    const headerForCRC = headerBuffer.slice(1, 5);
    const calculatedCRC = CRC8Calculator.calculate(headerForCRC);

    if (calculatedCRC !== crc8Header) {
      console.warn(
        `CRC invalide dans l'en-tête: calculé=${calculatedCRC}, reçu=${crc8Header}`,
      );
      return null;
    }

    return {
      crc8Header,
      dataLength,
      optionalLength,
      packetType,
      syncByte,
    };
  }
}
