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
      
      // Run Fraud Detection Logic
      const worker = await storage.getWorker(input.workerId);
      const weather = await mockWeatherData(worker?.city || "");
      
      const fraudResult = validateClaimFraud(worker, weather, input.reason);
      
      // Calculate income loss based on disruption
      const hourlyRate = worker?.hourlyRate || 6000;
      const hoursLost = Math.floor(Math.random() * 4) + 1; // Simulated 1-4 hours
      const incomeLoss = hoursLost * hourlyRate;

      const claim = await storage.createClaim({
        ...input,
        amount: incomeLoss,
        hoursLost,
        hourlyRateAtClaim: hourlyRate,
        status: fraudResult.success ? "approved" : "rejected",
        fraudStatus: fraudResult.success ? "verified" : "suspicious",
        fraudDetails: JSON.stringify(fraudResult.details)
      });
      
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
    
    if (claim.status === 'rejected') {
      return res.status(400).json({ message: "Cannot pay out a rejected claim" });
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
          // Verify Fraud for Auto-Trigger
          const weather = await mockWeatherData(w.city);
          const fraudResult = validateClaimFraud(w, weather, `Parametric Trigger: ${input.type}`);
          
          // Calculate income loss
          const hourlyRate = w.hourlyRate || 6000;
          const hoursLost = input.severity === 'severe' ? 4 : 2;
          const incomeLoss = hoursLost * hourlyRate;

          await storage.createClaim({
            workerId: w.id,
            planId: wp.plan.id,
            amount: incomeLoss,
            hoursLost,
            hourlyRateAtClaim: hourlyRate,
            reason: `Parametric Trigger: ${input.type} (${input.severity})`,
            status: fraudResult.success ? "approved" : "rejected",
            fraudStatus: fraudResult.success ? "verified" : "suspicious",
            fraudDetails: JSON.stringify(fraudResult.details)
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
            // Verify Fraud for Auto-Trigger
            const fraudResult = validateClaimFraud(w, weatherData, `Heavy rainfall auto-trigger`);
            
            // Calculate income loss
            const hourlyRate = w.hourlyRate || 6000;
            const hoursLost = weatherData.rainfall > 75 ? 5 : 3;
            const incomeLoss = hoursLost * hourlyRate;

            await storage.createClaim({
              workerId: w.id,
              planId: wp.plan.id,
              amount: incomeLoss,
              hoursLost,
              hourlyRateAtClaim: hourlyRate,
              reason: `Parametric Trigger: Heavy rainfall (${weatherData.rainfall}mm)`,
              status: fraudResult.success ? "approved" : "rejected",
              fraudStatus: fraudResult.success ? "verified" : "suspicious",
              fraudDetails: JSON.stringify(fraudResult.details)
            });
          }
        }
      }
    }
    
    // Calculate AI predictions
    const aiPrediction = calculateAIRiskPrediction(weatherData.rainfall);
    
    // Check for other disruption types (Simulated logic)
    const isFlood = weatherData.rainfall > 70; // Heavy rain usually causes flood in this simulation
    const isCurfew = Math.random() < 0.02; // 2% chance of curfew for demo
    
    const activeDisruptions = [];
    
    if (weatherData.rainfall > 50) {
      activeDisruptions.push({
        type: "Heavy Rain",
        detail: `${weatherData.rainfall}mm rainfall`,
        impact: "High" as const,
        triggered: true
      });
    }
    
    if (isFlood) {
      activeDisruptions.push({
        type: "Flood",
        detail: "Waterlogging detected in low-lying areas",
        impact: "High" as const,
        triggered: true
      });
    }
    
    if (aiPrediction.aqi > 200) {
      activeDisruptions.push({
        type: "Severe Pollution",
        detail: `AQI: ${aiPrediction.aqi}`,
        impact: "High" as const,
        triggered: true
      });
    }
    
    if (isCurfew) {
      activeDisruptions.push({
        type: "Curfew / Zone Closure",
        detail: "Restricted movement in selected zones",
        impact: "High" as const,
        triggered: true
      });
    }

    // Auto-trigger claims for NEW disruption types
    if (isFlood || aiPrediction.aqi > 200 || isCurfew) {
      const workersList = await storage.getWorkers();
      const cityWorkers = workersList.filter(w => w.city.toLowerCase() === city.toLowerCase());
      
      for (const w of cityWorkers) {
        const wp = await storage.getWorkerPlan(w.id);
        if (wp && wp.workerPlan.status === 'active') {
          const existingClaims = await storage.getWorkerClaims(w.id);
          const type = isFlood ? "Flood" : aiPrediction.aqi > 200 ? "Pollution" : "Curfew";
          const recentClaim = existingClaims.find(c => 
            c.reason.toLowerCase().includes(type.toLowerCase()) && 
            c.createdAt && new Date(c.createdAt).getTime() > Date.now() - 3600000
          );
          
          if (!recentClaim) {
            const fraudResult = validateClaimFraud(w, { ...weatherData, aqi: aiPrediction.aqi, isCurfew, isFlood }, `Parametric Trigger: ${type}`);
            
            const hourlyRate = w.hourlyRate || 6000;
            const hoursLost = isFlood ? 6 : isCurfew ? 8 : 4;
            const incomeLoss = hoursLost * hourlyRate;

            await storage.createClaim({
              workerId: w.id,
              planId: wp.plan.id,
              amount: incomeLoss,
              hoursLost,
              hourlyRateAtClaim: hourlyRate,
              reason: `Parametric Trigger: ${type} disruption`,
              status: fraudResult.success ? "approved" : "rejected",
              fraudStatus: fraudResult.success ? "verified" : "suspicious",
              fraudDetails: JSON.stringify(fraudResult.details)
            });
          }
        }
      }
    }
    
    res.json({
      city,
      rainfall: weatherData.rainfall,
      severity: weatherData.severity,
      riskLevel: weatherData.riskLevel,
      aqi: aiPrediction.aqi,
      aqiLevel: aiPrediction.aqiLevel,
      disruptionProbability: aiPrediction.disruptionProbability,
      aiRiskLevel: aiPrediction.aiRiskLevel,
      activeDisruptions
    });
  });

  return httpServer;
}

