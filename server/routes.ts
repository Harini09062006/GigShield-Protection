import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup database with some initial plans if they don't exist
  setupPlans().catch(console.error);

  app.get(api.workers.list.path, async (req, res) => {
    const workersList = await storage.getWorkers();
    res.json(workersList);
  });

  app.get(api.workers.get.path, async (req, res) => {
    const worker = await storage.getWorker(Number(req.params.id));
    if (!worker) {
      return res.status(404).json({ message: "Worker not found" });
    }
    res.json(worker);
  });

  app.post(api.workers.create.path, async (req, res) => {
    try {
      const input = api.workers.create.input.parse(req.body);
      const worker = await storage.createWorker(input);
      res.status(201).json(worker);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.plans.list.path, async (req, res) => {
    const plansList = await storage.getPlans();
    res.json(plansList);
  });

  app.get(api.workerPlans.get.path, async (req, res) => {
    const plan = await storage.getWorkerPlan(Number(req.params.workerId));
    res.json(plan || null);
  });

  app.post(api.workerPlans.create.path, async (req, res) => {
    try {
      const input = api.workerPlans.create.input.parse(req.body);
      const workerPlan = await storage.createWorkerPlan(input);
      res.status(201).json(workerPlan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.claims.listByWorker.path, async (req, res) => {
    const workerClaims = await storage.getWorkerClaims(Number(req.params.workerId));
    res.json(workerClaims);
  });

  app.post(api.claims.create.path, async (req, res) => {
    try {
      const input = api.claims.create.input.parse(req.body);
      const claim = await storage.createClaim(input);
      res.status(201).json(claim);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.post(api.claims.simulatePayout.path, async (req, res) => {
    const id = Number(req.params.id);
    const claim = await storage.getClaim(id);
    if (!claim) {
      return res.status(404).json({ message: "Claim not found" });
    }
    
    // Simulate payment process
    const updatedClaim = await storage.updateClaimStatus(id, "paid");
    res.json(updatedClaim);
  });

  app.get(api.disruptions.listByCity.path, async (req, res) => {
    const ds = await storage.getDisruptions(req.params.city);
    res.json(ds);
  });

  app.post(api.disruptions.trigger.path, async (req, res) => {
    try {
      const input = api.disruptions.trigger.input.parse(req.body);
      const disruption = await storage.createDisruption(input);
      
      // Find all workers in that city and auto-generate claims if they have an active plan
      const workersList = await storage.getWorkers();
      const cityWorkers = workersList.filter(w => w.city.toLowerCase() === input.city.toLowerCase());
      
      for (const w of cityWorkers) {
        const wp = await storage.getWorkerPlan(w.id);
        if (wp && wp.workerPlan.status === 'active') {
          // Trigger a claim automatically
          await storage.createClaim({
            workerId: w.id,
            planId: wp.plan.id,
            amount: wp.plan.coverageAmount, // Use full coverage as simulation
            reason: `Parametric Trigger: ${input.type} (${input.severity})`,
            status: "pending"
          });
        }
      }
      
      res.status(201).json(disruption);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.admin.stats.path, async (req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  // Weather endpoint - Simulate OpenWeather API check
  app.get(api.weather.getByCity.path, async (req, res) => {
    const city = req.params.city;
    
    // Simulate OpenWeather API call with mock data
    // In production, this would call: https://api.openweathermap.org/data/2.5/weather?q={city}&appid={apiKey}
    const weatherData = mockWeatherData(city);
    
    // Check if rainfall exceeds threshold (> 50mm = high risk)
    const RAINFALL_THRESHOLD = 50;
    if (weatherData.rainfall > RAINFALL_THRESHOLD) {
      // Auto-trigger claims for workers in this city with active plans
      const workersList = await storage.getWorkers();
      const cityWorkers = workersList.filter(w => w.city.toLowerCase() === city.toLowerCase());
      
      for (const w of cityWorkers) {
        const wp = await storage.getWorkerPlan(w.id);
        if (wp && wp.workerPlan.status === 'active') {
          // Check if claim already exists for this event
          const existingClaims = await storage.getWorkerClaims(w.id);
          const recentClaim = existingClaims.find(c => 
            c.reason.includes('rainfall') && 
            c.createdAt && new Date(c.createdAt).getTime() > Date.now() - 3600000 // within 1 hour
          );
          
          if (!recentClaim) {
            await storage.createClaim({
              workerId: w.id,
              planId: wp.plan.id,
              amount: wp.plan.coverageAmount,
              reason: `Parametric Trigger: Heavy rainfall (${weatherData.rainfall}mm)`,
              status: "approved"
            });
          }
        }
      }
    }
    
    res.json({
      city,
      rainfall: weatherData.rainfall,
      severity: weatherData.severity,
      riskLevel: weatherData.riskLevel
    });
  });

  return httpServer;
}

// Mock OpenWeather API data - In production, call real API
function mockWeatherData(city: string) {
  // Simulate varying weather patterns per city
  const weatherPatterns: Record<string, { rainfall: number; severity: string; riskLevel: 'low' | 'medium' | 'high' | 'extreme' }> = {
    'mumbai': { rainfall: 45, severity: 'moderate', riskLevel: 'medium' },
    'bangalore': { rainfall: 25, severity: 'light', riskLevel: 'low' },
    'delhi': { rainfall: 60, severity: 'heavy', riskLevel: 'high' },
    'kolkata': { rainfall: 75, severity: 'severe', riskLevel: 'extreme' },
    'pune': { rainfall: 35, severity: 'light', riskLevel: 'low' },
  };
  
  const pattern = weatherPatterns[city.toLowerCase()];
  if (pattern) return pattern;
  
  // Random for unknown cities
  const rainfall = Math.floor(Math.random() * 100);
  const riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 
    rainfall < 20 ? 'low' : rainfall < 50 ? 'medium' : rainfall < 80 ? 'high' : 'extreme';
  
  return {
    rainfall,
    severity: riskLevel === 'low' ? 'light' : riskLevel === 'medium' ? 'moderate' : riskLevel === 'high' ? 'heavy' : 'severe',
    riskLevel
  };
}

// Helper to ensure we have plans in DB
async function setupPlans() {
  const existingPlans = await storage.getPlans();
  if (existingPlans.length === 0) {
    await storage.createPlan({
      name: "Basic Shield",
      weeklyPremium: 50, // 50 rupees
      coverageAmount: 500, // 500 rupees per incident
      description: "Basic cover for heavy rain and minor floods."
    });
    await storage.createPlan({
      name: "Pro Shield",
      weeklyPremium: 99, 
      coverageAmount: 1200, 
      description: "Extensive cover for all extreme weather disruptions."
    });
    await storage.createPlan({
      name: "Max Shield",
      weeklyPremium: 149, 
      coverageAmount: 2500, 
      description: "Premium parametric cover with fastest payouts."
    });
  }
}
