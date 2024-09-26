import { Schema, Document } from 'mongoose';

export const ProductSchema = new Schema({
  name: String,
  price: String,
  image: String,
  link: { type: String, unique: true },
  store: String,
});

export interface Product extends Document {
  name: string;
  price: string;
  image: string;
  link: string;
  store: string;
}
