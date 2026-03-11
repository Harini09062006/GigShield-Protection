import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateUser } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { MapPin, Smartphone, User, Briefcase, Loader2 } from "lucide-react";

export default function WorkerRegister() {
  const [, setLocation] = useLocation();
  const createUser = useCreateUser();
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    platform: "Swiggy",
    city: "Mumbai",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await createUser.mutateAsync(formData);
      localStorage.setItem("gigshield_worker_id", user.id.toString());
      localStorage.setItem("gigshield_worker_phone", formData.phoneNumber);
      setLocation("/dashboard");
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
              <User size={16} className="text-primary" /> Full Name
            </label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="John Doe"
              disabled={createUser.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Smartphone size={16} className="text-primary" /> Phone Number
            </label>
            <input
              required
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="+91 98765 43210"
              disabled={createUser.isPending}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Briefcase size={16} className="text-primary" /> Platform
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({...formData, platform: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              disabled={createUser.isPending}
            >
              <option>Swiggy</option>
              <option>Zomato</option>
              <option>Amazon</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <MapPin size={16} className="text-primary" /> City
            </label>
            <select
              value={formData.city}
              onChange={(e) => setFormData({...formData, city: e.target.value})}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              disabled={createUser.isPending}
            >
              <option>Mumbai</option>
              <option>Bengaluru</option>
              <option>Delhi</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={createUser.isPending}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] text-white font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createUser.isPending ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
