import { describe, expect, it } from 'vitest';

import { CRC8Calculator } from './crc8.js';

describe('CRC8Calculator', () => {
  describe('calculate', () => {
    it('should return 0 for empty buffer', () => {
      const result = CRC8Calculator.calculate(Buffer.alloc(0));
      expect(result).toBe(0);
    });

    it('should calculate CRC8 for single byte', () => {
      const result = CRC8Calculator.calculate(Buffer.from([0x55]));
      expect(result).toBe(0xac);
    });

    it('should calculate CRC8 for sync byte (0x55)', () => {
      const result = CRC8Calculator.calculate(Buffer.from([0x55]));
      expect(result).toBe(0xac);
    });

    it('should calculate CRC8 for ESP3 header example', () => {
      // Example ESP3 header: data_length=7, optional_length=7, packet_type=1
      const headerData = Buffer.from([0x00, 0x07, 0x07, 0x01]);
      const result = CRC8Calculator.calculate(headerData);
      expect(result).toBe(0x7a);
    });

    it('should calculate CRC8 for known test vectors', () => {
      // Test vector 1: Simple sequence
      const data1 = Buffer.from([0x01, 0x02, 0x03]);
      const result1 = CRC8Calculator.calculate(data1);
      expect(result1).toBe(0x48);

      // Test vector 2: All zeros
      const data2 = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const result2 = CRC8Calculator.calculate(data2);
      expect(result2).toBe(0x00);

      // Test vector 3: All 0xFF
      const data3 = Buffer.from([0xff, 0xff, 0xff, 0xff]);
      const result3 = CRC8Calculator.calculate(data3);
      expect(result3).toBe(0xde);
    });

    it('should handle maximum byte values', () => {
      const data = Buffer.from([0xff]);
      const result = CRC8Calculator.calculate(data);
      expect(result).toBe(0xf3);
    });

    it('should produce consistent results for same input', () => {
      const data = Buffer.from([0x12, 0x34, 0x56, 0x78]);
      const result1 = CRC8Calculator.calculate(data);
      const result2 = CRC8Calculator.calculate(data);
      expect(result1).toBe(result2);
      expect(result1).toBe(0x1c);
    });

    it('should handle longer data sequences', () => {
      const data = Buffer.from([
        0xa5, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xff, 0xff, 0xff, 0x30
      ]);
      const result = CRC8Calculator.calculate(data);
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(255);
    });
  });

  describe('verify', () => {
    it('should return true when checksum matches', () => {
      const data = Buffer.from([0x55]);
      const checksum = 0xac;
      const result = CRC8Calculator.verify(data, checksum);
      expect(result).toBe(true);
    });

    it('should return false when checksum does not match', () => {
      const data = Buffer.from([0x55]);
      const wrongChecksum = 0x00;
      const result = CRC8Calculator.verify(data, wrongChecksum);
      expect(result).toBe(false);
    });

    it('should return true for empty buffer with checksum 0', () => {
      const data = Buffer.alloc(0);
      const checksum = 0;
      const result = CRC8Calculator.verify(data, checksum);
      expect(result).toBe(true);
    });

    it('should return false for empty buffer with non-zero checksum', () => {
      const data = Buffer.alloc(0);
      const checksum = 1;
      const result = CRC8Calculator.verify(data, checksum);
      expect(result).toBe(false);
    });

    it('should verify ESP3 header example', () => {
      const headerData = Buffer.from([0x00, 0x07, 0x07, 0x01]);
      const expectedChecksum = 0x7a;
      const result = CRC8Calculator.verify(headerData, expectedChecksum);
      expect(result).toBe(true);
    });

    it('should reject ESP3 header with wrong checksum', () => {
      const headerData = Buffer.from([0x00, 0x07, 0x07, 0x01]);
      const wrongChecksum = 0x7b;
      const result = CRC8Calculator.verify(headerData, wrongChecksum);
      expect(result).toBe(false);
    });

    it('should handle all possible checksum values', () => {
      const data = Buffer.from([0x12, 0x34]);
      const correctChecksum = CRC8Calculator.calculate(data);
      
      // Test correct checksum
      expect(CRC8Calculator.verify(data, correctChecksum)).toBe(true);
      
      // Test all other possible values (0-255) should return false
      for (let i = 0; i <= 255; i++) {
        if (i !== correctChecksum) {
          expect(CRC8Calculator.verify(data, i)).toBe(false);
        }
      }
    });
  });

  describe('integration tests', () => {
    it('should maintain consistency between calculate and verify methods', () => {
      const testCases = [
        Buffer.from([]),
        Buffer.from([0x55]),
        Buffer.from([0x00, 0x07, 0x07, 0x01]),
        Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05]),
        Buffer.from([0xff, 0xff, 0xff]),
        Buffer.from([0xa5, 0x00, 0x00, 0x00, 0x00]),
      ];

      for (const data of testCases) {
        const calculated = CRC8Calculator.calculate(data);
        const verified = CRC8Calculator.verify(data, calculated);
        expect(verified).toBe(true);
      }
    });

    it('should handle real EnOcean packet scenarios', () => {
      // Simulate real ESP3 packet components
      
      // Header CRC test
      const headerData = Buffer.from([0x00, 0x0a, 0x07, 0x01]); // 10 bytes data, 7 optional, radio packet
      const headerCrc = CRC8Calculator.calculate(headerData);
      expect(CRC8Calculator.verify(headerData, headerCrc)).toBe(true);
      
      // Data packet CRC test  
      const radioData = Buffer.from([
        0xf6, 0x10, 0x00, 0x2d, 0x86, 0x44, 0x30
      ]); // Example F6 (RPS) telegram
      const dataCrc = CRC8Calculator.calculate(radioData);
      expect(CRC8Calculator.verify(radioData, dataCrc)).toBe(true);
    });
  });
});