import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import confetti from "canvas-confetti";
import { 
  useWorker, useWorkerPlan, useWorkerClaims, 
  useCityDisruptions, useTriggerDisruption, useCreateClaim, useSimulatePayout, useWeather
} from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { 
  ShieldCheck, AlertTriangle, CloudRain, Wind, 
  Activity, CheckCircle2, Clock, Wallet, Info, Droplets, ArrowRight, Brain, TrendingUp, AlertCircle, MapPin, Shield
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function WorkerDashboard() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: worker, isLoading: workerLoading } = useWorker(workerId);
  const { data: planData, isLoading: planLoading } = useWorkerPlan(workerId);
  const { data: claims } = useWorkerClaims(workerId);
  const { data: disruptions } = useCityDisruptions(worker?.city);
  const { data: weatherData } = useWeather(worker?.city);

  const triggerDisruption = useTriggerDisruption();
  const createClaim = useCreateClaim();
  const simulatePayout = useSimulatePayout();

  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState("");

  useEffect(() => {
    if (!workerId) setLocation("/");
    // Redirect to plans if registered but no plan
    if (!planLoading && !planData?.workerPlan) setLocation("/plans");
  }, [workerId, planData, planLoading, setLocation]);

  const handleSimulateWeather = async () => {
    if (!worker || !planData) return;
    setSimulating(true);
    setSimulationStep("Detecting weather anomaly...");

    try {
      // 1. Trigger Disruption
      await triggerDisruption.mutateAsync({
        city: worker.city,
        type: "rain",
        severity: "severe",
        active: true
      });
      
      setSimulationStep("Severe rain detected! Auto-filing claim...");
      await new Promise(r => setTimeout(r, 1500)); // Visual delay

      // 2. Create Claim
      const newClaim = await createClaim.mutateAsync({
        workerId: worker.id,
        planId: planData.plan.id,
        amount: planData.plan.coverageAmount,
        reason: `Parametric trigger: Severe rain in ${worker.city}`
      });

      setSimulationStep("Claim approved! Initiating smart contract payout...");
      await new Promise(r => setTimeout(r, 1500));

      // 3. Simulate Payout
      await simulatePayout.mutateAsync(newClaim.id);
      
      setSimulationStep("Funds transferred successfully!");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#4f46e5', '#10b981']
      });

      setTimeout(() => setSimulating(false), 2000);
    } catch (error) {
      console.error(error);
      setSimulationStep("Error during simulation");
      setTimeout(() => setSimulating(false), 2000);
    }
  };

  if (workerLoading || planLoading) return null;
  if (!worker || !planData) return null;

  const activeDisruptions = disruptions?.filter(d => d.active) || [];
  const hasAlert = activeDisruptions.length > 0;

  return (
    <Layout isWorker>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {worker.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Active on {worker.platform} in {worker.city}
          </p>
        </div>
        <button 
          onClick={handleSimulateWeather}
          disabled={simulating}
          className="px-6 py-3 rounded-xl font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
        >
          {simulating ? <Activity className="animate-spin" size={18}/> : <CloudRain size={18}/>}
          {simulating ? simulationStep : "Simulate Severe Weather"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Active Protection Card */}
        <div className="rounded-[16px] p-6 bg-gradient-to-br from-primary to-indigo-600 text-white shadow-md hover:shadow-lg transition-shadow flex flex-col h-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">Active Protection</h3>
            <ShieldCheck size={24} />
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <p className="text-sm text-blue-100 mb-3 font-medium">{planData.plan.name}</p>
              <p className="text-sm text-blue-100 line-clamp-2 mb-6">{planData.plan.description}</p>
            </div>

            <div className="space-y-3">
              <div className="bg-white/15 rounded-[12px] p-4 backdrop-blur-sm">
                <p className="text-xs text-blue-100 font-medium mb-2">Max Payout / Event</p>
                <p className="text-2xl font-bold">₹{planData.plan.coverageAmount / 100}</p>
              </div>
              <div className="bg-white/15 rounded-[12px] p-4 backdrop-blur-sm">
                <p className="text-xs text-blue-100 font-medium mb-2">Weekly Premium</p>
                <p className="text-2xl font-bold">₹{planData.plan.weeklyPremium / 100}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Risk Prediction Card */}
        <div className="rounded-[16px] p-6 bg-gradient-to-br from-purple-50 to-blue-50 shadow-md hover:shadow-lg transition-shadow flex flex-col h-80 border border-purple-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">AI Risk Prediction</h3>
            <Brain size={24} className="text-purple-600" />
          </div>

          {weatherData ? (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="bg-white rounded-[12px] p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Rainfall</p>
                <p className="text-2xl font-bold text-foreground">{weatherData.rainfall}mm</p>
              </div>

              <div className="bg-white rounded-[12px] p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">AQI Level</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-foreground">{weatherData.aqi}</p>
                  <p className="text-xs text-muted-foreground">{weatherData.aqiLevel}</p>
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Disruption Probability</p>
                <p className="text-2xl font-bold text-foreground mb-2">{weatherData.disruptionProbability}%</p>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      weatherData.disruptionProbability >= 70 ? 'bg-red-500' :
                      weatherData.disruptionProbability >= 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${weatherData.disruptionProbability}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Brain className="text-muted-foreground opacity-30" size={48} />
            </div>
          )}
        </div>

        {/* Weather Risk Level Card */}
        <div className={`rounded-[16px] p-6 shadow-md hover:shadow-lg transition-shadow flex flex-col h-80 border ${
          weatherData?.riskLevel === 'extreme' || weatherData?.riskLevel === 'high' 
            ? 'bg-red-50 border-red-200' 
            : weatherData?.riskLevel === 'medium'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Weather Risk Level</h3>
            <Droplets size={24} className={weatherData?.riskLevel === 'low' ? 'text-green-600' : weatherData?.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'} />
          </div>

          {weatherData ? (
            <div className="flex-1 flex flex-col justify-between space-y-3">
              <div className="bg-white rounded-[12px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-muted-foreground">Rainfall</span>
                  <span className="font-bold text-foreground">{weatherData.rainfall}mm</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className={`h-1.5 rounded-full ${
                      weatherData.riskLevel === 'low' ? 'bg-green-500' : 
                      weatherData.riskLevel === 'medium' ? 'bg-yellow-500' : 
                      weatherData.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min((weatherData.rainfall / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>

              <div className="bg-white rounded-[12px] p-4">
                <p className="text-xs text-muted-foreground font-medium mb-2">Severity</p>
                <div className="flex items-center justify-between">
                  <p className="font-bold capitalize text-foreground">{weatherData.severity}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                    weatherData.riskLevel === 'low' ? 'bg-green-100 text-green-700' :
                    weatherData.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    weatherData.riskLevel === 'high' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {weatherData.riskLevel}
                  </span>
                </div>
              </div>

              <Badge variant={
                weatherData.riskLevel === 'low' ? 'default' :
                weatherData.riskLevel === 'medium' ? 'secondary' :
                'destructive'
              } className="w-full justify-center text-xs font-bold py-2">
                {weatherData.riskLevel === 'low' ? '✅ Safe' : weatherData.riskLevel === 'medium' ? '⚠️ Caution' : '🚨 Alert'}
              </Badge>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <Wind className="text-muted-foreground opacity-30" size={48} />
            </div>
          )}
        </div>
      </div>

      {/* Disruption Alerts Section */}
      {weatherData?.activeDisruptions && weatherData.activeDisruptions.length > 0 && (
        <div className="mb-8 animate-in fade-in slide-in-from-left-4 duration-500">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <AlertCircle className="text-destructive" size={24} />
            Active Disruption Alerts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {weatherData.activeDisruptions.map((alert, idx) => (
              <Card key={idx} className="p-5 border-l-4 border-l-destructive bg-destructive/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <AlertTriangle size={48} />
                </div>
                <div className="relative z-10">
                  <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-1">{alert.type}</p>
                  <h4 className="text-lg font-bold text-foreground mb-3">{alert.detail}</h4>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                      Impact: {alert.impact}
                    </span>
                    {alert.triggered && (
                      <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Insurance Triggered
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Earnings Protection Summary */}
      {planData && worker && (
        <Card className="mb-8 rounded-3xl p-6 md:p-8 bg-gradient-to-br from-indigo-50 to-blue-50 border-l-4 border-l-indigo-600">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                <Shield size={22} className="text-indigo-600" />
                Earnings Protection Summary
              </h3>
              <p className="text-sm text-muted-foreground">Your parametric insurance coverage analysis</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Potential Income Loss */}
            <div className="bg-white rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Potential Income Loss</p>
              <p className="text-3xl font-bold text-amber-600">₹{(worker.hourlyRate * 6) / 100}</p>
              <p className="text-[10px] text-muted-foreground mt-2">Based on 6 hours × ₹{worker.hourlyRate / 100}/hr</p>
            </div>

            {/* Insurance Coverage Amount */}
            <div className="bg-white rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Insurance Coverage</p>
              <p className="text-3xl font-bold text-green-600">₹{planData.plan.coverageAmount / 100}</p>
              <p className="text-[10px] text-muted-foreground mt-2">{planData.plan.name} max payout</p>
            </div>

            {/* Remaining Risk */}
            <div className="bg-white rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 tracking-wider">Remaining Risk</p>
              <p className={`text-3xl font-bold ${
                (worker.hourlyRate * 6) - planData.plan.coverageAmount > 0 
                  ? 'text-red-600' 
                  : 'text-green-600'
              }`}>
                ₹{Math.max(0, (worker.hourlyRate * 6 - planData.plan.coverageAmount) / 100)}
              </p>
              <p className="text-[10px] text-muted-foreground mt-2">
                {(worker.hourlyRate * 6) > planData.plan.coverageAmount 
                  ? "Unprotected amount" 
                  : "Fully covered"}
              </p>
            </div>
          </div>

          {(worker.hourlyRate * 6) > planData.plan.coverageAmount && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-medium text-amber-800">
                <span className="font-bold">⚠️ Tip:</span> Consider upgrading to a higher plan to cover potential income losses completely.
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Claims Summary & Quick Link */}
      <Card className="rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Wallet size={20} className="text-primary" /> Claims & Payouts
            </h3>
            <p className="text-muted-foreground text-sm">
              {!claims || claims.length === 0 
                ? "No claims yet - you're all covered!" 
                : `You have ${claims.length} claim${claims.length > 1 ? 's' : ''} on record`
              }
            </p>
            {worker?.hourlyRate && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-border/50 inline-block">
                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Worker Earnings Model</p>
                <p className="text-sm font-bold text-foreground">Avg. Hourly Income: <span className="text-primary">₹{worker.hourlyRate / 100}</span></p>
              </div>
            )}
          </div>
          <Link href="/claims">
            <Button className="gap-2 whitespace-nowrap">
              View Full History <ArrowRight size={16} />
            </Button>
          </Link>
        </div>

        {claims && claims.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
            <div className="text-center p-3 bg-white rounded-2xl border border-border/50">
              <p className="text-2xl font-bold text-primary">{claims.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Claims</p>
            </div>
            <div className="text-center p-3 bg-white rounded-2xl border border-border/50">
              <p className="text-2xl font-bold text-green-600">₹{claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) / 100}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Payout</p>
            </div>
            <div className="text-center p-3 bg-white rounded-2xl border border-border/50">
              <p className="text-2xl font-bold text-blue-600">{claims.reduce((sum, c) => sum + (c.hoursLost || 0), 0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Total Hours Lost</p>
            </div>
            <div className="text-center p-3 bg-white rounded-2xl border border-border/50">
              <p className="text-2xl font-bold text-purple-600">₹{(claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) / (claims.reduce((sum, c) => sum + (c.hoursLost || 1), 0) || 1)).toFixed(0)}</p>
              <p className="text-xs text-muted-foreground mt-1">Avg. Payout/Hr</p>
            </div>
          </div>
        )}
      </Card>
    </Layout>
  );
}
