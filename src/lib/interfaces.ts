import type { Timestamp } from "firebase/firestore";

interface Stock {
  name: string;
  description: string;
  priceList: {
    value: number,
    time: Timestamp
  }[];
}

export type { Stock };