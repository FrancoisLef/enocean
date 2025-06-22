export class BaseError extends Error {
  cause?: Error;
  message: string;
  name: string;

  constructor({
    cause,
    message,
    name,
  }: {
    cause?: Error;
    message: string;
    name: string;
  }) {
    super(message);
    this.name = name;
    this.message = message;
    this.cause = cause;
  }
}
