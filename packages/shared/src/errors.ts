export class NetPowerRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetPowerRangeError';
  }
}

export class NameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NameError';
  }
}
