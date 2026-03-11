import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import confetti from "canvas-confetti";
import { useUser, useUserPolicy, useUserClaims, useCreateClaim, useSimulatePayout, useWeatherByCity } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { 
  ShieldCheck, AlertTriangle, CloudRain, Activity, CheckCircle2, Clock, Wallet, 
  Droplets, ArrowRight, Brain, TrendingUp, AlertCircle, MapPin, Shield, Calendar, Bell, Zap, History
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

export default function WorkerDashboard() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: user, isLoading: userLoading } = useUser(workerId);
  const { data: policy, isLoading: policyLoading } = useUserPolicy(workerId);
  const { data: claims = [] } = useUserClaims(workerId);
  const { data: weatherData } = useWeatherByCity(user?.city);

  const createClaim = useCreateClaim();
  const simulatePayout = useSimulatePayout();

  const [simulating, setSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState("");
  const [showAIExplanation, setShowAIExplanation] = useState(false);

  useEffect(() => {
    if (!workerId) setLocation("/");
    if (!policyLoading && !policy) setLocation("/plans");
  }, [workerId, policy, policyLoading, setLocation]);

  const handleSimulateWeather = async () => {
    if (!user || !policy) return;
    setSimulating(true);
    setSimulationStep("Detecting weather anomaly...");

    try {
      setSimulationStep("Severe rain detected! Auto-filing claim...");
      await new Promise(r => setTimeout(r, 1500));

      const newClaim = await createClaim.mutateAsync({
        userId: user.id,
        eventType: "Heavy Rain",
        city: user.city,
        hoursLost: 3,
        compensationAmount: Math.floor(policy.maxPayout * 0.5),
        status: "approved"
      });

      setSimulationStep("Claim approved! Initiating smart contract payout...");
      await new Promise(r => setTimeout(r, 1500));

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

  if (userLoading || policyLoading) return null;
  if (!user || !policy) return null;

  const activeDisruptions = weatherData?.activeDisruptions?.filter((d: any) => d.triggered) || [];
  const hasAlert = activeDisruptions.length > 0;
  const recentClaims = claims.slice(0, 5);

  return (
    <Layout isWorker>
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {user.name}</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
            Active on {user.platform} in {user.city}
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

      {/* Real-Time Disruption Alert Panel */}
      {hasAlert && (
        <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-[16px] p-6 shadow-lg border-l-4 border-l-red-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full">
                  <Bell className="animate-pulse" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">🚨 Real-Time Disruption Alert</h2>
                  <p className="text-red-100 text-sm">Active disruptions detected in your delivery area</p>
                </div>
              </div>
              <Zap className="text-yellow-300 animate-bounce" size={28} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeDisruptions.map((alert: any, idx: number) => (
                <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-[12px] p-4 border border-white/20">
                  <p className="text-lg font-bold text-white mb-2">{alert.type}</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-red-100">{alert.detail}</p>
                    <p className="text-red-100 flex items-center gap-1">
                      <MapPin size={14} /> {user.city}
                    </p>
                    <p className={`font-bold ${alert.impact === 'High' ? 'text-red-200' : 'text-yellow-200'}`}>
                      Impact: {alert.impact}
                    </p>
                  </div>
                  {alert.triggered && (
                    <div className="mt-3 p-2 bg-green-500/20 border border-green-300/50 rounded-[8px]">
                      <p className="text-xs font-bold text-green-200 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Insurance Triggered
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 auto-rows-max">
        {/* Active Protection Card */}
        <div className="w-full aspect-square rounded-[16px] p-6 bg-gradient-to-br from-[#6C5CE7] to-[#8E7CFF] text-white shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Active Protection</h3>
              <ShieldCheck size={24} />
            </div>
            <p className="text-sm text-blue-100 font-medium mb-1">{policy.planName}</p>
            <p className="text-xs text-blue-100">Premium: ₹{(policy.weeklyPremium / 100).toFixed(0)}/week</p>
          </div>

          <div className="space-y-2">
            <div className="bg-white/15 rounded-[12px] p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-100 font-medium mb-1">Max Coverage</p>
              <p className="text-xl font-bold text-white">₹{(policy.maxPayout / 100).toFixed(0)}</p>
            </div>
            <div className="bg-white/15 rounded-[12px] p-3 backdrop-blur-sm">
              <p className="text-xs text-blue-100 font-medium mb-1">Status</p>
              <p className="text-sm font-bold text-white capitalize">{policy.status}</p>
            </div>
          </div>
        </div>

        {/* Weather & Risk Card */}
        {weatherData && (
          <div className="w-full rounded-[16px] p-6 bg-gradient-to-br from-sky-400 to-cyan-500 text-white shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Weather Conditions</h3>
                <CloudRain size={24} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="bg-white/15 rounded-[12px] p-3 backdrop-blur-sm">
                <p className="text-xs text-sky-100 font-medium mb-1">Rainfall</p>
                <p className="text-2xl font-bold text-white">{weatherData.rainfall}mm</p>
              </div>
              <div className="bg-white/15 rounded-[12px] p-3 backdrop-blur-sm">
                <p className="text-xs text-sky-100 font-medium mb-1">Air Quality</p>
                <p className="text-xl font-bold text-white">AQI {weatherData.aqi}</p>
              </div>
              <div className="bg-white/15 rounded-[12px] p-3 backdrop-blur-sm">
                <p className="text-xs text-sky-100 font-medium mb-1">Risk Level</p>
                <p className="text-sm font-bold text-white capitalize">{weatherData.aiRiskLevel}</p>
              </div>
            </div>
          </div>
        )}

        {/* AI Risk Model Card */}
        <div className="w-full rounded-[16px] p-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md hover:shadow-lg transition-shadow flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">AI Risk Model</h3>
              <Brain size={24} />
            </div>
            <p className="text-xs text-indigo-100">Real-time disruption probability</p>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setShowAIExplanation(!showAIExplanation)}
              className="w-full bg-white/15 hover:bg-white/25 rounded-[12px] p-3 backdrop-blur-sm transition-all text-left flex items-center justify-between"
            >
              <div>
                <p className="text-xs text-indigo-100 font-medium mb-1">Disruption Probability</p>
                <p className="text-xl font-bold text-white">{weatherData?.disruptionProbability || '0'}%</p>
              </div>
              <ChevronDown size={20} className={`transition-transform ${showAIExplanation ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showAIExplanation && (
            <div className="mt-4 pt-4 border-t border-white/20 space-y-2 text-xs text-indigo-100">
              <div><span className="font-semibold">• Rainfall Impact:</span> High rainfall increases disruption probability</div>
              <div><span className="font-semibold">• Air Quality:</span> Severe pollution affects delivery zones</div>
              <div><span className="font-semibold">• Historical Data:</span> Pattern matching with past events</div>
              <div><span className="font-semibold">• Real-time Updates:</span> Weather API data every 15 minutes</div>
            </div>
          )}
        </div>
      </div>

      {/* Claim History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <History size={24} />
            Recent Claims
          </h2>
          <Link href="/claims" className="text-primary font-semibold hover:underline">
            View All
          </Link>
        </div>

        {recentClaims.length === 0 ? (
          <Card className="p-8 text-center">
            <ShieldCheck size={40} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No claims yet. You're protected!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {recentClaims.map((claim) => (
              <Card key={claim.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      claim.status === 'paid' ? 'bg-green-100' :
                      claim.status === 'approved' ? 'bg-blue-100' :
                      'bg-yellow-100'
                    }`}>
                      {claim.status === 'paid' ? 
                        <CheckCircle2 className="text-green-600" size={20} /> :
                        claim.status === 'approved' ?
                        <Clock className="text-blue-600" size={20} /> :
                        <AlertCircle className="text-yellow-600" size={20} />
                      }
                    </div>
                    <div>
                      <h4 className="font-semibold">{claim.eventType}</h4>
                      <p className="text-sm text-muted-foreground">{claim.city} • {claim.hoursLost}h lost</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">₹{(claim.compensationAmount / 100).toFixed(0)}</p>
                    <p className={`text-xs font-semibold ${
                      claim.status === 'paid' ? 'text-green-600' :
                      claim.status === 'approved' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {claim.status.toUpperCase()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
