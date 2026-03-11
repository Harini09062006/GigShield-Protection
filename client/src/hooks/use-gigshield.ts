import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { InsertClaimSchema } from "@shared/schema";

// Login hook - matches backend auth response
export function useLogin() {
  return useMutation({
    mutationFn: async (phone: string) => {
      const res = await fetch(api.auth.login.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) throw new Error("Login failed");
      return res.json() as Promise<{ worker: any; claims: any[] }>;
    },
  });
}

// User hooks
export function useUsers() {
  return useQuery({
    queryKey: [api.users.list.path],
    queryFn: async () => {
      const res = await fetch(api.users.list.path);
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });
}

export function useUser(id?: number) {
  return useQuery({
    queryKey: [api.users.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.users.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.users.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.users.list.path] });
    },
  });
}

// Policy hooks
export function useUserPolicy(userId?: number) {
  return useQuery({
    queryKey: [api.policies.get.path, userId],
    queryFn: async () => {
      if (!userId) return null;
      const url = buildUrl(api.policies.get.path, { userId });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch policy");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useCreatePolicy() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(api.policies.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create policy");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.policies.get.path, data.userId] });
    },
  });
}

// Claims hooks
export function useUserClaims(userId?: number) {
  return useQuery({
    queryKey: [api.claims.listByUser.path, userId],
    queryFn: async () => {
      if (!userId) return [];
      const url = buildUrl(api.claims.listByUser.path, { userId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
    enabled: !!userId,
  });
}

export function useCreateClaim() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertClaimSchema) => {
      const res = await fetch(api.claims.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create claim");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.claims.listByUser.path, data.userId] });
    },
  });
}

export function useSimulatePayout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (claimId: number) => {
      const url = buildUrl(api.claims.simulatePayout.path, { id: claimId });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to simulate payout");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.claims.listByUser.path] });
    },
  });
}

// Weather hooks
export function useWeatherByCity(city?: string) {
  return useQuery({
    queryKey: [api.weather.getByCity.path, city],
    queryFn: async () => {
      if (!city) return null;
      const url = buildUrl(api.weather.getByCity.path, { city });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather");
      return res.json();
    },
    enabled: !!city,
  });
}

// Admin hooks
export function useAdminStats() {
  return useQuery({
    queryKey: [api.admin.stats.path],
    queryFn: async () => {
      const res = await fetch(api.admin.stats.path);
      if (!res.ok) throw new Error("Failed to fetch admin stats");
      return res.json();
    },
  });
}
