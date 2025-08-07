import { EventEmitter } from 'node:events';
import { SerialPort } from 'serialport';

import { EnOceanParser } from './parser.js';
import { EEPDecoder } from './profiles.js';
import {
  ESP3Packet,
  PacketType,
  RORG,
  RadioTelegram,
  SerialConfig,
} from './packet/types.js';

/**
 * Main manager for EnOcean communication
 */
export class EnOceanManager extends EventEmitter {
  /**
   * Default serial port configuration for TCM 310
   */
  private readonly defaultSerialConfig: SerialConfig = {
    baudRate: 57_600, // Standard speed for TCM 310
    dataBits: 8,
    parity: 'none',
    stopBits: 1,
  };
  private isConnected = false;
  private readonly maxReconnectAttempts: number = 5;
  private parser: EnOceanParser;
  private reconnectAttempts = 0;

  private reconnectTimer: NodeJS.Timeout | null = null;
  private serialPort: null | SerialPort = null;

  constructor() {
    super();
    this.parser = new EnOceanParser();
  }

  /**
   * Connect to EnOcean device
   * @param portPath - Serial port path (e.g. '/dev/ttyUSB0' or 'COM3')
   * @param config - Optional serial port configuration
   */
  public async connect(
    portPath: string,
    config?: Partial<SerialConfig>,
  ): Promise<void> {
    const serialConfig = { ...this.defaultSerialConfig, ...config };

    try {
      this.serialPort = new SerialPort({
        autoOpen: false,
        baudRate: serialConfig.baudRate,
        dataBits: serialConfig.dataBits as 5 | 6 | 7 | 8,
        parity: serialConfig.parity as
          | 'even'
          | 'mark'
          | 'none'
          | 'odd'
          | 'space',
        path: portPath,
        stopBits: serialConfig.stopBits as 1 | 2,
      });

      // Configure serial port events
      this.setupSerialPortEvents();

      // Open the port
      await new Promise<void>((resolve, reject) => {
        if (!this.serialPort) {
          reject(new Error('Serial port not initialized'));
          return;
        }

        this.serialPort.open((error) => {
          if (error) {
            reject(
              new Error(
                `Unable to open port ${portPath}: ${error.message}`,
              ),
            );
          } else {
            resolve();
          }
        });
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log(`Connected to EnOcean stick on ${portPath}`);
      this.emit('connected', portPath);
    } catch (error) {
      console.error('Connection error:', error);
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Disconnect from EnOcean stick
   */
  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.serialPort && this.serialPort.isOpen) {
      await new Promise<void>((resolve) => {
        this.serialPort.close(() => {
          resolve();
        });
      });
    }

    this.isConnected = false;
    this.serialPort = null;
    this.parser.clearBuffer();
    console.log('Disconnected from EnOcean stick');
  }

  /**
   * Returns parser statistics
   */
  public getParserStats(): { bufferSize: number } {
    return {
      bufferSize: this.parser.getBufferSize(),
    };
  }

  /**
   * Returns connection status
   */
  public isPortConnected(): boolean {
    return (
      this.isConnected && this.serialPort !== null && this.serialPort.isOpen
    );
  }

  /**
   * Send a command to the EnOcean module
   * @param data - Data to send
   */
  public async sendCommand(data: Buffer): Promise<void> {
    if (!this.isConnected || !this.serialPort) {
      throw new Error('Not connected to EnOcean stick');
    }

    return new Promise((resolve, reject) => {
      this.serialPort!.write(data, (error) => {
        if (error) {
          reject(new Error(`Send error: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Attempt automatic reconnection
   */
  private attemptReconnect(): void {
    if (
      this.reconnectAttempts < this.maxReconnectAttempts &&
      !this.reconnectTimer
    ) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000); // Exponential backoff, max 30s

      console.log(
        `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`,
      );

      this.reconnectTimer = setTimeout(() => {
        this.reconnectTimer = null;
        // Note: For real reconnection, we should store the portPath and config
        this.emit('reconnectAttempt', this.reconnectAttempts);
      }, delay);
    }
  }

  /**
   * Process data received from serial port
   * @param data - Raw received data
   */
  private handleIncomingData(data: Buffer): void {
    try {
      // Add data to parser
      this.parser.addData(data);

      // Parse available packets
      const packets = this.parser.parsePackets();

      // Process each packet
      for (const packet of packets) {
        this.processPacket(packet);
      }
    } catch (error) {
      console.error('Error processing data:', error);
      this.emit('error', error);
    }
  }

  /**
   * Basic parsing of a radio telegram (simplified version for compatibility)
   * @param data - Telegram data
   * @param optionalData - Optional data
   * @returns Parsed radio telegram
   */
  private parseRadioTelegramBasic(
    data: Buffer,
    optionalData: Buffer,
  ): null | RadioTelegram {
    if (data.length < 6) {
      console.warn('Radio telegram too short');
      return null;
    }

    const rorg = data[0] as RORG;
    const userData = data.slice(1, -5);
    const senderId = data.readUInt32BE(data.length - 5);
    const status = data[data.length - 1];

    let subTelNum = 0;
    let destinationId = 0;
    let dbm = -100;
    let securityLevel = 0;

    if (optionalData.length >= 7) {
      subTelNum = optionalData[0];
      destinationId = optionalData.readUInt32BE(1);
      dbm = -Math.abs(optionalData[5]);
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
   * Process an event packet
   * @param packet - Event packet
   */
  private processEventPacket(packet: ESP3Packet): void {
    console.log('Event received:', packet.data.toString('hex'));
    this.emit('event', packet.data);
  }

  /**
   * Process a parsed ESP3 packet
   * @param packet - Packet to process
   */
  private processPacket(packet: ESP3Packet): void {
    this.emit('packet', packet);

    switch (packet.header.packetType) {
      case PacketType.EVENT: {
        this.processEventPacket(packet);
        break;
      }

      case PacketType.RADIO: {
        this.processRadioPacket(packet);
        break;
      }

      case PacketType.RESPONSE: {
        this.processResponsePacket(packet);
        break;
      }

      default: {
        console.log(`Unhandled packet type: ${packet.header.packetType}`);
        break;
      }
    }
  }

  /**
   * Process a radio packet
   * @param packet - Radio packet to process
   */
  private processRadioPacket(packet: ESP3Packet): void {
    try {
      // Parse radio telegram with existing parser
      const radioTelegram = this.parser.parseRadioTelegram
        ? this.parser.parseRadioTelegram(packet.data, packet.optionalData)
        : this.parseRadioTelegramBasic(packet.data, packet.optionalData);

      if (radioTelegram) {
        console.log(
          `Radio packet received: RORG=0x${radioTelegram.rorg.toString(16).padStart(2, '0')} from ${radioTelegram.senderId.toString(16).padStart(8, '0')}`,
        );
        console.log(`  Signal: ${radioTelegram.dbm} dBm`);

        this.emit('radioTelegram', radioTelegram);

        // Attempt EEP decoding
        try {
          const decodedData = EEPDecoder.decode(radioTelegram);

          if (decodedData) {
            console.log(`  EEP profile detected: ${decodedData.profile}`);
            this.emit('eepData', decodedData);
          }
        } catch (eepError) {
          // EEP decoding is optional, continue even if error occurs
          console.warn('Error decoding EEP:', eepError);
        }
      }
    } catch (error) {
      console.error('Error processing radio packet:', error);
      this.emit('error', error);
    }
  }

  /**
   * Process a response packet
   * @param packet - Response packet
   */
  private processResponsePacket(packet: ESP3Packet): void {
    console.log('Response received from module:', packet.data.toString('hex'));
    this.emit('response', packet.data);
  }

  /**
   * Configure serial port events
   */
  private setupSerialPortEvents(): void {
    if (!this.serialPort) return;

    // Data reception
    this.serialPort.on('data', (data: Buffer) => {
      this.handleIncomingData(data);
    });

    // Serial port error
    this.serialPort.on('error', (error) => {
      console.error('Serial port error:', error);
      this.isConnected = false;
      this.emit('error', error);
      this.attemptReconnect();
    });

    // Port closed
    this.serialPort.on('close', () => {
      console.log('Serial port closed');
      this.isConnected = false;
      this.emit('disconnected');
      this.attemptReconnect();
    });
  }
}
