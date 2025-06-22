import { SerialPort } from 'serialport';

import { SerialPortEmptyError, SerialPortListError } from '../errors';

export const listPorts = async (): Promise<string[]> => {
  try {
    const ports = await SerialPort.list();

    if (ports.length === 0) {
      throw new SerialPortEmptyError();
    }

    return ports.map((port) => port.path);
  } catch (error) {
    if (error instanceof Error) {
      throw new SerialPortListError(error);
    }

    return [];
  }
};
