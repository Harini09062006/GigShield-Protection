import { useEffect } from "react";
import { useLocation } from "wouter";
import { useUser, useUserClaims } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, Clock, AlertCircle, Wallet, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ClaimHistory() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: user, isLoading: userLoading } = useUser(workerId);
  const { data: claims, isLoading: claimsLoading } = useUserClaims(workerId);

  useEffect(() => {
    if (!workerId) setLocation("/");
  }, [workerId, setLocation]);

  if (userLoading || claimsLoading) return null;
  if (!user) return null;

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <CheckCircle2 size={20} className="text-green-600" />;
      case 'approved': return <CheckCircle2 size={20} className="text-blue-600" />;
      case 'pending': return <Clock size={20} className="text-yellow-600" />;
      case 'rejected': return <ShieldX size={20} className="text-red-600" />;
      default: return <AlertCircle size={20} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-green-100 text-green-700';
      case 'approved': return 'bg-blue-100 text-blue-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const sortedClaims = (claims || []).sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <Layout isWorker>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Claim History</h1>
          <p className="text-muted-foreground">View all your insurance claims and payouts</p>
        </div>

        {sortedClaims.length === 0 ? (
          <Card className="p-12 text-center">
            <ShieldCheck size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No claims yet</h3>
            <p className="text-muted-foreground">Your protected areas and claims will appear here</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedClaims.map((claim) => (
              <Card key={claim.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      {getStatusIcon(claim.status)}
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{claim.eventType}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{claim.city}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(claim.status)}`}>
                    {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Hours Lost</p>
                    <p className="text-sm font-bold">{claim.hoursLost}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                      <Wallet size={12} /> Compensation
                    </p>
                    <p className="text-sm font-bold">₹{(claim.compensationAmount / 100).toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1 flex items-center gap-1">
                      <Calendar size={12} /> Date
                    </p>
                    <p className="text-sm font-bold">{new Date(claim.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-1">Claim ID</p>
                    <p className="text-sm font-bold">#{claim.id}</p>
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
