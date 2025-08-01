/* eslint-disable no-bitwise */
/**
 * Utility class for readable bit operations
 * Replaces bitwise operations with more understandable method names
 */
export class BitOperations {
  /**
   * Extracts a single bit from a byte
   * @param value - The byte value to extract from
   * @param bitPosition - Bit position (0-7)
   * @returns 1 if bit is set, 0 otherwise
   */
  public static extractBit(value: number, bitPosition: number): number {
    return (value >> bitPosition) & 1;
  }

  /**
   * Extracts bits from a byte using start and end positions
   * @param value - The byte value to extract from
   * @param startBit - Starting bit position (0-7)
   * @param endBit - Ending bit position (0-7), inclusive
   * @returns Extracted bits as a number
   */
  public static extractBits(value: number, startBit: number, endBit: number): number {
    const bitCount = endBit - startBit + 1;
    const mask = (1 << bitCount) - 1;
    return (value >> startBit) & mask;
  }

  /**
   * Extracts the lower nibble (4 bits) from a byte
   * @param value - The byte value
   * @returns Lower 4 bits (0-15)
   */
  public static getLowerNibble(value: number): number {
    return this.extractBits(value, 0, 3);
  }

  /**
   * Extracts the upper nibble (4 bits) from a byte
   * @param value - The byte value
   * @returns Upper 4 bits (0-15)
   */
  public static getUpperNibble(value: number): number {
    return this.extractBits(value, 4, 7);
  }

  /**
   * Checks if a specific bit is set in a byte
   * @param value - The byte value to check
   * @param bitPosition - Bit position (0-7)
   * @returns true if bit is set, false otherwise
   */
  public static isBitSet(value: number, bitPosition: number): boolean {
    return this.extractBit(value, bitPosition) === 1;
  }

  /**
   * Checks if the most significant bit (bit 7) is set
   * @param value - The byte value to check
   * @returns true if MSB is set, false otherwise
   */
  public static isMostSignificantBitSet(value: number): boolean {
    return this.isBitSet(value, 7);
  }

  /**
   * Shifts a value left by specified positions
   * @param value - Value to shift
   * @param positions - Number of positions to shift
   * @returns Shifted value
   */
  public static shiftLeft(value: number, positions: number): number {
    return value << positions;
  }

  /**
   * Shifts a value right by specified positions
   * @param value - Value to shift
   * @param positions - Number of positions to shift
   * @returns Shifted value
   */
  public static shiftRight(value: number, positions: number): number {
    return value >> positions;
  }

  /**
   * Masks a value to keep only the lowest 8 bits
   * @param value - Value to mask
   * @returns Value with only lower 8 bits
   */
  public static toByte(value: number): number {
    return value & 0xff;
  }

  /**
   * Applies XOR operation between two values
   * @param a - First value
   * @param b - Second value
   * @returns XOR result
   */
  public static xor(a: number, b: number): number {
    return a ^ b;
  }
}

/**
 * CRC8 calculator with readable implementation
 * Replaces bitwise CRC calculation with step-by-step logic
 */
export class CRC8Calculator {
  private static readonly POLYNOMIAL = 0x07; // EnOcean CRC8 polynomial

  /**
   * Calculates CRC8 for the given data buffer
   * @param data - Data buffer to calculate CRC for
   * @returns CRC8 value
   */
  public static calculate(data: Buffer): number {
    let crc = 0;

    for (const byte of data) {
      crc = BitOperations.xor(crc, byte);
      
      for (let bitIndex = 0; bitIndex < 8; bitIndex++) {
        if (BitOperations.isMostSignificantBitSet(crc)) {
          crc = BitOperations.shiftLeft(crc, 1);
          crc = BitOperations.xor(crc, this.POLYNOMIAL);
        } else {
          crc = BitOperations.shiftLeft(crc, 1);
        }
        
        crc = BitOperations.toByte(crc);
      }
    }

    return crc;
  }
}

/**
 * Byte field extractor for EnOcean telegram parsing
 * Provides readable methods for extracting data fields from bytes
 */
export class ByteFieldExtractor {
  /**
   * Extracts boolean state from a specific bit
   * @param value - Byte containing the state bit
   * @param bitPosition - Position of the state bit
   * @returns Boolean state
   */
  public static extractBooleanState(value: number, bitPosition: number = 0): boolean {
    return BitOperations.isBitSet(value, bitPosition);
  }

  /**
   * Extracts channel number from various telegram formats
   * @param value - Byte containing channel information
   * @param mask - Bit mask to apply (e.g., 0x0f for 4 bits, 0x1f for 5 bits)
   * @returns Channel number
   */
  public static extractChannel(value: number, mask: number = 0x0f): number {
    return value & mask;
  }

  /**
   * Extracts command code from D2-01-12 telegram
   * @param commandByte - First byte of telegram data
   * @returns Command type
   */
  public static extractD2Command(commandByte: number): 'dimming' | 'status_request' | 'status_response' | 'switching' | null {
    const commandCode = BitOperations.getUpperNibble(commandByte);
    
    switch (commandCode) {
      case 1: {
        return 'switching';
      }

      case 2: {
        return 'dimming';
      }

      case 3: {
        return 'status_request';
      }

      case 4: {
        return 'status_response';
      }

      default: {
        return null;
      }
    }
  }

  /**
   * Extracts T21 bit from EnOcean status byte (indicates press/release)
   * @param statusByte - Status byte from telegram
   * @returns Action type: 'pressed' or 'released'
   */
  public static extractRockerAction(statusByte: number): 'pressed' | 'released' {
    const t21Bit = BitOperations.extractBit(statusByte, 5);
    return t21Bit === 1 ? 'pressed' : 'released';
  }

  /**
   * Extracts a 2-bit field representing rocker switch position
   * @param value - Byte containing the field
   * @param startBit - Starting bit position
   * @returns Rocker position: 'down', 'none', 'up'
   */
  public static extractRockerPosition(value: number, startBit: number): 'down' | 'none' | 'up' {
    const bits = BitOperations.extractBits(value, startBit, startBit + 1);
    
    switch (bits) {
      case 0x00: {
        return 'none';
      }

      case 0x01: {
        return 'up';
      }

      case 0x02: {
        return 'down';
      }

      default: {
        return 'none';
      }
    }
  }
}