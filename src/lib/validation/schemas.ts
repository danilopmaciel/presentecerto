import { z } from 'zod';

export const rsvpSchema = z.object({
  event_id: z.string().uuid(),
  guest_name: z.string().min(2).max(120),
  guest_email: z.string().email().optional().or(z.literal('')),
  guest_phone: z.string().min(8).max(20).optional().or(z.literal('')),
  adults: z.coerce.number().int().min(0).max(20).default(1),
  children: z.coerce.number().int().min(0).max(20).default(0),
  note: z.string().max(500).optional().or(z.literal(''))
});

export const purchaseSchema = z.object({
  gift_item_id: z.string().uuid(),
  quotas: z.coerce.number().int().min(1).max(50),
  buyer_name: z.string().min(2).max(120),
  buyer_email: z.string().email().optional().or(z.literal('')),
  buyer_phone: z.string().min(8).max(20).optional().or(z.literal('')),
  rsvp_id: z.string().uuid().optional()
});

export const eventCreateSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().max(2000).optional().or(z.literal('')),
  starts_at: z.string().datetime(),
  location_text: z.string().max(200).optional().or(z.literal('')),
  location_maps_url: z.string().url().optional().or(z.literal('')),
  plan_tier: z.enum(['basic', 'themed']).default('basic'),
  pix_key: z.string().min(3).max(77)
});

export type RsvpInput = z.infer<typeof rsvpSchema>;
export type PurchaseInput = z.infer<typeof purchaseSchema>;
export type EventCreateInput = z.infer<typeof eventCreateSchema>;
