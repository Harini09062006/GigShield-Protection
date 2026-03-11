import { useState } from "react";
import { useAdminStats, useTriggerDisruption, useWorkers, usePlans } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { 
  Users, AlertTriangle, FileText, IndianRupee, 
  CloudLightning, Activity, ServerCrash, ShieldCheck, Map, TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const triggerDisruption = useTriggerDisruption();

  const [formData, setFormData] = useState({
    city: "Mumbai",
    type: "rain",
    severity: "severe"
  });

  // Delivery Risk Map data for different cities
  const deliveryRiskZones: Record<string, Array<{ name: string; riskType: string; riskLevel: 'low' | 'medium' | 'high' }>> = {
    Mumbai: [
      { name: "South Mumbai", riskType: "Flood Risk", riskLevel: "high" },
      { name: "Andheri", riskType: "Pollution Risk", riskLevel: "high" },
      { name: "Bandra", riskType: "Moderate Risk", riskLevel: "medium" },
      { name: "Dadar", riskType: "Safe", riskLevel: "low" },
      { name: "Thane", riskType: "Flood Risk", riskLevel: "high" },
      { name: "Powai", riskType: "Safe", riskLevel: "low" }
    ],
    Bengaluru: [
      { name: "Indiranagar", riskType: "Pollution Risk", riskLevel: "medium" },
      { name: "Whitefield", riskType: "Safe", riskLevel: "low" },
      { name: "Koramangala", riskType: "Safe", riskLevel: "low" },
      { name: "Marathahalli", riskType: "Moderate Risk", riskLevel: "medium" }
    ],
    Delhi: [
      { name: "South Delhi", riskType: "Pollution Risk", riskLevel: "high" },
      { name: "Noida", riskType: "Safe", riskLevel: "low" },
      { name: "Gurgaon", riskType: "Moderate Risk", riskLevel: "medium" },
      { name: "East Delhi", riskType: "Flood Risk", riskLevel: "high" }
    ]
  };

  const currentZones = deliveryRiskZones[formData.city] || deliveryRiskZones.Mumbai;

  const getRiskColor = (level: 'low' | 'medium' | 'high') => {
    switch(level) {
      case 'low': return 'bg-green-50 border-green-200 border-l-4 border-l-green-600';
      case 'medium': return 'bg-yellow-50 border-yellow-200 border-l-4 border-l-yellow-600';
      case 'high': return 'bg-red-50 border-red-200 border-l-4 border-l-red-600';
    }
  };

  const getRiskTextColor = (level: 'low' | 'medium' | 'high') => {
    switch(level) {
      case 'low': return 'text-green-700';
      case 'medium': return 'text-yellow-700';
      case 'high': return 'text-red-700';
    }
  };

  const getRiskBgColor = (level: 'low' | 'medium' | 'high') => {
    switch(level) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
    }
  };

  // Weekly Risk Score data for each city
  const weeklyRiskScores = [
    {
      city: "Mumbai",
      riskScore: 72,
      factors: [
        { name: "Rainfall Risk", value: 65, color: "bg-blue-500" },
        { name: "Flood Probability", value: 78, color: "bg-cyan-500" },
        { name: "Pollution Level", value: 72, color: "bg-orange-500" }
      ]
    },
    {
      city: "Bengaluru",
      riskScore: 48,
      factors: [
        { name: "Rainfall Risk", value: 45, color: "bg-blue-500" },
        { name: "Flood Probability", value: 38, color: "bg-cyan-500" },
        { name: "Pollution Level", value: 58, color: "bg-orange-500" }
      ]
    },
    {
      city: "Delhi",
      riskScore: 85,
      factors: [
        { name: "Rainfall Risk", value: 72, color: "bg-blue-500" },
        { name: "Flood Probability", value: 65, color: "bg-cyan-500" },
        { name: "Pollution Level", value: 95, color: "bg-orange-500" }
      ]
    }
  ];

  const getRiskLevel = (score: number) => {
    if (score < 40) return { label: "Low", color: "text-green-600" };
    if (score < 70) return { label: "Moderate", color: "text-yellow-600" };
    return { label: "High", color: "text-red-600" };
  };

  const handleTrigger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await triggerDisruption.mutateAsync({
        ...formData,
        active: true
      });
      // Reset form partially for feedback
      const originalCity = formData.city;
      setFormData({...formData, city: "Triggering..."});
      setTimeout(() => setFormData({...formData, city: originalCity}), 1000);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Admin Operations</h1>
        <p className="text-muted-foreground mt-1">Platform overview and risk trigger management.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Workers</p>
          </div>
          <p className="text-4xl font-bold">{statsLoading ? "-" : stats?.totalWorkers}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle size={24} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Risk Events</p>
          </div>
          <p className="text-4xl font-bold">{statsLoading ? "-" : stats?.totalDisruptions}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
              <FileText size={24} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Claims Auto-Filed</p>
          </div>
          <p className="text-4xl font-bold">{statsLoading ? "-" : stats?.totalClaims}</p>
        </div>

        <div className="glass-card p-6 rounded-2xl border-primary/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-100 text-green-600 rounded-xl">
              <IndianRupee size={24} />
            </div>
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Payouts</p>
          </div>
          <p className="text-4xl font-bold text-primary">₹{statsLoading ? "-" : ((stats?.totalPayouts || 0) / 100).toLocaleString()}</p>
        </div>
      </div>

      {/* Weekly Risk Score */}
      <div className="mb-8 glass-card p-8 rounded-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <TrendingUp size={28} className="text-primary" />
            Weekly Delivery Risk Score
          </h2>
          <p className="text-sm text-muted-foreground">City-wide risk assessment based on weather, flood, and pollution factors</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {weeklyRiskScores.map((item, idx) => (
            <div key={idx} className="bg-gradient-to-br from-background to-secondary/20 p-6 rounded-2xl border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.city}</h3>
                  <p className={`text-sm font-semibold ${getRiskLevel(item.riskScore).color}`}>
                    {getRiskLevel(item.riskScore).label} Risk
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                  item.riskScore < 40 ? 'bg-green-100 text-green-600' :
                  item.riskScore < 70 ? 'bg-yellow-100 text-yellow-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  {item.riskScore}%
                </div>
              </div>

              <div className="space-y-3">
                {item.factors.map((factor, fidx) => (
                  <div key={fidx} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{factor.name}</span>
                      <span className="text-xs font-bold text-foreground">{factor.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${factor.color} h-2 rounded-full transition-all`}
                        style={{ width: `${factor.value}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  {item.riskScore >= 70 
                    ? "🚨 High disruption probability - Monitor closely" 
                    : item.riskScore >= 40
                    ? "⚠️ Moderate conditions - Be prepared"
                    : "✅ Safe conditions - Normal operations"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery Risk Map */}
      <div className="mb-8 glass-card p-8 rounded-3xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
            <Map size={28} className="text-primary" />
            Delivery Risk Map
          </h2>
          <p className="text-sm text-muted-foreground">City zone risk assessment for {formData.city}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {currentZones.map((zone, idx) => (
            <div 
              key={idx}
              className={`p-4 rounded-2xl border ${getRiskColor(zone.riskLevel)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-bold text-foreground text-lg">{zone.name}</h4>
                  <p className={`text-sm font-medium ${getRiskTextColor(zone.riskLevel)}`}>{zone.riskType}</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  zone.riskLevel === 'low' ? 'bg-green-600' :
                  zone.riskLevel === 'medium' ? 'bg-yellow-600' :
                  'bg-red-600'
                }`}></div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${getRiskBgColor(zone.riskLevel)}`}>
                {zone.riskLevel === 'low' ? 'SAFE' : zone.riskLevel === 'medium' ? 'MODERATE' : 'HIGH RISK'}
              </span>
            </div>
          ))}
        </div>

        {/* Risk Level Legend */}
        <div className="mt-6 pt-6 border-t border-border flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-600"></div>
            <span className="text-sm font-medium">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-yellow-600"></div>
            <span className="text-sm font-medium">Moderate Risk</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span className="text-sm font-medium">High Risk</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trigger Panel */}
        <div className="lg:col-span-1 glass-card p-8 rounded-3xl border-destructive/20 shadow-destructive/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <CloudLightning size={120} className="text-destructive" />
          </div>
          
          <h3 className="text-xl font-bold mb-2 flex items-center gap-2 text-destructive">
            <ServerCrash size={20} /> System Override
          </h3>
          <p className="text-sm text-muted-foreground mb-8">Manually trigger weather disruptions to test parametric smart contracts.</p>

          <form onSubmit={handleTrigger} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Target City</label>
              <select
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-destructive focus:ring-4 focus:ring-destructive/10 transition-all"
              >
                <option value="Mumbai">Mumbai</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Delhi">Delhi</option>
                <option value="Chennai">Chennai</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Disruption Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-destructive focus:ring-4 focus:ring-destructive/10 transition-all"
              >
                <option value="rain">Heavy Rain (>50mm)</option>
                <option value="flood">Flood (High Water Level)</option>
                <option value="pollution">Severe Air Pollution (AQI >200)</option>
              </select>
            </div>

            <button 
              type="submit"
              disabled={triggerDisruption.isPending || formData.city === "Triggering..."}
              className="w-full mt-4 px-6 py-4 rounded-xl font-bold bg-destructive text-destructive-foreground shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all flex justify-center items-center gap-2"
            >
              {triggerDisruption.isPending ? <Activity className="animate-spin" size={20} /> : <AlertTriangle size={20} />}
              Execute Trigger
            </button>
          </form>
        </div>

        {/* System Logs / Info */}
        <div className="lg:col-span-2 glass-card p-8 rounded-3xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-primary" /> Live Network Activity
          </h3>
          
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-start gap-4">
              <div className="mt-1"><ShieldCheck className="text-green-500" size={24} /></div>
              <div>
                <h4 className="font-semibold">Parametric Oracle Active</h4>
                <p className="text-sm text-muted-foreground mt-1">Smart contracts are actively listening to IMD (Indian Meteorological Department) APIs for live threshold breaches.</p>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-secondary/50 border border-border flex items-start gap-4">
              <div className="mt-1"><CloudLightning className="text-primary" size={24} /></div>
              <div>
                <h4 className="font-semibold">Payout Routing Ready</h4>
                <p className="text-sm text-muted-foreground mt-1">Stripe / UPI payout gateways are connected. Upon claim generation, funds take average &lt;3 seconds to settle.</p>
              </div>
            </div>
            
            <div className="mt-8 border-t border-border pt-8">
              <h4 className="font-bold text-sm uppercase tracking-wider text-muted-foreground mb-4">How it works</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">1</span> Admin triggers a severe weather event for a city.</li>
                <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">2</span> All registered workers in that city with an active plan get an alert.</li>
                <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">3</span> System automatically queries the database and files claims based on their coverage amount.</li>
                <li className="flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">4</span> Funds are immediately disbursed. No manual review needed.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
