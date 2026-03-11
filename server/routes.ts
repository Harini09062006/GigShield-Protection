import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  

  app.get(api.users.list.path, async (req, res) => {
    const usersList = await storage.getUsers();
    res.json(usersList);
  });

  app.get(api.users.get.path, async (req, res) => {
    const user = await storage.getUser(Number(req.params.id));
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  });

  app.post(api.users.create.path, async (req, res) => {
    try {
      const input = api.users.create.input.parse(req.body);
      const user = await storage.createUser(input);
      res.status(201).json(user);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.policies.get.path, async (req, res) => {
    const policy = await storage.getUserPolicy(Number(req.params.userId));
    res.json(policy || null);
  });

  app.post(api.policies.create.path, async (req, res) => {
    try {
      const input = api.policies.create.input.parse(req.body);
      const policy = await storage.createPolicy(input);
      res.status(201).json(policy);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.claims.listByUser.path, async (req, res) => {
    const userClaims = await storage.getUserClaims(Number(req.params.userId));
    res.json(userClaims);
  });

  app.post(api.claims.create.path, async (req, res) => {
    try {
      const input = api.claims.create.input.parse(req.body);
      
      const claim = await storage.createClaim({
        ...input,
        status: 'pending'
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


  app.get(api.admin.stats.path, async (req, res) => {
    const stats = await storage.getAdminStats();
    res.json(stats);
  });

  // Auth - Login by phone number
  app.post(api.auth.login.path, async (req, res) => {
    try {
      const input = api.auth.login.input.parse(req.body);
      const user = await storage.getUserByPhone(input.phone);
      
      if (!user) {
        return res.status(404).json({ message: "User not found. Please register first." });
      }
      
      const userClaims = await storage.getUserClaims(user.id);
      res.json({ worker: user, claims: userClaims });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // Weather endpoint - Simulate OpenWeather API check
  app.get(api.weather.getByCity.path, async (req, res) => {
    const city = req.params.city;
    
    // Simulate OpenWeather API call with mock data
    const weatherData = mockWeatherData(city);
    
    // Auto-trigger claims disabled in simplified schema
    
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

