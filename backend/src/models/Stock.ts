import mongoose, { Schema, Document } from 'mongoose';

export interface IStock extends Document {
  symbol: string;
  companyName: string;
  sector: string;
  price: number;
  priceDate: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    companyName: { type: String, required: true },
    sector: { type: String },
    price: { type: Number },
    priceDate: { type: Date },
    open: { type: Number },
    high: { type: Number },
    low: { type: Number },
    close: { type: Number },
    volume: { type: Number },
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
StockSchema.index({ symbol: 1, priceDate: 1 });

export default mongoose.model<IStock>('Stock', StockSchema);