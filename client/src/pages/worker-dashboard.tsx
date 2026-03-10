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
  Activity, CheckCircle2, Clock, Wallet, Info, Droplets, ArrowRight, Brain, TrendingUp, AlertCircle, MapPin
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {/* Plan Status Card */}
        <div className="lg:col-span-1 glass-card rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden shadow-xl shadow-primary/20">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck size={200} />
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-6">
              <CheckCircle2 size={14} /> Active Protection
            </div>
            
            <h2 className="text-4xl font-bold mb-2">{planData.plan.name}</h2>
            <p className="text-blue-100 mb-8 max-w-md">{planData.plan.description}</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-blue-200 text-sm font-medium mb-1">Max Payout / Event</p>
                <p className="text-3xl font-bold">₹{planData.plan.coverageAmount / 100}</p>
              </div>
              <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-blue-200 text-sm font-medium mb-1">Premium</p>
                <p className="text-3xl font-bold">₹{planData.plan.weeklyPremium / 100} <span className="text-sm font-normal text-blue-200">/ wk</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Risk Prediction Card */}
        <Card className="rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden border-l-4 border-l-purple-500 bg-gradient-to-br from-purple-50 to-transparent">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Brain size={20} className="text-purple-600" />
            AI Risk Prediction
          </h3>
          
          {weatherData ? (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Predicted Rainfall</p>
                <div className="flex items-end justify-between">
                  <p className="font-bold text-foreground text-2xl">{weatherData.rainfall}mm</p>
                  <TrendingUp className="text-purple-500" size={20} />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">AQI Level</p>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-bold text-foreground text-2xl">{weatherData.aqi}</p>
                    <p className="text-xs text-muted-foreground">{weatherData.aqiLevel}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Disruption Probability</p>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-foreground text-2xl">{weatherData.disruptionProbability}%</p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      weatherData.disruptionProbability >= 70 ? 'bg-red-500' :
                      weatherData.disruptionProbability >= 40 ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`}
                    style={{ width: `${weatherData.disruptionProbability}%` }}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-2">
                <Badge variant={
                  weatherData.aiRiskLevel === 'high' ? 'destructive' :
                  weatherData.aiRiskLevel === 'medium' ? 'secondary' :
                  'default'
                } className="text-sm font-bold px-4 py-2 capitalize">
                  Risk: {weatherData.aiRiskLevel}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <Brain className="text-muted-foreground mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm text-muted-foreground">Analyzing weather data...</p>
            </div>
          )}
        </Card>

        {/* Live Weather & Risk Card */}
        <Card className={`rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden ${
          weatherData?.riskLevel === 'extreme' || weatherData?.riskLevel === 'high' 
            ? 'border-l-4 border-l-destructive bg-red-50/50' 
            : weatherData?.riskLevel === 'medium'
            ? 'border-l-4 border-l-yellow-500 bg-yellow-50/50'
            : 'border-l-4 border-l-green-500 bg-green-50/50'
        }`}>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 relative z-10">
            <Droplets size={20} className={weatherData?.riskLevel === 'low' ? 'text-green-600' : weatherData?.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'} />
            Weather Risk Level
          </h3>
          
          {weatherData ? (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-muted-foreground">Rainfall</span>
                  <span className="font-bold text-foreground">{weatherData.rainfall}mm</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      weatherData.riskLevel === 'low' ? 'bg-green-500' : 
                      weatherData.riskLevel === 'medium' ? 'bg-yellow-500' : 
                      weatherData.riskLevel === 'high' ? 'bg-orange-500' : 'bg-red-600'
                    }`}
                    style={{ width: `${Math.min((weatherData.rainfall / 100) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Low</span>
                  <span>Extreme</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Severity Level</p>
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

              {(weatherData.riskLevel === 'high' || weatherData.riskLevel === 'extreme') && (
                <div className="bg-red-100 border border-red-300 rounded-xl p-3 text-center">
                  <p className="text-xs font-bold text-red-700 mb-1">⚠️ Risk Alert Active</p>
                  <p className="text-xs text-red-600">Rainfall exceeds safe threshold. Claims may auto-trigger if conditions persist.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <Wind className="text-muted-foreground mx-auto mb-2 opacity-50" size={32} />
              <p className="text-sm text-muted-foreground">Loading weather data...</p>
            </div>
          )}
        </Card>
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
