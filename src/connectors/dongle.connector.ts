import { SerialPort } from 'serialport';

export class Dongle {
  private baud: number;
  private port: string;
  private serial: SerialPort;

  constructor({ baud, port }: { baud: number; port: string }) {
    this.port = port;
    this.baud = baud;
    this.serial = new SerialPort({
      autoOpen: false,
      baudRate: this.baud,
      path: this.port,
    });
  }

  public static async listPorts() {
    const ports = await SerialPort.list();
    return ports.map((port) => port.path);
  }

  public open() {
    this.serial.open(() => {
      console.log(
        `Dongle opened on port ${this.port} with baud rate ${this.baud}`,
      );
    });

    this.serial.on('data', (data) => {
      console.log(`Data received: ${JSON.stringify(data, null, 2)}`);
    });

    return this;
  }
}
