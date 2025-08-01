/**
 * Types et interfaces pour le protocole EnOcean
 */

export enum PacketType {
  COMMON_COMMAND = 0x05, // Commande commune
  EVENT = 0x04, // Événement système
  RADIO = 0x01, // Paquet radio standard
  RADIO_ERP2 = 0x0a, // Paquet radio ERP2
  RADIO_MESSAGE = 0x09, // Message radio
  RADIO_SUB_TEL = 0x03, // Sous-télégrame radio
  REMOTE_MAN_COMMAND = 0x07, // Commande de gestion à distance
  RESPONSE = 0x02, // Réponse du module
  SMART_ACK_COMMAND = 0x06, // Commande Smart Acknowledge
}

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
 * Structure d'un paquet EnOcean ESP3
 */
export interface ESP3Packet {
  checksum: number;
  data: Buffer;
  header: ESP3Header;
  optionalData: Buffer;
}

/**
 * En-tête d'un paquet ESP3
 */
export interface ESP3Header {
  crc8Header: number; // CRC8 de l'en-tête
  dataLength: number; // Longueur des données
  optionalLength: number; // Longueur des données optionnelles
  packetType: PacketType; // Type de paquet
  syncByte: number; // 0x55 - Octet de synchronisation
}

/**
 * Données d'un télégrame radio
 */
export interface RadioTelegram {
  data: Buffer; // Données utiles
  dbm: number; // Puissance du signal reçu
  destinationId: number; // ID de destination
  rorg: RORG; // Type de télégrame
  securityLevel: number; // Niveau de sécurité
  senderId: number; // ID de l'expéditeur (4 octets)
  status: number; // Statut du télégrame
  subTelNum: number; // Numéro de sous-télégrame
}

/**
 * Configuration du port série
 */
export interface SerialConfig {
  baudRate: number;
  dataBits: number;
  parity: string;
  stopBits: number;
}
