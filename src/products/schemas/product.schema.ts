import { Schema, Document } from 'mongoose';

export const ProductSchema = new Schema({
  name: String,
  price: Number,
  image: String,
  link: { type: String, unique: true },
  store: String,
});

export interface Product extends Document {
  name: string;
  price: number;
  image: string;
  link: string;
  store: string;
}
