import { z } from 'zod';
import { 
  insertUserSchema, insertPolicySchema, 
  insertClaimSchema, 
  users, policies, claims 
} from './schema';

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const api = {
  users: {
    list: {
      method: 'GET' as const,
      path: '/api/users' as const,
      responses: { 200: z.array(z.custom<typeof users.$inferSelect>()) },
    },
    get: {
      method: 'GET' as const,
      path: '/api/users/:id' as const,
      responses: { 
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound 
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/users' as const,
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation
      },
    },
  },
  policies: {
    get: {
      method: 'GET' as const,
      path: '/api/users/:userId/policy' as const,
      responses: {
        200: z.custom<typeof policies.$inferSelect>().nullable(),
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/policies' as const,
      input: insertPolicySchema,
      responses: {
        201: z.custom<typeof policies.$inferSelect>(),
        400: errorSchemas.validation
      },
    },
  },
  claims: {
    listByUser: {
      method: 'GET' as const,
      path: '/api/users/:userId/claims' as const,
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
  },
  auth: {
    login: {
      method: 'POST' as const,
      path: '/api/auth/login' as const,
      input: z.object({ phone: z.string() }),
      responses: {
        200: z.object({
          worker: z.custom<typeof workers.$inferSelect>(),
          claims: z.array(z.custom<typeof claims.$inferSelect>())
        }),
        404: errorSchemas.notFound
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
