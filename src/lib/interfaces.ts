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

interface Block { 
  index: number, 
  previousHash: string, 
  timestamp: Timestamp, 
  data: {
    type: 'buy' | 'sell',
    user: string,
    objectId: string,
    amount: number,
    price: number
  } | string, 
  hash: string 
}

export type { Stock, Price, UserData, Block };