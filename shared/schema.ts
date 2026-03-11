import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phoneNumber: text("phone_number").notNull().unique(),
  platform: text("platform").notNull(), // Swiggy, Zomato, Amazon
  city: text("city").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Policies table - stores user's selected insurance plan
export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  planName: text("plan_name").notNull(), // Basic Shield, Pro Shield, Elite Shield
  weeklyPremium: integer("weekly_premium").notNull(), // in paise
  maxPayout: integer("max_payout").notNull(), // in paise
  activationDate: timestamp("activation_date").defaultNow(),
  nextRenewalDate: timestamp("next_renewal_date"),
  status: text("status").notNull().default('active'), // active, expired, cancelled
});

// Claims table - records of triggered claims
export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  eventType: text("event_type").notNull(), // Heavy Rain, Flood, Pollution, Curfew
  city: text("city").notNull(),
  hoursLost: integer("hours_lost").default(0),
  compensationAmount: integer("compensation_amount").notNull(), // in paise
  status: text("status").notNull().default('pending'), // pending, approved, paid, rejected
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true, activationDate: true, nextRenewalDate: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type Policy = typeof policies.$inferSelect;
export type Claim = typeof claims.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
