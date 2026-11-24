import { z } from "zod";

export const CreateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Collection name must be at least 2 characters")
    .max(150, "Collection name must not exceed 150 characters"),
  description: z
    .string()
    .trim()
    .max(255, "Description must not exceed 255 characters")
    .optional(),
});
export type CreateCollectionInput = z.infer<typeof CreateCollectionSchema>;

export const UpdateCollectionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Collection name must be at least 2 characters")
    .max(150, "Collection name must not exceed 150 characters")
    .optional(),
  description: z
    .string()
    .trim()
    .max(255, "Description must not exceed 255 characters")
    .nullable()
    .optional(),
});
export type UpdateCollectionInput = z.infer<typeof UpdateCollectionSchema>;

export const AddCollectionItemSchema = z.object({
  questionId: z.string().uuid("Invalid question ID format"),
});
export type AddCollectionItemInput = z.infer<typeof AddCollectionItemSchema>;

export const CollectionIdParamSchema = z.object({
  id: z.string().uuid("Invalid collection ID format"),
});
export type CollectionIdParam = z.infer<typeof CollectionIdParamSchema>;

export const CollectionItemParamSchema = z.object({
  id: z.string().uuid("Invalid collection ID format"),
  questionId: z.string().uuid("Invalid question ID format"),
});
export type CollectionItemParam = z.infer<typeof CollectionItemParamSchema>;