// Fraud Validation Logic
function validateClaimFraud(worker: any, weather: any, reason: string) {
  // 1. GPS Validation: Verify worker is in their registered city
  // (Simulated logic: 5% chance of location mismatch for demo)
  const isLocationVerified = Math.random() > 0.05;
  
  // 2. Weather Event Verification: Verify rainfall/weather matches disruption
  // (Simulated logic: Verify rainfall > 0 if reason mentions rain)
  const isWeatherConfirmed = reason.toLowerCase().includes('rain') ? weather.rainfall > 0 : true;
  
  // 3. Duplicate Claim Check: Handled by calling function checking last hour
  const isNotDuplicate = true; // Placeholder as it's checked in route logic

  const success = isLocationVerified && isWeatherConfirmed && isNotDuplicate;
  
  return {
    success,
    details: {
      gps: isLocationVerified ? "Verified" : "Location mismatch detected",
      weather: isWeatherConfirmed ? "Confirmed" : "Weather event mismatch",
      duplicate: isNotDuplicate ? "Passed" : "Duplicate detected"
    }
  };
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

// AI Risk Prediction Logic based on weather conditions
function calculateAIRiskPrediction(rainfall: number) {
  // Generate simulated AQI (Air Quality Index) - typically ranges 0-500
  // Higher rainfall usually means better air quality (0 = excellent, 500+ = hazardous)
  const baseAQI = Math.max(30, 250 - rainfall * 2); // Inverse relationship
  const aqi = Math.round(baseAQI + (Math.random() * 40 - 20)); // Add some randomness
  
  // Determine AQI level
  let aqiLevel = '';
  if (aqi <= 50) aqiLevel = 'Good';
  else if (aqi <= 100) aqiLevel = 'Satisfactory';
  else if (aqi <= 200) aqiLevel = 'Moderately Polluted';
  else if (aqi <= 300) aqiLevel = 'Poor';
  else if (aqi <= 400) aqiLevel = 'Very Poor';
  else aqiLevel = 'Severe';
  
  // Calculate disruption probability based on rainfall and AQI
  // Rainfall > 50mm OR AQI > 200 = High risk
  // Rainfall 20-50mm = Medium risk
  // Else = Low risk
  let disruptionProbability = 0;
  let aiRiskLevel: 'low' | 'medium' | 'high' = 'low';
  
  if (rainfall > 50 || aqi > 200) {
    // High risk: 70-95% disruption probability
    disruptionProbability = Math.round(70 + Math.random() * 25);
    aiRiskLevel = 'high';
  } else if (rainfall >= 20 && rainfall <= 50) {
    // Medium risk: 40-70% disruption probability
    disruptionProbability = Math.round(40 + Math.random() * 30);
    aiRiskLevel = 'medium';
  } else {
    // Low risk: 5-30% disruption probability
    disruptionProbability = Math.round(Math.random() * 25);
    aiRiskLevel = 'low';
  }
  
  return {
    aqi,
    aqiLevel,
    disruptionProbability,
    aiRiskLevel
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
