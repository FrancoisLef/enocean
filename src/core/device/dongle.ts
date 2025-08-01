import { NodeSerialPortAdapter, SerialPortAdapter } from '../../infrastructure/serial/serialport-adapter';

export class Dongle {
  private baud: number;
  private port: string;
  private serial: SerialPortAdapter;

  constructor({ baud, port }: { baud: number; port: string }) {
    this.port = port;
    this.baud = baud;
    this.serial = new NodeSerialPortAdapter(this.port, {
      baudRate: this.baud,
    });
  }

  public static async listPorts() {
    return NodeSerialPortAdapter.listPorts();
  }

  public async open() {
    await this.serial.open();
    console.log(
      `Dongle opened on port ${this.port} with baud rate ${this.baud}`,
    );

    this.serial.on('data', (data) => {
      console.log(`Data received: ${JSON.stringify(data, null, 2)}`);
    });

    return this;
  }
}
