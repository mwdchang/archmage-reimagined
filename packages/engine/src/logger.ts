const config = {
  BM: true,
  Main: true
};

export const createLogger = (flag: string) => {
  return function log(...args) {
    if (config[flag] === true) {
      console.log(`[${flag}]`, ...args);
    }
  }
}
