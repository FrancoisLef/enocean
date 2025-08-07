/**
 * ESP3 packet header types and enums
 */

export enum PacketType {
  COMMON_COMMAND = 0x05, // Common command
  EVENT = 0x04, // System event
  RADIO = 0x01, // Standard radio packet
  RADIO_ERP2 = 0x0a, // ERP2 radio packet
  RADIO_MESSAGE = 0x09, // Radio message
  RADIO_SUB_TEL = 0x03, // Radio sub-telegram
  REMOTE_MAN_COMMAND = 0x07, // Remote management command
  RESPONSE = 0x02, // Module response
  SMART_ACK_COMMAND = 0x06, // Smart Acknowledge command
}

/**
 * ESP3 packet header
 */
export interface ESP3Header {
  crc8Header: number; // Header CRC8
  dataLength: number; // Data length
  optionalLength: number; // Optional data length
  packetType: PacketType; // Packet type
  syncByte: number; // 0x55 - Synchronization byte
}