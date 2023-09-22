// Debugging pretty print
export const LPretty = (v: any, n: number = 20) => {
  const str = '' + v;
  return str + ' '.repeat(n - str.length);
};
export const RPretty = (v: any, n: number = 10) => {
  const str = '' + v;
  return ' '.repeat(n - str.length) + str;
};

