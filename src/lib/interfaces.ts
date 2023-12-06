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

interface UserData {
  balance: number,
  stocks: {
    amount: number,
    id: string
  }[]
}

export type { Stock, Price, UserData };