import { BaseError } from './base.error';

export class SerialPortEmptyError extends BaseError {
  constructor(cause?: Error) {
    super({
      cause,
      message:
        'No serial ports found. Please make sure your EnOcean device is connected and accessible.',
      name: 'SerialPortEmptyError',
    });
  }
}
