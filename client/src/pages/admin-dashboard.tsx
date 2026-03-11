import { useState } from "react";
import { useAdminStats, useWeatherByCity } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { 
  Users, AlertTriangle, FileText, IndianRupee, 
  CloudLightning, Activity, ServerCrash, ShieldCheck, Map, TrendingUp
} from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useAdminStats();

  const [selectedCity, setSelectedCity] = useState("Mumbai");
  const { data: weatherData } = useWeatherByCity(selectedCity);

  const [formData, setFormData] = useState({
    city: "Mumbai",
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

  return (
    <Layout isAdmin>
      <div className="space-y-8">
        {/* Stats Section */}
        <div>
          <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
          
          {statsLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading admin stats...</p>
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Total Workers</p>
                    <p className="text-3xl font-bold mt-2">{stats.totalWorkers || 0}</p>
                  </div>
                  <Users size={32} className="text-primary opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Active Claims</p>
                    <p className="text-3xl font-bold mt-2">{stats.activeClaims || 0}</p>
                  </div>
                  <FileText size={32} className="text-orange-600 opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Total Payouts</p>
                    <p className="text-3xl font-bold mt-2">₹{((stats.totalPayouts || 0) / 100).toFixed(0)}</p>
                  </div>
                  <IndianRupee size={32} className="text-green-600 opacity-50" />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm font-semibold">Active Plans</p>
                    <p className="text-3xl font-bold mt-2">{stats.activePlans || 0}</p>
                  </div>
                  <ShieldCheck size={32} className="text-purple-600 opacity-50" />
                </div>
              </Card>
            </div>
          ) : null}
        </div>

        {/* Weather & Risk Map Section */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">Risk Monitor</h2>
            
            <Card className="p-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-2 block">Select City</label>
                  <select
                    value={formData.city}
                    onChange={(e) => {
                      setFormData({...formData, city: e.target.value});
                      setSelectedCity(e.target.value);
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                  >
                    <option>Mumbai</option>
                    <option>Bengaluru</option>
                    <option>Delhi</option>
                  </select>
                </div>

                {weatherData && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-secondary/10 rounded-lg">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Rainfall</p>
                      <p className="text-2xl font-bold">{weatherData.rainfall}mm</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Air Quality Index</p>
                      <p className="text-2xl font-bold">{weatherData.aqi}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-1">Risk Level</p>
                      <p className="text-2xl font-bold capitalize">{weatherData.aiRiskLevel || 'Calculating...'}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Risk Zones */}
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Map size={24} />
              Delivery Risk Zones - {formData.city}
            </h3>
            <div className="space-y-3">
              {currentZones.map((zone, idx) => (
                <div key={idx} className={`p-4 rounded-lg ${getRiskColor(zone.riskLevel)}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${getRiskTextColor(zone.riskLevel)}`}>{zone.name}</p>
                      <p className={`text-xs mt-1 ${getRiskTextColor(zone.riskLevel)}`}>{zone.riskType}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskTextColor(zone.riskLevel)}`}>
                      {zone.riskLevel.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
