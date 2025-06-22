import { BaseError } from './base.error';

export class SerialPortListError extends BaseError {
  constructor(cause?: Error) {
    super({
      cause,
      message: 'An error occurred while listing serial ports',
      name: 'SerialPortListError',
    });
  }
}
