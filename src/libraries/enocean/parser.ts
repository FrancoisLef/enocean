import { CRC8Calculator } from './checksum/crc8.js';
import { OptionalDataParser } from './packet/optional-data.js';
import {
  ESP3Header,
  ESP3Packet,
  PacketType,
  RORG,
  RadioTelegram,
} from './packet/types.js';

/**
 * Class for parsing EnOcean ESP3 packets
 */
export class EnOceanParser {
  private buffer: Buffer = Buffer.alloc(0);
  private readonly HEADER_LENGTH = 6;
  private readonly SYNC_BYTE = 0x55;

  /**
   * Adds data to the internal buffer
   * @param data - New data to add
   */
  public addData(data: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, data]);
  }

  /**
   * Resets the internal buffer
   */
  public clearBuffer(): void {
    this.buffer = Buffer.alloc(0);
  }

  /**
   * Returns the current buffer size
   */
  public getBufferSize(): number {
    return this.buffer.length;
  }

  /**
   * Attempts to parse available packets in the buffer
   * @returns Array of parsed packets
   */
  public parsePackets(): ESP3Packet[] {
    const packets: ESP3Packet[] = [];

    while (this.buffer.length >= this.HEADER_LENGTH) {
      // Recherche du byte de synchronisation
      const syncIndex = this.buffer.indexOf(this.SYNC_BYTE);

      if (syncIndex === -1) {
        // No sync byte found, clear the buffer
        this.buffer = Buffer.alloc(0);
        break;
      }

      // Remove data before the sync byte
      if (syncIndex > 0) {
        this.buffer = this.buffer.slice(syncIndex);
      }

      // Check if we have enough data for the header
      if (this.buffer.length < this.HEADER_LENGTH) {
        break;
      }

      // Parse the header
      const header = this.parseHeader(this.buffer.slice(0, this.HEADER_LENGTH));

      if (!header) {
        // Invalid header, remove first byte and continue
        this.buffer = this.buffer.slice(1);
        continue;
      }

      // Calculate total packet size
      const totalPacketSize =
        this.HEADER_LENGTH + header.dataLength + header.optionalLength + 1; // +1 for checksum

      // Check if we have the complete packet
      if (this.buffer.length < totalPacketSize) {
        break; // Wait for more data
      }

      // Extract packet data
      const dataStart = this.HEADER_LENGTH;
      const data = this.buffer.slice(dataStart, dataStart + header.dataLength);
      const optionalData = this.buffer.slice(
        dataStart + header.dataLength,
        dataStart + header.dataLength + header.optionalLength,
      );
      const checksum = this.buffer[totalPacketSize - 1];

      // Verify the complete packet checksum
      const packetData = this.buffer.slice(
        this.HEADER_LENGTH,
        totalPacketSize - 1,
      );

      const calculatedChecksum = CRC8Calculator.calculate(packetData);

      if (calculatedChecksum !== checksum) {
        console.warn(
          `Invalid packet checksum: calculated=${calculatedChecksum}, received=${checksum}`,
        );
        this.buffer = this.buffer.slice(1);

        continue;
      }

      // Create the packet
      const packet: ESP3Packet = {
        checksum,
        data,
        header,
        optionalData,
      };

      packets.push(packet);

      // Remove processed packet from buffer
      this.buffer = this.buffer.slice(totalPacketSize);
    }

    return packets;
  }

  /**
   * Parse a radio telegram
   * @param data - Telegram data
   * @param optionalData - Optional data
   * @returns Parsed radio telegram
   */
  public parseRadioTelegram(
    data: Buffer,
    optionalData: Buffer,
  ): null | RadioTelegram {
    if (data.length < 6) {
      console.warn('Radio telegram too short');
      return null;
    }

    const rorg = data[0] as RORG;
    const userData = data.slice(1, -5); // User data (without RORG and last 5 bytes)
    const senderId = data.readUInt32BE(data.length - 5);
    const status = data[data.length - 1];

    // Optional data (if present)
    const { subTelNum, destinationId, dbm, securityLevel } = OptionalDataParser.parse(optionalData);

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
   * Parse ESP3 packet header
   * @param headerBuffer - Buffer containing the header
   * @returns Parsed header or null if invalid
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

    // Header CRC verification
    const headerForCRC = headerBuffer.slice(1, 5);
    const calculatedCRC = CRC8Calculator.calculate(headerForCRC);

    if (calculatedCRC !== crc8Header) {
      console.warn(
        `Invalid header CRC: calculated=${calculatedCRC}, received=${crc8Header}`,
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
