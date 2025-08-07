import { ESP3Header } from './header.js';

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
 * Serial port configuration
 */
export interface SerialConfig {
  baudRate: number;
  dataBits: number;
  parity: string;
  stopBits: number;
}

// Re-export all packet-related types
export * from './header.js';
export * from './data.js';
export * from './optional-data.js';