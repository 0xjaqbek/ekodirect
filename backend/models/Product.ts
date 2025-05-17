// backend/models/Product.ts
import { firestore } from 'firebase-admin';
import { z } from 'zod';
import { PRODUCT_CATEGORIES, PRODUCT_UNITS } from '../../src/shared/constants';

const StatusEnum = ['available', 'preparing', 'shipped', 'delivered', 'unavailable'] as const;

const StatusHistoryItemSchema = z.object({
  status: z.string(),
  timestamp: z.coerce.date().default(() => new Date()),
  updatedBy: z.string(), // user ID
  note: z.string().optional(),
});

const GeoSchema = z.object({
  type: z.literal('Point'),
  coordinates: z.tuple([z.number(), z.number()]), // [lon, lat]
  address: z.string(),
});

export const ProductSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().min(10).max(2000),
  price: z.number().min(0.01),
  quantity: z.number().min(0).default(0),
  unit: z.enum(PRODUCT_UNITS),
  category: z.enum(PRODUCT_CATEGORIES),
  subcategory: z.string().optional(),
  owner: z.string(), // user ID
  images: z.array(z.string()).default([]),
  certificates: z.array(z.string()).default([]),
  status: z.enum(StatusEnum).default('available'),
  statusHistory: z.array(StatusHistoryItemSchema).default([]),
  location: GeoSchema.optional(),
  harvestDate: z.coerce.date().optional(),
  trackingId: z.string().optional(),
  reviews: z.array(z.string()).default([]), // array of review doc IDs
  averageRating: z.number().min(0).max(5).default(0),
  isCertified: z.boolean().default(false),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type Product = z.infer<typeof ProductSchema>;

export const productConverter: firestore.FirestoreDataConverter<Product> = {
  toFirestore: (data: Product) => ({
    ...data,
    updatedAt: new Date(), // simulate pre-save hook
  }),
  fromFirestore: (snap) => {
    const data = snap.data();
    return ProductSchema.parse({
      ...data,
      createdAt: data.createdAt?.toDate?.() ?? new Date(),
      updatedAt: data.updatedAt?.toDate?.() ?? new Date(),
      harvestDate: data.harvestDate?.toDate?.(),
      statusHistory: Array.isArray(data.statusHistory)
        ? data.statusHistory.map((item) =>
            StatusHistoryItemSchema.parse({
              ...item,
              timestamp: item.timestamp?.toDate?.() ?? new Date(),
            })
          )
        : [],
    });
  },
};

export const productsCol = firestore()
  .collection('products')
  .withConverter(productConverter);
