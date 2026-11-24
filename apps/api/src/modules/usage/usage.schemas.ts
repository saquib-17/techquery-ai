import { z } from "zod";
import { UserTier } from "@prisma/client";

export const UpdateTierSchema = z.object({
  tier: z.nativeEnum(UserTier, {
    message: "Tier must be either FREE or PRO",
  }),
});

export type UpdateTierInput = z.infer<typeof UpdateTierSchema>;
