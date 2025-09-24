export interface MarketPrice {
  id: string;
  type: string;  /*'item' | 'spell';*/
  extra?: any;
  price: number;
}

export interface MarketItem {
  id: string;
  itemId: string;
  basePrice: number;

  // where did the item came from, eg generated or auctioned
  mageId: number|null; 

  // when the item is resolved and taken off the market
  expiration: number; 
}

export interface MarketBid {
  // Same as market.id
  id: string; 
  mageId: number;
  bid: number;
}
