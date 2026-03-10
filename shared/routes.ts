import { z } from 'zod';
import { 
  insertWorkerSchema, insertPlanSchema, insertWorkerPlanSchema, 
  insertClaimSchema, insertDisruptionSchema, 
  workers, plans, workerPlans, claims, disruptions 
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  workers: {
    list: {
      method: 'GET' as const,
      path: '/api/workers' as const,
      responses: { 200: z.array(z.custom<typeof workers.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/workers/:id' as const,
      responses: { 
        200: z.custom<typeof workers.$inferSelect>(),
        404: errorSchemas.notFound 
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/workers' as const,
      input: insertWorkerSchema,
      responses: {
        201: z.custom<typeof workers.$inferSelect>(),
        400: errorSchemas.validation
      },
    },
  },
  plans: {
    list: {
      method: 'GET' as const,
      path: '/api/plans' as const,
      responses: { 200: z.array(z.custom<typeof plans.$inferSelect>()) },
    },
  },
  workerPlans: {
    get: {
      method: 'GET' as const,
      path: '/api/workers/:workerId/plan' as const,
      responses: {
        200: z.object({
          workerPlan: z.custom<typeof workerPlans.$inferSelect>(),
          plan: z.custom<typeof plans.$inferSelect>()
        }).nullable(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/worker-plans' as const,
      input: insertWorkerPlanSchema,
      responses: {
        201: z.custom<typeof workerPlans.$inferSelect>(),
        400: errorSchemas.validation
      },
    },
  },
  claims: {
    listByWorker: {
      method: 'GET' as const,
      path: '/api/workers/:workerId/claims' as const,
      responses: { 200: z.array(z.custom<typeof claims.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/claims' as const,
      input: insertClaimSchema,
      responses: {
        201: z.custom<typeof claims.$inferSelect>(),
        400: errorSchemas.validation
      },
    },
    simulatePayout: {
      method: 'POST' as const,
      path: '/api/claims/:id/simulate' as const,
      responses: {
        200: z.custom<typeof claims.$inferSelect>(),
        404: errorSchemas.notFound
      },
    }
  },
  disruptions: {
    listByCity: {
      method: 'GET' as const,
      path: '/api/disruptions/:city' as const,
      responses: { 200: z.array(z.custom<typeof disruptions.$inferSelect>()) },
    },
    trigger: {
      method: 'POST' as const,
      path: '/api/disruptions/trigger' as const, // Admin/system triggers a weather alert
      input: insertDisruptionSchema,
      responses: {
        201: z.custom<typeof disruptions.$inferSelect>(),
        400: errorSchemas.validation
      }
    }
  },
  weather: {
    getByCity: {
      method: 'GET' as const,
      path: '/api/weather/:city' as const,
      responses: {
        200: z.object({
          city: z.string(),
          rainfall: z.number(),
          severity: z.string(),
          riskLevel: z.enum(['low', 'medium', 'high', 'extreme']),
          aqi: z.number(),
          aqiLevel: z.string(),
          disruptionProbability: z.number(),
          aiRiskLevel: z.enum(['low', 'medium', 'high']),
          activeDisruptions: z.array(z.object({
            type: z.string(),
            detail: z.string(),
            impact: z.enum(['Low', 'Medium', 'High']),
            triggered: z.boolean()
          })).optional(),
        }),
        404: errorSchemas.notFound
      }
    }
  },
  admin: {
    stats: {
      method: 'GET' as const,
      path: '/api/admin/stats' as const,
      responses: {
        200: z.object({
          totalWorkers: z.number(),
          totalDisruptions: z.number(),
          totalClaims: z.number(),
          totalPayouts: z.number(),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
