import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useWorker, useWorkerPlan, useWorkerClaims, useCityDisruptions, useWeather } from "@/hooks/use-gigshield";
import { Layout } from "@/components/layout";
import { Brain, ArrowLeft, Trash2, Send } from "lucide-react";
import { Card } from "@/components/ui/card";

type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: number;
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SupportPage() {
  const [, setLocation] = useLocation();
  const workerId = Number(localStorage.getItem("gigshield_worker_id"));
  const storageKey = `gigshield_chat_${workerId}`;

  const { data: worker } = useWorker(workerId);
  const { data: planData } = useWorkerPlan(workerId);
  const { data: claims } = useWorkerClaims(workerId);
  const { data: disruptions } = useCityDisruptions(worker?.city);
  const { data: weatherData } = useWeather(worker?.city);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!workerId) setLocation("/");
  }, [workerId, setLocation]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(chatMessages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, storageKey]);

  const getAIResponse = (message: string): string => {
    const msg = message.toLowerCase().trim();

    const rainfall = weatherData?.rainfall || 0;
    const riskLevel = (weatherData?.riskLevel || 'low') as string;
    const aqi = weatherData?.aqi || 0;
    const workerName = worker?.name?.split(' ')[0] || 'there';
    const city = worker?.city || 'your city';
    const platform = worker?.platform || 'your platform';
    const planName = planData?.plan.name || 'your plan';
    const weeklyPremium = planData?.plan.weeklyPremium ? planData.plan.weeklyPremium / 100 : 'N/A';
    const coverageAmount = planData?.plan.coverageAmount ? planData.plan.coverageAmount / 100 : 'N/A';
    const hourlyRate = worker?.hourlyRate ? worker.hourlyRate / 100 : 0;
    const totalClaims = claims?.length || 0;
    const pendingClaims = claims?.filter(c => c.status === 'pending').length || 0;
    const approvedClaims = claims?.filter(c => c.status === 'approved').length || 0;
    const paidClaims = claims?.filter(c => c.status === 'paid').length || 0;
    const rejectedClaims = claims?.filter(c => c.status === 'rejected').length || 0;
    const totalEarned = (claims?.filter(c => c.status === 'paid').reduce((s, c) => s + c.amount, 0) || 0) / 100;
    const activeDisruptions = disruptions?.filter(d => d.active).length || 0;

    // Greetings
    if (/^(hi|hello|hey|namaste|helo|hii|hai)/.test(msg)) {
      return `Hello ${workerName}! I'm your GigShield AI assistant. I can help you with your insurance plan, claims, payouts, weather alerts, or anything else. What would you like to know?`;
    }

    // Name / identity
    if (msg.includes('who are you') || msg.includes('what are you') || msg.includes('your name')) {
      return `I'm the GigShield AI Support Assistant — here to help ${workerName} understand their insurance coverage, track claims, and stay safe during bad weather. Ask me anything!`;
    }

    // Worker profile
    if (msg.includes('my name') || msg.includes('who am i') || msg.includes('my profile') || msg.includes('my account')) {
      return `You are ${worker?.name}, a ${platform} delivery worker based in ${city}. Your hourly rate is ₹${hourlyRate}/hour. You are protected under the ${planName} plan.`;
    }

    // Earnings / hourly rate
    if (msg.includes('earn') || msg.includes('salary') || msg.includes('income') || msg.includes('hourly') || msg.includes('wage')) {
      return `Your registered hourly rate is ₹${hourlyRate}/hour. GigShield uses this to calculate your income loss during disruptions. For example, if you lose 3 hours to heavy rain, your payout would be ₹${hourlyRate * 3}.`;
    }

    // Rain / weather
    if (msg.includes('rain') || msg.includes('rainfall') || msg.includes('weather') || msg.includes('forecast') || msg.includes('monsoon')) {
      const rainStatus = rainfall > 50 ? 'severe — claim will auto-trigger' : rainfall > 30 ? 'moderate — monitoring closely' : 'light — no immediate concern';
      return `Hi ${workerName}! Current rainfall in ${city}: ${rainfall}mm (${rainStatus}). Your ${planName} plan auto-triggers a claim if rainfall exceeds 50mm for 3 hours. ${rainfall > 50 ? 'A claim is being processed for you right now!' : 'Stay alert and ride safely.'}`;
    }

    // Flood
    if (msg.includes('flood') || msg.includes('waterlogging') || msg.includes('water level')) {
      const floodStatus = rainfall > 70 ? 'Flood conditions detected! A claim will be auto-triggered.' : rainfall > 50 ? 'Heavy rain — monitoring for flood threshold (70mm).' : 'No flood conditions right now.';
      return `Flood threshold: 70mm rainfall over 6 hours. Current rainfall: ${rainfall}mm. ${floodStatus} Flood claims protect 6 hours of your income.`;
    }

    // Air quality / AQI / pollution
    if (msg.includes('aqi') || msg.includes('pollution') || msg.includes('air quality') || msg.includes('smog') || msg.includes('air')) {
      const aqiStatus = aqi > 200 ? 'Hazardous — claim triggered!' : aqi > 150 ? 'Unhealthy — approaching trigger level (AQI 200).' : 'Acceptable — no concern.';
      return `Current AQI in ${city}: ${aqi} (${aqiStatus}). Your ${planName} plan triggers a claim when AQI exceeds 200 for 4 hours, covering 4 hours of income loss. Stay indoors if AQI is above 200.`;
    }

    // Risk level
    if (msg.includes('risk') || msg.includes('danger') || msg.includes('safe') || msg.includes('today') || msg.includes('alert')) {
      return `Current risk level for ${city}: ${riskLevel.toUpperCase()}. ${activeDisruptions} active disruption(s) detected. Rainfall: ${rainfall}mm | AQI: ${aqi}. ${riskLevel === 'high' ? 'Please take extra care today.' : riskLevel === 'medium' ? 'Stay alert for changing conditions.' : 'Conditions look good — ride safely!'}`;
    }

    // Claims
    if (msg.includes('claim') || msg.includes('application') || msg.includes('file')) {
      if (msg.includes('how') || msg.includes('process') || msg.includes('submit')) {
        return `Claims are automatically filed by GigShield the moment weather thresholds are crossed — you don't need to do anything! When rainfall exceeds 50mm, floods exceed 70mm, or AQI exceeds 200, the system detects it and instantly files a claim for you.`;
      }
      return `${workerName}, you have ${totalClaims} total claims. Breakdown: ${pendingClaims} pending, ${approvedClaims} approved, ${paidClaims} paid, ${rejectedClaims} rejected. You have earned ₹${totalEarned} from paid claims so far. Visit the Claims History page for full details.`;
    }

    // Payout / payment
    if (msg.includes('payout') || msg.includes('payment') || msg.includes('money') || msg.includes('receive') || msg.includes('get paid') || msg.includes('transfer')) {
      return `${workerName}, you've received ₹${totalEarned} in total payouts. You have ${approvedClaims} approved claim(s) waiting for disbursement — these will be processed within 24 hours. ${pendingClaims} claim(s) are still under review.`;
    }

    // Pending status
    if (msg.includes('pending') || msg.includes('waiting') || msg.includes('processing')) {
      return `You have ${pendingClaims} pending claim(s). Pending means our system is verifying the weather data and fraud checks. Most pending claims are resolved within a few hours. Approved claims disburse within 24 hours after approval.`;
    }

    // Rejected
    if (msg.includes('reject') || msg.includes('denied') || msg.includes('declined') || msg.includes('why rejected') || msg.includes('not approved')) {
      return `You have ${rejectedClaims} rejected claim(s). Rejections happen when fraud checks detect a GPS location mismatch (you were not in the affected area) or when weather data doesn't confirm the trigger. Contact support if you believe this is an error.`;
    }

    // Plan / coverage
    if (msg.includes('cover') || msg.includes('plan') || msg.includes('insurance') || msg.includes('policy') || msg.includes('what is included') || msg.includes('benefits')) {
      return `Your ${planName} covers three events: (1) Heavy Rain exceeding 50mm — 3 hours income protected, (2) Flood exceeding 70mm — 6 hours protected, (3) Severe Air Pollution AQI exceeding 200 — 4 hours protected. Weekly premium: ₹${weeklyPremium}. Max coverage: ₹${coverageAmount}.`;
    }

    // Premium / cost
    if (msg.includes('premium') || msg.includes('fee') || msg.includes('cost') || msg.includes('charge') || msg.includes('how much do i pay') || msg.includes('subscription')) {
      return `Your ${planName} premium is ₹${weeklyPremium} per week. This is automatically deducted and gives you up to ₹${coverageAmount} in coverage per event. It's designed to be affordable while fully protecting your income.`;
    }

    // Parametric insurance
    if (msg.includes('parametric') || msg.includes('how does') || msg.includes('how it works') || msg.includes('explain')) {
      return `Parametric insurance pays automatically when a specific event (like heavy rain or flood) occurs — no damage proof needed! GigShield monitors real-time weather and air quality data. The moment conditions cross a threshold, your claim is filed instantly. No delays, no paperwork, no waiting.`;
    }

    // Fraud
    if (msg.includes('fraud') || msg.includes('fake') || msg.includes('cheat') || msg.includes('verify')) {
      return `GigShield uses 3-layer fraud detection for every claim: (1) GPS verification — confirms you were in the affected area, (2) Weather data confirmation — cross-checks official rainfall/AQI data, (3) Duplicate check — ensures the same event isn't claimed twice. This protects all workers on the platform.`;
    }

    // City / location
    if (msg.includes('city') || msg.includes('location') || msg.includes('where') || msg.includes('mumbai') || msg.includes('delhi') || msg.includes('bangalore') || msg.includes('chennai') || msg.includes('hyderabad')) {
      return `You are registered in ${city}. GigShield tracks real-time weather and AQI data specifically for your city to auto-trigger claims when thresholds are exceeded in your area.`;
    }

    // Platform (Swiggy / Zomato)
    if (msg.includes('swiggy') || msg.includes('zomato') || msg.includes('platform') || msg.includes('app')) {
      return `You are a ${platform} delivery partner. GigShield supports both Swiggy and Zomato workers. Your ${planName} plan protects your income regardless of which platform you use.`;
    }

    // Thank you
    if (msg.includes('thank') || msg.includes('thanks') || msg.includes('ok') || msg.includes('great') || msg.includes('good') || msg.includes('nice')) {
      return `You're welcome, ${workerName}! Stay safe out there. If you need anything else, I'm always here to help. 🛡️`;
    }

    // Help
    if (msg.includes('help') || msg.includes('what can you') || msg.includes('options') || msg.includes('menu')) {
      return `I can help you with: 📋 Claims & payouts | 🌧️ Weather & rain alerts | 💨 Air quality & AQI | 🛡️ Your insurance plan | 💰 Earnings & compensation | ❓ How parametric insurance works. Just ask me anything!`;
    }

    // Default fallback
    return `I didn't quite catch that, ${workerName}. I can help with your claims, payouts, weather alerts, insurance coverage, or earnings. Could you rephrase your question? For example: "What is my claim status?" or "Will it rain today?"`;
  };

  const sendMessage = (message: string) => {
    if (!message.trim() || chatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'user',
      timestamp: Date.now(),
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatLoading(true);
    setChatInput("");

    setTimeout(() => {
      const aiText = getAIResponse(message);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: aiText,
        sender: 'ai',
        timestamp: Date.now() + 1,
      };
      setChatMessages(prev => [...prev, aiMsg]);
      setChatLoading(false);
    }, 700);
  };

  const clearHistory = () => {
    setChatMessages([]);
    localStorage.removeItem(storageKey);
  };

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  chatMessages.forEach((msg) => {
    const date = formatDate(msg.timestamp);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) {
      last.messages.push(msg);
    } else {
      groupedMessages.push({ date, messages: [msg] });
    }
  });

  const quickQuestions = [
    "Will rain affect my earnings today?",
    "What is my current claim status?",
    "How much compensation will I get?",
    "When will I receive my payout?",
    "What does my plan cover?",
    "What is my current risk level?",
  ];

  return (
    <Layout isWorker>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
            data-testid="button-back-to-dashboard"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </button>
          {chatMessages.length > 0 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
              data-testid="button-clear-chat"
            >
              <Trash2 size={14} />
              Clear History
            </button>
          )}
        </div>

        <Card className="rounded-2xl overflow-hidden border border-purple-200 shadow-lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-indigo-600 px-6 py-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Brain className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">AI Support Assistant</h1>
              <p className="text-xs text-purple-100">Online · Ask anything about your coverage or claims</p>
            </div>
          </div>

          {/* Chat Messages */}
          <div className="bg-gray-50 px-4 py-4 h-[420px] overflow-y-auto flex flex-col gap-1">
            {chatMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center">
                  <Brain className="text-purple-500" size={32} />
                </div>
                <p className="text-muted-foreground font-medium">Hi {worker?.name?.split(' ')[0] || 'there'}! How can I help you today?</p>
                <p className="text-xs text-muted-foreground">Use the quick questions below or type your own</p>
              </div>
            ) : (
              groupedMessages.map((group) => (
                <div key={group.date}>
                  <div className="flex items-center gap-2 my-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-[10px] text-muted-foreground font-medium">{group.date}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                  {group.messages.map((msg) => (
                    <div key={msg.id} className={`flex mb-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.sender === 'ai' && (
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                          <Brain size={14} className="text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col gap-1 max-w-sm">
                        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-primary text-white rounded-tr-sm'
                            : 'bg-white text-foreground border border-purple-100 shadow-sm rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] text-muted-foreground ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            )}
            {chatLoading && (
              <div className="flex items-start gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Brain size={14} className="text-primary" />
                </div>
                <div className="bg-white border border-purple-100 shadow-sm px-4 py-3 rounded-2xl rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="bg-white border-t border-gray-100 px-4 pt-3 pb-2">
            <p className="text-[11px] font-semibold text-muted-foreground mb-2">Quick questions:</p>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="whitespace-nowrap text-[11px] px-3 py-1.5 rounded-full bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors font-medium text-purple-700 flex-shrink-0"
                  data-testid={`button-quick-${idx}`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-2 items-center">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(chatInput)}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2.5 text-sm rounded-full border border-purple-200 focus:outline-none focus:border-primary bg-gray-50"
              data-testid="input-chat-message"
            />
            <button
              onClick={() => sendMessage(chatInput)}
              disabled={!chatInput.trim() || chatLoading}
              className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50"
              data-testid="button-send-message"
            >
              <Send size={16} />
            </button>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
