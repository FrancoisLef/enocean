/**
 * EnOcean telegram data types and RORG definitions
 */

export enum RORG {
  ADT = 0xa6, // Addressing Destination Telegram
  BS1 = 0xd5, // 1-byte sensor data
  BS4 = 0xa5, // 4-byte sensor data
  MSC = 0xd1, // Manufacturer Specific Communication
  RPS = 0xf6, // Repeated Switch Communication
  SM_LRN_ANS = 0xc7, // Smart Learn Answer
  SM_LRN_REQ = 0xc6, // Smart Learn Request
  SM_REC = 0xa7, // Smart Acknowledge Signal
  SYS_EX = 0xc5, // Remote Management
  VLD = 0xd2, // Variable Length Data
}

/**
 * Radio telegram data
 */
export interface RadioTelegram {
  data: Buffer; // Useful data
  dbm: number; // Received signal strength
  destinationId: number; // Destination ID
  rorg: RORG; // Telegram type
  securityLevel: number; // Security level
  senderId: number; // Sender ID (4 bytes)
  status: number; // Telegram status
  subTelNum: number; // Sub-telegram number
}
