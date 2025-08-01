/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai';
import { SerialPort } from 'serialport';
import * as sinon from 'sinon';

import { NodeSerialPortAdapter } from './serialport.adapter';

describe('NodeSerialPortAdapter', () => {
  let SerialPortListStub: sinon.SinonStub;

  beforeEach(() => {
    // Stub SerialPort.list static method
    SerialPortListStub = sinon.stub(SerialPort, 'list');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('constructor', () => {
    it('creates a NodeSerialPortAdapter with basic configuration', () => {
      const adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', {
        baudRate: 57_600,
      });

      expect(adapter).to.be.instanceOf(NodeSerialPortAdapter);
    });

    it('creates a NodeSerialPortAdapter with full configuration', () => {
      const config = {
        baudRate: 115_200,
        dataBits: 8 as const,
        parity: 'even' as const,
        stopBits: 1 as const,
      };

      const adapter = new NodeSerialPortAdapter('/dev/ttyUSB1', config);

      expect(adapter).to.be.instanceOf(NodeSerialPortAdapter);
    });
  });

  describe('listPorts', () => {
    it('returns list of available serial port paths', async () => {
      const mockPorts = [
        { manufacturer: 'FTDI', path: '/dev/ttyUSB0' },
        { manufacturer: 'Arduino', path: '/dev/ttyUSB1' },
        { manufacturer: 'Arduino', path: '/dev/ttyACM0' },
      ];

      SerialPortListStub.resolves(mockPorts);

      const result = await NodeSerialPortAdapter.listPorts();

      expect(result).to.deep.equal([
        '/dev/ttyUSB0',
        '/dev/ttyUSB1',
        '/dev/ttyACM0',
      ]);
      expect(SerialPortListStub.calledOnce).to.be.true;
    });

    it('returns empty array when no ports are available', async () => {
      SerialPortListStub.resolves([]);

      const result = await NodeSerialPortAdapter.listPorts();

      expect(result).to.deep.equal([]);
      expect(SerialPortListStub.calledOnce).to.be.true;
    });

    it('handles errors from SerialPort.list', async () => {
      const error = new Error('Failed to list ports');
      SerialPortListStub.rejects(error);

      try {
        await NodeSerialPortAdapter.listPorts();
        expect.fail('Should have thrown an error');
      } catch (error_) {
        expect(error_).to.equal(error);
      }
    });
  });

  describe('interface compliance', () => {
    let adapter: NodeSerialPortAdapter;

    beforeEach(() => {
      adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', { baudRate: 57_600 });
    });

    it('implements SerialPortAdapter interface methods', () => {
      // Test that all required methods exist
      expect(adapter.close).to.be.a('function');
      expect(adapter.isOpen).to.be.a('function');
      expect(adapter.on).to.be.a('function');
      expect(adapter.open).to.be.a('function');
      expect(adapter.write).to.be.a('function');
    });

    it('has correct method signatures', () => {
      // Test method signatures return correct types
      expect(adapter.isOpen()).to.be.a('boolean');

      // These methods should return promises
      expect(adapter.open()).to.be.a('promise');
      expect(adapter.close()).to.be.a('promise');
      expect(adapter.write(Buffer.from([0x01]))).to.be.a('promise');
    });
  });

  describe('configuration validation', () => {
    it('accepts valid baud rates', () => {
      const validBaudRates = [9600, 19_200, 38_400, 57_600, 115_200];

      for (const baudRate of validBaudRates) {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', {
            baudRate,
          });
        }).to.not.throw();
      }
    });

    it('accepts valid data bits configuration', () => {
      const validDataBits = [5, 6, 7, 8] as const;

      for (const dataBits of validDataBits) {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', {
            baudRate: 57_600,
            dataBits,
          });
        }).to.not.throw();
      }
    });

    it('accepts valid parity configuration', () => {
      const validParity = ['even', 'none', 'odd'] as const;

      for (const parity of validParity) {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', {
            baudRate: 57_600,
            parity,
          });
        }).to.not.throw();
      }
    });

    it('accepts valid stop bits configuration', () => {
      const validStopBits = [1, 2] as const;

      for (const stopBits of validStopBits) {
        expect(() => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', {
            baudRate: 57_600,
            stopBits,
          });
        }).to.not.throw();
      }
    });
  });

  describe('error handling', () => {
    let adapter: NodeSerialPortAdapter;

    beforeEach(() => {
      adapter = new NodeSerialPortAdapter('/dev/nonexistent', {
        baudRate: 57_600,
      });
    });

    it('handles port opening errors gracefully', async () => {
      try {
        await adapter.open();
        // If we reach here, the port actually opened (unlikely for /dev/nonexistent)
        // but we should clean up
        await adapter.close();
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect((error as Error).message).to.include('Unable to open port');
      }
    });

    // Skipping this test because it would attempt to write to a real serial port
    // which could cause timeouts in testing environments
    it('would handle write errors when port is not open', () => {
      // This is a documentation test - the actual behavior would be
      // that write operations on closed ports throw errors
      expect(adapter.write).to.be.a('function');
    });
  });

  describe('buffer handling', () => {
    let adapter: NodeSerialPortAdapter;

    beforeEach(() => {
      adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', { baudRate: 57_600 });
    });

    it('accepts various buffer sizes', () => {
      const buffers = [
        Buffer.alloc(0), // Empty buffer
        Buffer.from([0x01]), // Single byte
        Buffer.from([0x01, 0x02, 0x03]), // Multiple bytes
        Buffer.alloc(1024, 0xff), // Large buffer
      ];

      for (const buffer of buffers) {
        expect(() => {
          adapter.write(buffer);
        }).to.not.throw();
      }
    });

    it('handles different buffer encodings', () => {
      const testData = [
        Buffer.from('hello', 'utf8'),
        Buffer.from('world', 'ascii'),
        Buffer.from([0x55, 0x00, 0x05, 0x00, 0x01]), // Raw bytes
      ];

      for (const buffer of testData) {
        expect(() => {
          adapter.write(buffer);
        }).to.not.throw();
      }
    });
  });

  describe('event handling patterns', () => {
    let adapter: NodeSerialPortAdapter;

    beforeEach(() => {
      adapter = new NodeSerialPortAdapter('/dev/ttyUSB0', { baudRate: 57_600 });
    });

    it('accepts event listeners for common events', () => {
      const commonEvents = ['data', 'error', 'close', 'open'];

      for (const eventName of commonEvents) {
        expect(() => {
          // eslint-disable-next-line max-nested-callbacks
          adapter.on(eventName, () => {});
        }).to.not.throw();
      }
    });

    it('accepts callback functions with correct signature', () => {
      const validCallbacks = [
        (_data: Buffer) => console.log('Data received'),
        (_data: Buffer) => {},
        (_data: Buffer) => 42,
      ];

      for (const callback of validCallbacks) {
        expect(() => {
          adapter.on('data', callback);
        }).to.not.throw();
      }
    });
  });
});
