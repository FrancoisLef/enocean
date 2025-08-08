/**
 * EnOcean optional data structures and utilities
 */

/**
 * Structure for optional data parsing
 */
export interface OptionalDataFields {
  subTelNum: number;
  destinationId: number;
  dbm: number;
  securityLevel: number;
}

/**
 * Utilities for parsing optional data in ESP3 packets
 */
export class OptionalDataParser {
  /**
   * Parse optional data from buffer
   * @param optionalData - Buffer containing optional data
   * @returns Parsed optional data fields
   */
  public static parse(optionalData: Buffer): OptionalDataFields {
    let subTelNum = 0;
    let destinationId = 0;
    let dbm = -100; // Default value
    let securityLevel = 0;

    if (optionalData.length >= 7) {
      subTelNum = optionalData[0];
      destinationId = optionalData.readUInt32BE(1);
      dbm = -Math.abs(optionalData[5]); // Convert to negative dBm
      securityLevel = optionalData[6];
    }

    return {
      subTelNum,
      destinationId,
      dbm,
      securityLevel,
    };
  }
}
