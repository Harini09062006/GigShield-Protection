import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useWorker, useWorkerPlan, useWorkerClaims, useCityDisruptions, useWeather } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { Brain, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function SupportPage() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  
  const { data: worker } = useWorker(workerId);
  const { data: planData } = useWorkerPlan(workerId);
  const { data: claims } = useWorkerClaims(workerId);
  const { data: disruptions } = useCityDisruptions(worker?.city);
  const { data: weatherData } = useWeather(worker?.city);

  const [chatMessages, setChatMessages] = useState<Array<{ id: string; text: string; sender: 'user' | 'ai' }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    if (!workerId) setLocation("/");
  }, [workerId, setLocation]);

  const handleSendMessage = (message: string) => {
    if (!message.trim()) return;

    const userMsg = message.toLowerCase();
    setChatMessages(prev => [...prev, { id: Date.now().toString(), text: message, sender: 'user' }]);
    setChatLoading(true);

    setTimeout(() => {
      let aiResponse = "";
      if (userMsg.includes('rain') || userMsg.includes('weather') || userMsg.includes('forecast')) {
        const rainfall = weatherData?.rainfall || 0;
        aiResponse = `Rainfall prediction for ${worker?.city}: ${rainfall}mm. Your ${planData?.plan.name} plan will auto-trigger a claim if rainfall exceeds 50mm. Current status: ${rainfall > 50 ? 'High risk - claim may trigger' : 'Moderate - monitoring'}.`;
      } else if (userMsg.includes('payout') || userMsg.includes('payment') || userMsg.includes('money')) {
        const totalPaid = claims?.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0) || 0;
        aiResponse = `You've received ₹${totalPaid / 100} in total payouts so far. Pending claims: ${claims?.filter(c => c.status === 'pending').length || 0}. Approved claims: ${claims?.filter(c => c.status === 'approved').length || 0}. Visit your Claims History for full details.`;
      } else if (userMsg.includes('cover') || userMsg.includes('insurance') || userMsg.includes('plan')) {
        aiResponse = `Your ${planData?.plan.name} plan provides comprehensive coverage for: Heavy Rain (exceeding 50mm), Floods (exceeding 70mm), and Severe Air Pollution (AQI exceeding 200). Premium: ₹${planData?.plan.weeklyPremium ? (planData.plan.weeklyPremium / 100) : 'N/A'}/week. Max coverage: ₹${planData?.plan.coverageAmount ? (planData.plan.coverageAmount / 100) : 'N/A'}.`;
      } else if (userMsg.includes('risk') || userMsg.includes('disruption') || userMsg.includes('alert')) {
        const disruptionCount = disruptions?.filter(d => d.active).length || 0;
        const riskLevel = weatherData?.riskLevel || 'unknown';
        aiResponse = `Current risk assessment for ${worker?.city}: ${riskLevel.toUpperCase()}. ${disruptionCount} active disruption(s) detected. Parametric insurance is monitoring real-time conditions and will auto-trigger claims when thresholds are exceeded. Stay safe!`;
      } else if (userMsg.includes('how') || userMsg.includes('work') || userMsg.includes('parametric')) {
        aiResponse = `Parametric insurance works by automatically triggering payouts when specific weather events occur, without waiting for damage proof. When rainfall exceeds 50mm, floods exceed 70mm, or AQI exceeds 200, we instantly file claims. No delays, no manual verification - instant protection for your earnings.`;
      } else if (userMsg.includes('claim') || userMsg.includes('status')) {
        const claimCount = claims?.length || 0;
        const pendingCount = claims?.filter(c => c.status === 'pending').length || 0;
        aiResponse = `You have ${claimCount} total claims filed. Status breakdown: Pending: ${pendingCount}, Approved: ${claims?.filter(c => c.status === 'approved').length || 0}, Paid: ${claims?.filter(c => c.status === 'paid').length || 0}. Visit your Claims History page to view detailed information for each claim.`;
      } else {
        aiResponse = `I can help with questions about your ${planData?.plan.name} plan, payouts, weather risks, or how parametric insurance works. What would you like to know?`;
      }
      setChatMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: aiResponse, sender: 'ai' }]);
      setChatLoading(false);
    }, 800);
    setChatInput("");
  };

  return (
    <Layout isWorker>
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setLocation("/dashboard")}
          className="flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
          data-testid="button-back-to-dashboard"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <Card className="rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="text-purple-600" size={32} />
            <div>
              <h1 className="text-2xl font-bold text-foreground">AI Support Assistant</h1>
              <p className="text-muted-foreground">Ask anything about your coverage, payouts, or weather risks</p>
            </div>
          </div>

          {/* Chat Messages Display */}
          <div className="bg-white rounded-xl p-6 mb-6 h-96 overflow-y-auto border border-purple-100 flex flex-col gap-3">
            {chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-center">
                <p className="text-muted-foreground">Start a conversation with our AI assistant</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-sm px-4 py-2 rounded-lg ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-white rounded-bl-none' 
                      : 'bg-purple-100 text-foreground rounded-br-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-purple-100 text-foreground px-4 py-2 rounded-lg rounded-br-none">
                  <span className="inline-block animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Questions */}
          <div className="mb-6 space-y-2">
            <p className="text-sm font-semibold text-muted-foreground">Quick questions:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {[
                "Will rain affect my earnings today?",
                "How much compensation will I get?",
                "When will I receive my payout?",
                "What does my plan cover?",
                "How does parametric insurance work?",
                "What is my current risk level?"
              ].map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setChatMessages(prev => [...prev, { id: Date.now() + '-' + idx, text: question, sender: 'user' }]);
                    setChatLoading(true);
                    setTimeout(() => {
                      let aiResponse = "";
                      if (question === "Will rain affect my earnings today?") {
                        const rainfall = weatherData?.rainfall || 0;
                        const rainStatus = rainfall > 50 ? "severe" : rainfall > 30 ? "moderate" : "light";
                        const willTrigger = rainfall > 50 ? "will automatically trigger" : "may trigger";
                        aiResponse = `Current rainfall in ${worker?.city} is ${rainfall}mm (${rainStatus}). Heavy rain claims ${willTrigger} your ${planData?.plan.name} plan if it exceeds 50mm, protecting your income for 3 hours of lost work.`;
                      } else if (question === "How much compensation will I get?") {
                        const compensation = planData?.plan.coverageAmount ? (planData.plan.coverageAmount / 100) : "varies";
                        aiResponse = `Your ${planData?.plan.name} plan provides up to ₹${compensation} compensation per disruption event. The actual payout is automatically calculated based on your hourly rate (₹${worker?.hourlyRate ? (worker.hourlyRate / 100) : 'N/A'}/hour) and hours lost during the disruption.`;
                      } else if (question === "When will I receive my payout?") {
                        const pendingClaims = claims?.filter(c => c.status === 'pending').length || 0;
                        const approvedClaims = claims?.filter(c => c.status === 'approved').length || 0;
                        const paidClaims = claims?.filter(c => c.status === 'paid').length || 0;
                        aiResponse = `Your claims status: ${pendingClaims} pending, ${approvedClaims} approved, ${paidClaims} paid. Approved claims are processed within 24 hours. You have ${approvedClaims} claim(s) approved waiting for disbursement. Check your Claims History page for detailed status updates.`;
                      } else if (question === "What does my plan cover?") {
                        aiResponse = `Your ${planData?.plan.name} covers three disruption types: (1) Heavy Rain exceeding 50mm - 3 hours protected, (2) Floods exceeding 70mm - 6 hours protected, (3) Severe Air Pollution (AQI exceeding 200) - 4 hours protected. All claims are auto-filed instantly when conditions trigger, with no manual verification needed.`;
                      } else if (question === "How does parametric insurance work?") {
                        aiResponse = `Parametric insurance pays based on the occurrence of a defined event (heavy rain, flood, pollution) rather than actual loss proof. When triggers are met, claims auto-file instantly without waiting for verification.`;
                      } else if (question === "What is my current risk level?") {
                        const riskLevel = weatherData?.riskLevel || 'unknown';
                        const disruptionCount = disruptions?.filter(d => d.active).length || 0;
                        aiResponse = `Current risk assessment for ${worker?.city}: ${riskLevel.toUpperCase()}. ${disruptionCount} active disruption(s) detected. Stay informed and stay safe!`;
                      }
                      setChatMessages(prev => [...prev, { id: Date.now() + '-ai', text: aiResponse || "I'm here to help! Please ask about coverage, payouts, or weather risks.", sender: 'ai' }]);
                      setChatLoading(false);
                    }, 1000);
                  }}
                  className="text-left px-4 py-2 text-sm rounded-lg bg-white border border-purple-200 hover:bg-purple-50 transition-colors font-medium text-foreground"
                  data-testid={`button-quick-question-${idx}`}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  handleSendMessage(chatInput);
                }
              }}
              placeholder="Type your question..."
              className="flex-1 px-4 py-3 text-sm rounded-lg border border-purple-200 focus:outline-none focus:border-primary bg-white"
              data-testid="input-chat-message"
            />
            <button
              onClick={() => handleSendMessage(chatInput)}
              className="px-6 py-3 text-sm rounded-lg bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
              data-testid="button-send-message"
            >
              Send
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
