// A bunch of random functions
//
// https://stackoverflow.com/questions/25582882/javascript-math-random-normal-distribution-gaussian-bell-curve
export const randomBM = () => {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  let num = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
  num = num / 10.0 + 0.5; // Translate to 0 -> 1
  // if (num > 1 || num < 0) return randn_bm() // resample between 0 and 1
  if (num > 0.75 || num < 0.25) return randomBM(); // resample
  return num;
}

export const randomInt = (n: number) => {
  return Math.floor(Math.random() * n);
}

export const betweenInt = (min: number, max: number) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
