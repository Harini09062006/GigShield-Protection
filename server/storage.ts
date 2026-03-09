import { db } from "./db";
import { 
  workers, plans, workerPlans, claims, disruptions,
  type Worker, type Plan, type WorkerPlan, type Claim, type Disruption,
  type InsertWorker, type InsertPlan, type InsertWorkerPlan, type InsertClaim, type InsertDisruption
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Workers
  getWorkers(): Promise<Worker[]>;
  getWorker(id: number): Promise<Worker | undefined>;
  createWorker(worker: InsertWorker): Promise<Worker>;
  
  // Plans
  getPlans(): Promise<Plan[]>;
  getPlan(id: number): Promise<Plan | undefined>;
  createPlan(plan: InsertPlan): Promise<Plan>;
  
  // Worker Plans
  getWorkerPlan(workerId: number): Promise<{ workerPlan: WorkerPlan, plan: Plan } | undefined>;
  createWorkerPlan(workerPlan: InsertWorkerPlan): Promise<WorkerPlan>;
  
  // Claims
  getWorkerClaims(workerId: number): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaim(id: number): Promise<Claim | undefined>;
  updateClaimStatus(id: number, status: string): Promise<Claim | undefined>;
  
  // Disruptions
  getDisruptions(city: string): Promise<Disruption[]>;
  createDisruption(disruption: InsertDisruption): Promise<Disruption>;
  
  // Admin
  getAdminStats(): Promise<{ totalWorkers: number; totalDisruptions: number; totalClaims: number; totalPayouts: number }>;
}

export class DatabaseStorage implements IStorage {
  // Workers
  async getWorkers(): Promise<Worker[]> {
    return await db.select().from(workers).orderBy(desc(workers.createdAt));
  }
  async getWorker(id: number): Promise<Worker | undefined> {
    const [worker] = await db.select().from(workers).where(eq(workers.id, id));
    return worker;
  }
  async createWorker(worker: InsertWorker): Promise<Worker> {
    const [newWorker] = await db.insert(workers).values(worker).returning();
    return newWorker;
  }
  
  // Plans
  async getPlans(): Promise<Plan[]> {
    return await db.select().from(plans);
  }
  async getPlan(id: number): Promise<Plan | undefined> {
    const [plan] = await db.select().from(plans).where(eq(plans.id, id));
    return plan;
  }
  async createPlan(plan: InsertPlan): Promise<Plan> {
    const [newPlan] = await db.insert(plans).values(plan).returning();
    return newPlan;
  }

  // Worker Plans
  async getWorkerPlan(workerId: number): Promise<{ workerPlan: WorkerPlan, plan: Plan } | undefined> {
    const [result] = await db
      .select()
      .from(workerPlans)
      .innerJoin(plans, eq(workerPlans.planId, plans.id))
      .where(eq(workerPlans.workerId, workerId))
      .orderBy(desc(workerPlans.startDate))
      .limit(1);
    
    if (!result) return undefined;
    return { workerPlan: result.worker_plans, plan: result.plans };
  }
  async createWorkerPlan(workerPlan: InsertWorkerPlan): Promise<WorkerPlan> {
    // End active plans for this worker if any
    await db.update(workerPlans)
      .set({ status: 'expired' })
      .where(eq(workerPlans.workerId, workerPlan.workerId));
      
    const [newWorkerPlan] = await db.insert(workerPlans).values(workerPlan).returning();
    return newWorkerPlan;
  }

  // Claims
  async getWorkerClaims(workerId: number): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.workerId, workerId)).orderBy(desc(claims.createdAt));
  }
  async createClaim(claim: InsertClaim): Promise<Claim> {
    const [newClaim] = await db.insert(claims).values(claim).returning();
    return newClaim;
  }
  async getClaim(id: number): Promise<Claim | undefined> {
    const [claim] = await db.select().from(claims).where(eq(claims.id, id));
    return claim;
  }
  async updateClaimStatus(id: number, status: string): Promise<Claim | undefined> {
    const [claim] = await db.update(claims).set({ status }).where(eq(claims.id, id)).returning();
    return claim;
  }

  // Disruptions
  async getDisruptions(city: string): Promise<Disruption[]> {
    return await db.select().from(disruptions).where(eq(disruptions.city, city)).orderBy(desc(disruptions.createdAt));
  }
  async createDisruption(disruption: InsertDisruption): Promise<Disruption> {
    const [newDisruption] = await db.insert(disruptions).values(disruption).returning();
    return newDisruption;
  }

  // Admin
  async getAdminStats(): Promise<{ totalWorkers: number; totalDisruptions: number; totalClaims: number; totalPayouts: number }> {
    const workersResult = await db.select({ count: sql<number>`count(*)` }).from(workers);
    const disruptionsResult = await db.select({ count: sql<number>`count(*)` }).from(disruptions);
    const claimsResult = await db.select({ count: sql<number>`count(*)` }).from(claims);
    const payoutsResult = await db.select({ total: sql<number>`sum(${claims.amount})` }).from(claims).where(eq(claims.status, 'paid'));

    return {
      totalWorkers: Number(workersResult[0]?.count || 0),
      totalDisruptions: Number(disruptionsResult[0]?.count || 0),
      totalClaims: Number(claimsResult[0]?.count || 0),
      totalPayouts: Number(payoutsResult[0]?.total || 0),
    };
  }
}

export const storage = new DatabaseStorage();
