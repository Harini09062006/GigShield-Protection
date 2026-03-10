import { pgTable, text, serial, integer, boolean, timestamp, numeric } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const workers = pgTable("workers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  platform: text("platform").notNull(), // Swiggy, Zomato, Amazon, etc.
  city: text("city").notNull(),
  lat: numeric("lat"),
  lng: numeric("lng"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  weeklyPremium: integer("weekly_premium").notNull(), // in cents/rupees
  coverageAmount: integer("coverage_amount").notNull(),
  description: text("description").notNull(),
});

export const workerPlans = pgTable("worker_plans", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  planId: integer("plan_id").notNull(),
  status: text("status").notNull().default('active'), // active, expired
  startDate: timestamp("start_date").defaultNow(),
});

export const claims = pgTable("claims", {
  id: serial("id").primaryKey(),
  workerId: integer("worker_id").notNull(),
  planId: integer("plan_id").notNull(),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  status: text("status").notNull().default('pending'), // pending, approved, paid, rejected
  fraudStatus: text("fraud_status").default('pending'), // pending, verified, suspicious, failed
  fraudDetails: text("fraud_details"), // JSON string or text details
  createdAt: timestamp("created_at").defaultNow(),
});

export const disruptions = pgTable("disruptions", {
  id: serial("id").primaryKey(),
  city: text("city").notNull(),
  type: text("type").notNull(), // rain, flood, pollution
  severity: text("severity").notNull(), // high, severe
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertWorkerSchema = createInsertSchema(workers).omit({ id: true, createdAt: true });
export const insertPlanSchema = createInsertSchema(plans).omit({ id: true });
export const insertWorkerPlanSchema = createInsertSchema(workerPlans).omit({ id: true, startDate: true });
export const insertClaimSchema = createInsertSchema(claims).omit({ id: true, createdAt: true });
export const insertDisruptionSchema = createInsertSchema(disruptions).omit({ id: true, createdAt: true });

export type Worker = typeof workers.$inferSelect;
export type Plan = typeof plans.$inferSelect;
export type WorkerPlan = typeof workerPlans.$inferSelect;
export type Claim = typeof claims.$inferSelect;
export type Disruption = typeof disruptions.$inferSelect;

export type InsertWorker = z.infer<typeof insertWorkerSchema>;
export type InsertPlan = z.infer<typeof insertPlanSchema>;
export type InsertWorkerPlan = z.infer<typeof insertWorkerPlanSchema>;
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type InsertDisruption = z.infer<typeof insertDisruptionSchema>;
