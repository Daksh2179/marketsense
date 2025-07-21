import mongoose, { Schema, Document } from 'mongoose';

export interface ISentiment extends Document {
  symbol: string;
  date: Date;
  score: number;
  volume: number;
  sources: string[];
  headlines: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SentimentSchema: Schema = new Schema(
  {
    symbol: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    score: { type: Number, required: true }, // -1 to 1 scale
    volume: { type: Number, default: 0 }, // Number of articles
    sources: [{ type: String }],
    headlines: [{ type: String }],
  },
  { timestamps: true }
);

// Create a compound index for efficient querying
SentimentSchema.index({ symbol: 1, date: 1 });

export default mongoose.model<ISentiment>('Sentiment', SentimentSchema);