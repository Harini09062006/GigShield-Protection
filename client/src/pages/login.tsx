import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Smartphone, Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast({
          title: "Login Failed",
          description: error.message || "Worker not found. Please register first.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const { worker } = await response.json();
      localStorage.setItem("gigshield_worker_id", worker.id.toString());
      localStorage.setItem("gigshield_worker_phone", phone);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${worker.name}`,
      });

      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to login. Please try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Login with your phone number to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 rounded-3xl flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold flex items-center gap-2">
              <Smartphone size={16} className="text-primary" /> Phone Number
            </label>
            <input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-background border-2 border-border focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              placeholder="+91 98765 43210"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-6 py-3 bg-gradient-to-r from-[#6C5CE7] to-[#8E7CFF] text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Logging in...
              </>
            ) : (
              <>
                <LogIn size={18} /> Login
              </>
            )}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => setLocation("/register")}
              className="text-primary font-semibold hover:underline"
            >
              Register here
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
