import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateWorker } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { MapPin, Smartphone, User, Briefcase, Loader2 } from "lucide-react";

export default function WorkerRegister() {
  const [, setLocation] = useLocation();
  const createWorker = useCreateWorker();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    platform: "Swiggy",
    city: "Mumbai",
    hourlyRate: 6000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Add mock lat/lng based on city selection
      let lat = 19.0760, lng = 72.8777; // Mumbai default
      if (formData.city === "Bengaluru") { lat = 12.9716; lng = 77.5946; }
      else if (formData.city === "Delhi") { lat = 12.9716; lng = 77.5946; }

      const worker = await createWorker.mutateAsync({
        ...formData,
        lat: lat.toString(),
        lng: lng.toString()
      });
      
      localStorage.setItem("gigshield_worker_id", worker.id.toString());
      setLocation("/plans");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-muted-foreground">Register to get instant weather protection</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <User size={16} className="text-primary"/> Full Name
            </label>
            <input 
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="Ravi Kumar"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Smartphone size={16} className="text-primary"/> Phone Number
            </label>
            <input 
              required
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="+91 98765 43210"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-primary"/> Delivery Platform
            </label>
            <select 
              value={formData.platform}
              onChange={(e) => setFormData({...formData, platform: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
            >
              <option value="Swiggy">Swiggy</option>
              <option value="Zomato">Zomato</option>
              <option value="Amazon">Amazon</option>
              <option value="Zepto">Zepto</option>
              <option value="Blinkit">Blinkit</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin size={16} className="text-primary"/> Primary City
            </label>
            <select 
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all appearance-none"
            >
              <option value="Mumbai">Mumbai</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Delhi">Delhi</option>
              <option value="Chennai">Chennai</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Wallet size={16} className="text-primary"/> Avg. Hourly Earnings (₹)
            </label>
            <input 
              required
              type="number"
              value={formData.hourlyRate / 100}
              onChange={(e) => setFormData({...formData, hourlyRate: parseInt(e.target.value) * 100 || 6000})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="60"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used to calculate parametric payouts based on hours lost.
            </p>
          </div>

          <button 
            type="submit"
            disabled={createWorker.isPending}
            className="mt-4 w-full px-6 py-4 rounded-xl font-bold bg-gradient-to-r from-primary to-indigo-600 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none transition-all flex justify-center items-center gap-2"
          >
            {createWorker.isPending ? <Loader2 className="animate-spin" size={20} /> : "Complete Registration"}
          </button>
        </form>
      </div>
    </Layout>
  );
}
