import { useEffect } from "react";
import { useLocation } from "wouter";
import { usePlans, useCreateWorkerPlan, useWorkerPlan } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { Check, ShieldAlert, Loader2 } from "lucide-react";

export default function WorkerPlans() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: plans, isLoading: plansLoading } = usePlans();
  const { data: currentPlanData } = useWorkerPlan(workerId);
  const createPlan = useCreateWorkerPlan();

  useEffect(() => {
    if (!workerId) setLocation("/");
    if (currentPlanData?.workerPlan) setLocation("/dashboard");
  }, [workerId, currentPlanData, setLocation]);

  const handleSelectPlan = async (planId: number) => {
    try {
      await createPlan.mutateAsync({
        workerId,
        planId,
        status: "active"
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  if (plansLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-6">
          <ShieldAlert size={32} />
        </div>
        <h1 className="text-4xl font-bold mb-4">Choose your protection</h1>
        <p className="text-lg text-muted-foreground">
          Select a weekly coverage plan. Premiums are deducted directly from your platform earnings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans?.map((plan, idx) => {
          const isRecommended = idx === 1; // Middle plan is recommended
          
          return (
            <div 
              key={plan.id} 
              className={`relative glass-card rounded-3xl p-8 flex flex-col ${
                isRecommended 
                  ? 'border-2 border-primary shadow-xl shadow-primary/20 scale-105 z-10' 
                  : 'hover:border-primary/50'
              } transition-all duration-300`}
            >
              {isRecommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                  Most Popular
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground min-h-[48px]">{plan.description}</p>
              </div>
              
              <div className="mb-8 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold tracking-tight text-foreground">
                  ₹{Math.round((plan.weeklyPremium / 100) * (1 + (Math.random() * 0.2)))}
                </span>
                <span className="text-muted-foreground font-medium">/ week</span>
              </div>
              <div className="text-xs text-muted-foreground mb-4">
                <p>Dynamic premium based on your city's weather risk</p>
              </div>
              
              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="font-medium">
                    Up to <strong className="text-lg">₹{plan.coverageAmount / 100}</strong> payout per event
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-muted-foreground">Covers Heavy Rain & Floods</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-green-100 text-green-600 p-1 rounded-full mt-0.5">
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <span className="text-muted-foreground">Covers Severe AQI (Pollution)</span>
                </div>
              </div>

              <button 
                onClick={() => handleSelectPlan(plan.id)}
                disabled={createPlan.isPending}
                className={`w-full px-6 py-4 rounded-xl font-bold transition-all ${
                  isRecommended 
                    ? 'bg-primary text-white shadow-lg hover:shadow-xl hover:-translate-y-1' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                {createPlan.isPending ? "Processing..." : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
