import { z } from "zod";

export const MarketPriceSchema = z.object({
  id: z.string(),
  type: z.string(), // or z.enum(["item", "spell"])
  price: z.number(),
});
export type MarketPrice = z.infer<typeof MarketPriceSchema>;


export const MarketItemSchema = z.object({
  id: z.string(),
  priceId: z.string(),
  basePrice: z.number(),

  // where did the item come from, e.g. generated or auctioned
  mageId: z.number().optional(),
  extra: z.any().optional(),

  // when the item is resolved and taken off the market
  expiration: z.number(),
});
export type MarketItem = z.infer<typeof MarketItemSchema>;


export const MarketBidSchema = z.object({
  // Same as market.id
  id: z.string(),
  marketId: z.string(),
  mageId: z.number(),
  bid: z.number(),
});
export type MarketBid = z.infer<typeof MarketBidSchema>;


export const BidSchema = z.object({
  marketId: z.string(),
  bid: z.number(),
});
export type Bid = z.infer<typeof BidSchema>;


export const BidContainerSchema = z.object({
  marketItem: MarketItemSchema,
  bid: z.number(),
});
export type BidContainer = z.infer<typeof BidContainerSchema>;


export const SellItemSchema = z.object({
  itemId: z.string(),
  size: z.number(),
  price: z.number(),
  sellAmt: z.number(),
});
export type SellItem = z.infer<typeof SellItemSchema>;
