import { db } from "./db";
import { 
  users, policies, claims,
  type User, type Policy, type Claim,
  type InsertUser, type InsertPolicy, type InsertClaim
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUsers(): Promise<User[]>;
  getUser(id: number): Promise<User | undefined>;
  getUserByPhone(phoneNumber: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Policies
  getUserPolicy(userId: number): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  
  // Claims
  getUserClaims(userId: number): Promise<Claim[]>;
  createClaim(claim: InsertClaim): Promise<Claim>;
  getClaim(id: number): Promise<Claim | undefined>;
  updateClaimStatus(id: number, status: string): Promise<Claim | undefined>;
  
  // Admin
  getAdminStats(): Promise<{ totalUsers: number; totalClaims: number; totalPaidOut: number }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async getUserByPhone(phoneNumber: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return user;
  }
  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }
  
  // Policies
  async getUserPolicy(userId: number): Promise<Policy | undefined> {
    const [policy] = await db
      .select()
      .from(policies)
      .where(eq(policies.userId, userId))
      .orderBy(desc(policies.activationDate))
      .limit(1);
    return policy;
  }
  async createPolicy(policy: InsertPolicy): Promise<Policy> {
    // Mark any existing active policies as expired
    await db.update(policies)
      .set({ status: 'expired' })
      .where(eq(policies.userId, policy.userId));
      
    const [newPolicy] = await db.insert(policies).values(policy).returning();
    return newPolicy;
  }

  // Claims
  async getUserClaims(userId: number): Promise<Claim[]> {
    return await db.select().from(claims).where(eq(claims.userId, userId)).orderBy(desc(claims.createdAt));
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

  // Admin
  async getAdminStats(): Promise<{ totalUsers: number; totalClaims: number; totalPaidOut: number }> {
    const usersResult = await db.select({ count: sql<number>`count(*)` }).from(users);
    const claimsResult = await db.select({ count: sql<number>`count(*)` }).from(claims);
    const paidOutResult = await db.select({ total: sql<number>`sum(${claims.compensationAmount})` }).from(claims).where(eq(claims.status, 'paid'));

    return {
      totalUsers: Number(usersResult[0]?.count || 0),
      totalClaims: Number(claimsResult[0]?.count || 0),
      totalPaidOut: Number(paidOutResult[0]?.total || 0),
    };
  }
}

export const storage = new DatabaseStorage();
