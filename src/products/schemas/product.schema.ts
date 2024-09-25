import { Schema, Document } from 'mongoose';

export const ProductSchema = new Schema({
  name: String,
  price: String,
  image: String,
  link: String,
});

export interface Product extends Document {
  name: string;
  price: string;
  image: string;
  link: string;
}
