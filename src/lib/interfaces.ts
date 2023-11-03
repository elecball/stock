import type { Timestamp } from "firebase/firestore";

interface Stock {
  id: string;
  name: string;
  description: string;
  priceList: Price[];
}

interface Price {
  value: number,
  time: Timestamp
}

export type { Stock, Price };