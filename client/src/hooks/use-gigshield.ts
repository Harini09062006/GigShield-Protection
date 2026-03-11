import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { 
  Worker, Plan, WorkerPlan, Claim, Disruption, 
  InsertWorker, InsertWorkerPlan, InsertClaim, InsertDisruption 
} from "@shared/schema";

// ----------------------------------------------------------------------
// WORKERS
// ----------------------------------------------------------------------
export function useWorkers() {
  return useQuery({
    queryKey: [api.workers.list.path],
    queryFn: async () => {
      const res = await fetch(api.workers.list.path);
      if (!res.ok) throw new Error("Failed to fetch workers");
      return res.json() as Promise<Worker[]>;
    },
  });
}

export function useWorker(id?: number) {
  return useQuery({
    queryKey: [api.workers.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.workers.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch worker");
      return res.json() as Promise<Worker>;
    },
    enabled: !!id,
  });
}

export function useCreateWorker() {
  return useMutation({
    mutationFn: async (data: InsertWorker) => {
      const res = await fetch(api.workers.create.path, {
        method: api.workers.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create worker");
      return res.json() as Promise<Worker>;
    },
  });
}

// ----------------------------------------------------------------------
// PLANS
// ----------------------------------------------------------------------
export function usePlans() {
  return useQuery({
    queryKey: [api.plans.list.path],
    queryFn: async () => {
      const res = await fetch(api.plans.list.path);
      if (!res.ok) throw new Error("Failed to fetch plans");
      return res.json() as Promise<Plan[]>;
    },
  });
}

export function useWorkerPlan(workerId?: number) {
  return useQuery({
    queryKey: [api.workerPlans.get.path, workerId],
    queryFn: async () => {
      if (!workerId) return null;
      const url = buildUrl(api.workerPlans.get.path, { workerId });
      const res = await fetch(url);
      if (!res.ok) return null;
      return res.json() as Promise<{ workerPlan: WorkerPlan; plan: Plan } | null>;
    },
    enabled: !!workerId,
  });
}

export function useCreateWorkerPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertWorkerPlan) => {
      const res = await fetch(api.workerPlans.create.path, {
        method: api.workerPlans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to subscribe to plan");
      return res.json() as Promise<WorkerPlan>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.workerPlans.get.path, variables.workerId] });
    },
  });
}

// ----------------------------------------------------------------------
// CLAIMS
// ----------------------------------------------------------------------
export function useWorkerClaims(workerId?: number) {
  return useQuery({
    queryKey: [api.claims.listByWorker.path, workerId],
    queryFn: async () => {
      if (!workerId) return [];
      const url = buildUrl(api.claims.listByWorker.path, { workerId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json() as Promise<Claim[]>;
    },
    enabled: !!workerId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClaim) => {
      const res = await fetch(api.claims.create.path, {
        method: api.claims.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create claim");
      return res.json() as Promise<Claim>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.claims.listByWorker.path, variables.workerId] });
    },
  });
}

export function useSimulatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.claims.simulatePayout.path, { id });
      const res = await fetch(url, { method: api.claims.simulatePayout.method });
      if (!res.ok) throw new Error("Failed to simulate payout");
      return res.json() as Promise<Claim>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.claims.listByWorker.path] });
    },
  });
}

// ----------------------------------------------------------------------
// DISRUPTIONS
// ----------------------------------------------------------------------
export function useCityDisruptions(city?: string) {
  return useQuery({
    queryKey: [api.disruptions.listByCity.path, city],
    queryFn: async () => {
      if (!city) return [];
      const url = buildUrl(api.disruptions.listByCity.path, { city });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch disruptions");
      return res.json() as Promise<Disruption[]>;
    },
    enabled: !!city,
  });
}

export function useTriggerDisruption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertDisruption) => {
      const res = await fetch(api.disruptions.trigger.path, {
        method: api.disruptions.trigger.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to trigger disruption");
      return res.json() as Promise<Disruption>;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.disruptions.listByCity.path, variables.city] });
      queryClient.invalidateQueries({ queryKey: [api.admin.stats.path] });
    },
  });
}

// ----------------------------------------------------------------------
// ADMIN
// ----------------------------------------------------------------------
export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path);
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json() as Promise<{
        totalWorkers: number;
        totalDisruptions: number;
        totalClaims: number;
        totalPayouts: number;
      }>;
    },
    refetchInterval: 5000, // Live updates for demo
  });
}

// ---------------------------------------------------------------
// WEATHER
// ---------------------------------------------------------------
export function useWeather(city?: string) {
  return useQuery({
    queryKey: [api.weather.getByCity.path, city],
    queryFn: async () => {
      if (!city) return null;
      const url = buildUrl(api.weather.getByCity.path, { city });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json() as Promise<{
        city: string;
        rainfall: number;
        severity: string;
        riskLevel: 'low' | 'medium' | 'high' | 'extreme';
        aqi: number;
        aqiLevel: string;
        disruptionProbability: number;
        aiRiskLevel: 'low' | 'medium' | 'high';
      }>;
    },
    enabled: !!city,
    refetchInterval: 30000, // Refresh every 30s for live demo
  });
}
