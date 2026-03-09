import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import confetti from "canvas-confetti";
import { 
  useWorker, useWorkerPlan, useWorkerClaims, 
  useCityDisruptions, useTriggerDisruption, useCreateClaim, useSimulatePayout 
} from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { 
  ShieldCheck, AlertTriangle, CloudRain, Wind, 
  Activity, CheckCircle2, Clock, Wallet, Info
} from "lucide-react";

export default function WorkerDashboard() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: worker, isLoading: workerLoading } = useWorker(workerId);
  const { data: planData, isLoading: planLoading } = useWorkerPlan(workerId);
  const { data: claims } = useWorkerClaims(workerId);
  const { data: disruptions } = useCityDisruptions(worker?.city);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Plan Status Card */}
        <div className="lg:col-span-2 glass-card rounded-3xl p-6 md:p-8 bg-gradient-to-br from-primary to-indigo-600 text-white relative overflow-hidden shadow-xl shadow-primary/20">
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

        {/* Live Weather Risk Card */}
        <div className={`glass-card rounded-3xl p-6 md:p-8 flex flex-col ${hasAlert ? 'border-destructive/50 shadow-destructive/10' : ''}`}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Activity size={20} className={hasAlert ? "text-destructive" : "text-primary"} /> 
            Live Risk Status
          </h3>
          
          {hasAlert ? (
            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4 animate-pulse">
                <AlertTriangle size={32} />
              </div>
              <h4 className="text-xl font-bold text-destructive mb-2">Severe Weather Alert</h4>
              <p className="text-muted-foreground text-sm">
                {activeDisruptions[0].type.toUpperCase()} alert for {worker.city}. Stay safe! If conditions worsen, a claim will trigger automatically.
              </p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
                <Wind size={32} />
              </div>
              <h4 className="text-xl font-bold text-green-600 mb-2">All Clear</h4>
              <p className="text-muted-foreground text-sm">
                Weather conditions in {worker.city} are normal. Safe riding!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Claims History */}
      <div className="glass-card rounded-3xl p-6 md:p-8">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Wallet size={20} className="text-primary" /> Claims & Payouts
        </h3>

        {!claims || claims.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-secondary/30">
            <ShieldCheck size={48} className="text-muted-foreground mx-auto mb-4 opacity-50" />
            <h4 className="text-lg font-semibold text-foreground mb-1">No claims yet</h4>
            <p className="text-muted-foreground text-sm">You haven't experienced any covered weather events.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 hover:bg-secondary/20 transition-colors">
                <div className="flex items-start gap-4 mb-4 sm:mb-0">
                  <div className={`mt-1 p-2 rounded-full ${
                    claim.status === 'paid' ? 'bg-green-100 text-green-600' :
                    claim.status === 'approved' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {claim.status === 'paid' ? <CheckCircle2 size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{claim.reason}</h4>
                    <p className="text-sm text-muted-foreground">
                      {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString() : 'Just now'} • ID: #{claim.id.toString().padStart(4, '0')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                  <div className="text-right">
                    <p className="text-xl font-bold text-foreground">₹{claim.amount / 100}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                    claim.status === 'paid' ? 'bg-green-100 text-green-700' :
                    claim.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {claim.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
