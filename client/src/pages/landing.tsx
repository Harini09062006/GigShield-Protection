import { Link, useLocation } from "wouter";
import { Shield, Zap, CloudLightning, Activity, ArrowRight, UserPlus, Settings, LogIn } from "lucide-react";
import { useEffect } from "react";
import { Layout } from "@/components/layout";

export default function Landing() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Auto-redirect if worker is already registered
    const workerId = localStorage.getItem("gigshield_worker_id");
    if (workerId) {
      setLocation("/dashboard");
    }
  }, [setLocation]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center text-center pt-12 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span>⚡ AI-Powered Instant Payouts</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <span className="text-gradient">Instant Weather Protection</span> <br className="hidden md:block"/>
          for Delivery Workers
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          GigShield protects delivery partners from income loss due to heavy rain, floods, or extreme pollution. 
          When severe weather hits, claims are processed instantly—no paperwork required.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <Link href="/login" className="group">
            <div className="h-full glass-card p-8 rounded-3xl text-left hover:shadow-2xl hover:border-emerald-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-purple-100 text-[#6C5CE7] flex items-center justify-center mb-6 group-hover:bg-[#6C5CE7] group-hover:text-white transition-colors">
                <LogIn size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Login</h3>
              <p className="text-muted-foreground mb-6">
                Return to your account and view your coverage, claims history, and earnings protection.
              </p>
              <div className="flex items-center text-emerald-600 font-semibold group-hover:translate-x-2 transition-transform">
                Sign In <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          <Link href="/register" className="group">
            <div className="h-full glass-card p-8 rounded-3xl text-left hover:shadow-2xl hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <UserPlus size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-2">I'm New Here</h3>
              <p className="text-muted-foreground mb-6">
                Register to get covered and receive automatic payouts when severe weather strikes your city.
              </p>
              <div className="flex items-center text-primary font-semibold group-hover:translate-x-2 transition-transform">
                Get Protected <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>

          <Link href="/admin" className="group">
            <div className="h-full glass-card p-8 rounded-3xl text-left hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Settings size={28} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Admin Portal</h3>
              <p className="text-muted-foreground mb-6">
                Monitor risk events, view active delivery partners, and simulate weather disruptions.
              </p>
              <div className="flex items-center text-indigo-600 font-semibold group-hover:translate-x-2 transition-transform">
                View Dashboard <ArrowRight size={18} className="ml-2" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 py-12 border-t border-border/50">
        <div className="flex flex-col items-center text-center p-4">
          <CloudLightning size={32} className="text-primary mb-4" />
          <h4 className="text-xl font-semibold mb-2">Automated Detection</h4>
          <p className="text-sm text-muted-foreground">Connected directly to weather APIs to monitor rain, floods, and AQI in real-time.</p>
        </div>
        <div className="flex flex-col items-center text-center p-4">
          <Activity size={32} className="text-primary mb-4" />
          <h4 className="text-xl font-semibold mb-2">Zero Paperwork</h4>
          <p className="text-sm text-muted-foreground">Parametric triggers mean you never file a claim. If the weather hits the threshold, you get paid.</p>
        </div>
        <div className="flex flex-col items-center text-center p-4">
          <Shield size={32} className="text-primary mb-4" />
          <h4 className="text-xl font-semibold mb-2">Income Security</h4>
          <p className="text-sm text-muted-foreground">Ensure your daily earnings are protected even when you can't safely hit the road.</p>
        </div>
      </div>
    </Layout>
  );
}
