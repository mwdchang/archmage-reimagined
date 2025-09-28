export interface MarketPrice {
  id: string;
  type: string;  /*'item' | 'spell';*/
  price: number;
}

export interface MarketItem {
  id: string;
  priceId: string;
  basePrice: number;

  // where did the item came from, eg generated or auctioned
  mageId?: number; 
  extra?: any;

  // when the item is resolved and taken off the market
  expiration: number; 
}

export interface MarketBid {
  // Same as market.id
  id: string; 
  marketId: string;
  mageId: number;
  bid: number;
}


export interface Bid {
  marketId: string,
  bid: number
}
