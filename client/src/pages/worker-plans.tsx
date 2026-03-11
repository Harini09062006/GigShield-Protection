import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUserPolicy, useCreatePolicy, useUser } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { Check, ShieldAlert, Loader2 } from "lucide-react";

const STATIC_PLANS = [
  { id: 1, name: "Basic Shield", weeklyPremium: 5000, maxPayout: 50000, coverage: "Basic weather protection" },
  { id: 2, name: "Pro Shield", weeklyPremium: 9900, maxPayout: 120000, coverage: "Extended weather + flood protection" },
  { id: 3, name: "Max Shield", weeklyPremium: 14900, maxPayout: 250000, coverage: "Full parametric + fraud detection" }
];

export default function WorkerPlans() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: user, isLoading: userLoading } = useUser(workerId);
  const { data: currentPolicy } = useUserPolicy(workerId);
  const createPolicy = useCreatePolicy();

  useEffect(() => {
    if (!workerId) setLocation("/");
    if (currentPolicy) setLocation("/dashboard");
  }, [workerId, currentPolicy, setLocation]);

  const handleSelectPlan = async (plan: typeof STATIC_PLANS[0]) => {
    try {
      await createPolicy.mutateAsync({
        userId: workerId,
        planName: plan.name,
        weeklyPremium: plan.weeklyPremium,
        maxPayout: plan.maxPayout,
        activationDate: new Date().toISOString(),
        nextRenewalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active"
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  if (userLoading) {
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
        <p className="text-lg text-muted-foreground">Select a plan that fits your delivery needs. Coverage activates immediately.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {STATIC_PLANS.map((plan) => (
          <div key={plan.id} className="glass-card p-8 rounded-3xl flex flex-col gap-6 hover:shadow-xl transition-all">
            <div>
              <h2 className="text-2xl font-bold mb-2">{plan.name}</h2>
              <p className="text-muted-foreground text-sm">{plan.coverage}</p>
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold">₹{(plan.weeklyPremium / 100).toFixed(0)}</span>
              <span className="text-muted-foreground">/week</span>
            </div>

            <div className="flex items-center gap-3 bg-secondary/20 p-4 rounded-xl">
              <span className="text-sm font-semibold">Max Coverage:</span>
              <span className="text-lg font-bold text-primary">₹{(plan.maxPayout / 100).toFixed(0)}</span>
            </div>

            <button
              onClick={() => handleSelectPlan(plan)}
              disabled={createPolicy.isPending}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {createPolicy.isPending ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Activating...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Select Plan
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}
