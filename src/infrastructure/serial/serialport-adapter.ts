import { SerialPort } from 'serialport';

export interface SerialPortAdapter {
  close(): Promise<void>;
  isOpen(): boolean;
  on(event: string, callback: (data: Buffer) => void): void;
  open(): Promise<void>;
  write(data: Buffer): Promise<void>;
}

export class NodeSerialPortAdapter implements SerialPortAdapter {
  private serialPort: SerialPort;

  constructor(
    private path: string,
    private config: {
      baudRate: number;
      dataBits?: 5 | 6 | 7 | 8;
      parity?: 'even' | 'none' | 'odd';
      stopBits?: 1 | 2;
    },
  ) {
    this.serialPort = new SerialPort({
      autoOpen: false,
      path: this.path,
      ...this.config,
    });
  }

  public static async listPorts(): Promise<string[]> {
    const ports = await SerialPort.list();
    return ports.map((port) => port.path);
  }

  public async close(): Promise<void> {
    if (this.serialPort.isOpen) {
      return new Promise<void>((resolve) => {
        this.serialPort.close(() => {
          resolve();
        });
      });
    }
  }

  public isOpen(): boolean {
    return this.serialPort.isOpen;
  }

  public on(event: string, callback: (data: Buffer) => void): void {
    this.serialPort.on(event, callback);
  }

  public async open(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.serialPort.open((error) => {
        if (error) {
          reject(
            new Error(`Unable to open port ${this.path}: ${error.message}`),
          );
        } else {
          resolve();
        }
      });
    });
  }

  public async write(data: Buffer): Promise<void> {
    return new Promise((resolve, reject) => {
      this.serialPort.write(data, (error) => {
        if (error) {
          reject(new Error(`Write error: ${error.message}`));
        } else {
          resolve();
        }
      });
    });
  }
}
