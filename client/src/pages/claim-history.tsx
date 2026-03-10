import { useEffect } from "react";
import { useLocation } from "wouter";
import { useWorker, useWorkerClaims } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { ShieldCheck, ShieldAlert, ShieldX, CheckCircle2, Clock, AlertCircle, Wallet, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function ClaimHistory() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: worker, isLoading: workerLoading } = useWorker(workerId);
  const { data: claims, isLoading: claimsLoading } = useWorkerClaims(workerId);

  useEffect(() => {
    if (!workerId) setLocation("/");
  }, [workerId, setLocation]);

  if (workerLoading || claimsLoading) return null;
  if (!worker) return null;

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

  const renderFraudStatus = (claim: any) => {
    if (!claim.fraudStatus) return null;
    
    const details = claim.fraudDetails ? JSON.parse(claim.fraudDetails) : {};
    
    return (
      <div className="mt-4 pt-4 border-t border-border/50">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
          {claim.fraudStatus === 'verified' ? <ShieldCheck size={12} className="text-green-600" /> : <ShieldAlert size={12} className="text-red-600" />}
          Fraud Detection Status: {claim.fraudStatus === 'verified' ? 'Passed' : 'Action Required'}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg text-[10px]">
            <span className="text-muted-foreground">GPS Validation</span>
            <span className={`font-bold ${details.gps === 'Verified' ? 'text-green-600' : 'text-red-600'}`}>
              {details.gps || 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg text-[10px]">
            <span className="text-muted-foreground">Weather Event</span>
            <span className={`font-bold ${details.weather === 'Confirmed' ? 'text-green-600' : 'text-red-600'}`}>
              {details.weather || 'Pending'}
            </span>
          </div>
          <div className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg text-[10px]">
            <span className="text-muted-foreground">Duplicate Check</span>
            <span className={`font-bold ${details.duplicate === 'Passed' ? 'text-green-600' : 'text-red-600'}`}>
              {details.duplicate || 'Pending'}
            </span>
          </div>
        </div>
        {claim.status === 'rejected' && (
          <p className="mt-2 text-xs font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100">
            Claim Rejected: {details.gps !== 'Verified' ? 'Location mismatch detected' : 'Verification failed'}
          </p>
        )}
      </div>
    );
  };

  return (
    <Layout isWorker>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-bold text-foreground mb-2">Claim History</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            <Wallet size={16} /> Track all your insurance claims and payouts
          </p>
        </div>

        {!claims || claims.length === 0 ? (
          <Card className="border-2 border-dashed p-12 text-center bg-gradient-to-br from-primary/5 to-secondary/5">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <FileText size={32} className="text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No claims yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              You haven't filed any claims. When severe weather impacts your delivery work, claims will appear here automatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {claims.map((claim, idx) => (
              <div
                key={claim.id}
                className="animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <Card className="p-6 md:p-8 hover:shadow-lg transition-all border-l-4 border-l-primary">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Left: Event Details */}
                    <div>
                      <div className="flex items-start gap-3 mb-4">
                        <div className="mt-1">{getStatusIcon(claim.status)}</div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-foreground">{claim.reason}</h3>
                          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar size={14} />
                            {claim.createdAt ? new Date(claim.createdAt).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Just now'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Claim ID</span>
                          <span className="font-mono font-bold text-foreground">#{claim.id.toString().padStart(5, '0')}</span>
                        </div>
                      </div>
                      
                      {renderFraudStatus(claim)}
                    </div>

                    {/* Right: Amount & Status */}
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-6 text-center">
                        <p className="text-sm text-muted-foreground mb-2 font-medium">Compensation Amount</p>
                        <p className="text-4xl font-bold text-primary mb-1">₹{claim.amount / 100}</p>
                        <p className="text-xs text-muted-foreground">Per coverage event</p>
                      </div>

                      <div className="flex gap-2">
                        <div className={`flex-1 rounded-lg p-3 text-center font-semibold text-sm capitalize ${getStatusColor(claim.status)}`}>
                          {claim.status === 'paid' ? '✓ Paid' : claim.status === 'approved' ? '✓ Approved' : 'Pending'}
                        </div>
                        {claim.status === 'paid' && (
                          <div className="flex-1 rounded-lg p-3 text-center font-semibold text-sm bg-green-100 text-green-700">
                            ✓ Transferred
                          </div>
                        )}
                      </div>

                      {claim.status === 'paid' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                          <p className="text-xs font-semibold text-green-700 mb-1">Payment Status</p>
                          <p className="text-sm font-bold text-green-700">Processing Complete</p>
                          <p className="text-xs text-green-600 mt-1">Funds deposited to your account</p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {claims && claims.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-12">
            <Card className="p-6 text-center bg-blue-50 border-blue-200">
              <p className="text-2xl font-bold text-blue-700">{claims.length}</p>
              <p className="text-sm text-blue-600 mt-1">Total Claims</p>
            </Card>
            <Card className="p-6 text-center bg-green-50 border-green-200">
              <p className="text-2xl font-bold text-green-700">₹{claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) / 100}</p>
              <p className="text-sm text-green-600 mt-1">Paid Out</p>
            </Card>
            <Card className="p-6 text-center bg-yellow-50 border-yellow-200">
              <p className="text-2xl font-bold text-yellow-700">{claims.filter(c => c.status === 'pending').length}</p>
              <p className="text-sm text-yellow-600 mt-1">Pending</p>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  );
}
