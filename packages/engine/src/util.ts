import { Mage } from "shared/types/mage";

// Debugging pretty print
export const LPretty = (v: any, n: number = 20) => {
  const str = '' + v;
  return str + ' '.repeat(n - str.length);
};
export const RPretty = (v: any, n: number = 10) => {
  const str = '' + v;
  return ' '.repeat(n - str.length) + str;
};
export const mageName = (mage: Mage) => {
  return `${mage.name} (#${mage.id})`;
}

export const readableStr = (str: string) => {
  if (!str) return '';

  // Insert space before capital letters and capitalize the first word
  return str
    .replace(/([A-Z])/g, ' $1')   // insert space before capital letters
    .replace(/^./, char => char.toUpperCase()); // capitalize first letter
}

export const readableNumber = (
  v: number,
  options?: Intl.NumberFormatOptions
) => {
  return new Intl.NumberFormat('en-US', options).format(v);
}

