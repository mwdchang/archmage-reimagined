import { gameTable } from "./base/config"

export const priceIncrease = (base: number, winningBid: number) => {
  return base + gameTable.blackmarket.priceIncreaseFactor * (winningBid - base);
}

export const priceDecrease = (base: number) => {
  return base * (1 - gameTable.blackmarket.priceDecreaseFactor);
}
