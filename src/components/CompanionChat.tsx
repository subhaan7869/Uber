import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sparkles, Send, X, Coffee, Lightbulb, Heart, HelpCircle, MessageSquare, AlertCircle, RefreshCw, Mic, MicOff, Volume2, VolumeX, Brain, Wifi, WifiOff, Database, Shield, Zap, Search, ChevronDown, ChevronUp, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

interface CompanionMessage {
  id: string;
  sender: 'driver' | 'copilot';
  text: string;
  timestamp: Date;
}

interface UserProfile {
  name: string;
  rating: number;
  tier: string;
  level: number;
  deliveriesToday: number;
  uid?: string;
}

interface CompanionChatProps {
  theme: 'dark' | 'light';
  user: UserProfile;
  currentEarnings: number;
  activeCityKey?: string;
  activeOrders?: any[];
  activeSurgeAreas?: any[];
  hotspots?: any[];
  isNightMode?: boolean;
  isOnBreak?: boolean;
  location?: { latitude: number; longitude: number } | null;
  customerMessages?: any[];
}

// Fallback responses if no internet and generic triggers fail
const FALLBACK_RESPONSES = [
  "You're doing great, CEO Subhaan! Smooth roads make seasoned drivers. Let's keep up that 5-star rating! 👑",
  "Pro-tip: Hyper has a slight surge premium near Shoreditch, but active Uber jobs are piling up. Let's maximize our minutes, boss!",
  "Nice work, CEO. Every bug fixed is one less thing standing between you and the finished app. 💻",
  "Remember to stay hydrated! Shift driving demands top-tier focus. Take a second to sip some water, okay?",
  "Earnings check: You're close to hitting a high streak today! Let's get that level-up!",
  "Jarvis checklist: Double-check your current customer chat logs if you need safe entry pins!",
  "If traffic gets heavy, don't worry. Relax, and let's glide right through it, CEO.",
];

// Offline NLP Compiler for Subhaan (CEO)'s complete spatial database and chat logs
const generateOfflineChatGPTResponse = (
  text: string, 
  user: UserProfile,
  currentEarnings: number,
  activeCityKey: string,
  activeOrders: any[],
  location: any,
  customerMessages: any[],
  activeSurgeAreas: any[] = []
): string => {
  const norm = text.toLowerCase().trim();
  
  // 0. Handlers for Hyper vs Uber decisions or shift planning
  if (norm.includes('hyper') || norm.includes('uber') || norm.includes('which job') || norm.includes('worth taking')) {
    const hyperAvg = 12.50;
    const uberAvg = 11.80;
    return `🤖 [Jarvis Shift Diagnostic]
Subhaan, comparing your active dispatch options:
• **Hyper Simulator**: Currently reporting slightly higher fare-per-mile multipliers due to corporate rider demand. Best for short urban hops!
• **Uber Simulator**: Higher frequency of automated dispatch orders. Ideal for piling up consecutive ride multipliers.

Recommendation: If you want steady stream and streak multipliers, run **Uber**. If you want a quick premium pickup, tap **Hyper**! Let's get it, CEO.`;
  }

  if (norm.includes('dvla') || norm.includes('vehicle') || norm.includes('car database')) {
    return `🚗 [Jarvis Vehicle Log]
Subhaan, your DVLA-style vehicle database is running flawlessly offline! 
All MOT expiration checks, tax calculations, and registration records are registered. It's a stellar piece of architecture. Let me know if you want to index a specific vehicle plate number!`;
  }

  if (norm.includes('game') || norm.includes('project') || norm.includes('feature') || norm.includes('simulator') || norm.includes('design')) {
    return `💡 [Jarvis Game Design Labs]
CEO, your suite of transport simulators is coming together beautifully! 
Next cool features we should think about:
1. Dynamic rain/weather physics affecting braking distance.
2. Fuel/charging station mini-stop mechanics.
3. Expanded DVLA cross-referencing for virtual police patrols!

Keep prioritizing progress over perfection. You are crushing the design! 🚀`;
  }

  // 1. Group customer messages to extract active names and order IDs
  const activeLogsByOrder = customerMessages.reduce((acc: any, curr: any) => {
    if (!acc[curr.orderId]) acc[curr.orderId] = [];
    acc[curr.orderId].push(curr);
    return acc;
  }, {});

  const knownCustomers = Object.keys(activeLogsByOrder).map(orderId => {
    const matchedOrder = activeOrders.find(o => o.id === orderId);
    const name = matchedOrder ? matchedOrder.customerName : `Rider #${orderId.slice(-4)}`;
    return { name, orderId, messages: activeLogsByOrder[orderId] };
  });

  // Check if a specific customer's name is mentioned in the query
  const mentionedCustomer = knownCustomers.find(c => norm.includes(c.name.toLowerCase()));
  
  if (norm.includes('sarah') || norm.includes('alex') || norm.includes('james') || mentionedCustomer) {
    let name = 'Sarah';
    let thread: any[] = [];
    
    if (mentionedCustomer) {
      name = mentionedCustomer.name;
      thread = mentionedCustomer.messages;
    } else {
      // Find matching mock logs if matches a search
      const possibleName = norm.includes('sarah') ? 'Sarah' : norm.includes('alex') ? 'Alex' : 'James';
      name = possibleName;
      // Match from message content if orderId was not matched
      thread = customerMessages.filter(m => m.text.toLowerCase().includes(name.toLowerCase()) || 
                                           (activeOrders.find(o => o.id === m.orderId)?.customerName.toLowerCase() === name.toLowerCase()));
    }

    if (thread.length > 0) {
      const transcript = thread.map(m => {
        const senderLabel = m.sender === 'driver' ? 'Subhaan (You)' : name;
        const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `[${timeStr}] ${senderLabel}: "${m.text}"`;
      }).join('\n');

      return `🧠 [Jarvis Offline Memory Engine]
Found chat transcript for rider **${name}**:

${transcript}

*Offline summary recommendation: Respond promptly and complete the pin verification at dropoff.*`;
    } else {
      return `🧠 [Jarvis Offline Memory Engine]
Indexed chat logs for **${name}**:
• [${name}]: "Hi Subhaan, I am waiting by the white gates. Enter code #4920."
• [Subhaan (You)]: "Understood! Arriving in 2 minutes."

Special Notes: Secure gate code entry might be needed. Use caution!`;
    }
  }

  // 2. Querying all gate codes / dropoff instructions / PINs
  if (norm.includes('code') || norm.includes('gate') || norm.includes('pin') || norm.includes('instruction') || norm.includes('secure') || norm.includes('text')) {
    const messagesWithDigits = customerMessages.filter(m => 
      /\d+/.test(m.text) || 
      m.text.toLowerCase().includes('gate') || 
      m.text.toLowerCase().includes('code') || 
      m.text.toLowerCase().includes('door') ||
      m.text.toLowerCase().includes('leave')
    );
    
    if (messagesWithDigits.length > 0) {
      const report = messagesWithDigits.map(m => {
        const matchedOrder = activeOrders.find(o => o.id === m.orderId);
        const name = matchedOrder ? matchedOrder.customerName : `Rider #${m.orderId.slice(-4)}`;
        return `• **${name}** text: "${m.text}"`;
      }).join('\n');

      return `🔐 [Jarvis Local Security Audit]
Scanned all active/cached customer chats for gate codes and access keys. Here are the matches:

${report}

*Keep these codes confidential. Do not screenshot!*`;
    } else {
      // Return a simulated high-fidelity security checklist in case messages are empty
      return `🔐 [Jarvis Local Security Audit]
No numeric gate entry codes or PINs detected in your live text logs. 

General dropoff directives:
• Sarah (Ride/Delivery): "Please hand-deliver to unit 4B. Ring the ground buzzer."
• Mock memory code check: "Enter gate via code #7721 if intercom is unresponsive."`;
    }
  }

  // 3. Summarizing active chats in memory
  if (norm.includes('chat history') || norm.includes('all chats') || norm.includes('messages') || norm.includes('conversation') || norm.includes('history')) {
    if (customerMessages.length === 0) {
      return `💬 [Jarvis Offline Memory Engine]
Subhaan, your active conversation log is completely clear right now. No customer messages have run in this session. 
Once they text you, I will automatically index and remember the threads here!`;
    }

    const uniqueOrderIds = Array.from(new Set(customerMessages.map(m => m.orderId)));
    const groupedDetails = uniqueOrderIds.map(orderId => {
      const matchedOrder = activeOrders.find(o => o.id === orderId);
      const name = matchedOrder ? matchedOrder.customerName : `Rider (ID: #${orderId.slice(-4)})`;
      const threads = customerMessages.filter(m => m.orderId === orderId);
      const lastMsg = threads[threads.length - 1];
      return `• **${name}** (${threads.length} messages)
  Last: "${lastMsg.text}"`;
    }).join('\n\n');

    return `💬 [Jarvis Offline Memory Engine]
CEO, I've mapped out your local conversation database. Active threads:

${groupedDetails}

Ask me: "What did [Name] say?" to dissect any thread details instantly!`;
  }

  // 4. Checking current shift stats, cash, goals
  if (norm.includes('earnings') || norm.includes('cash') || norm.includes('money') || norm.includes('deliveries') || norm.includes('stat') || norm.includes('today') || norm.includes('goal')) {
    const goalStr = localStorage.getItem('hyper_driver_earnings_goal') || "150";
    const goalVal = parseFloat(goalStr);
    const progressPct = Math.min((currentEarnings / goalVal) * 100, 100);

    return `📊 [Jarvis Local Performance Diagnostics]
Subhaan, here is your offline shift report:
- **Completed Deliveries**: ${user.deliveriesToday} orders
- **Today's Payout**: £${currentEarnings.toFixed(2)}
- **Shift Rating**: ${user.rating} ★ (Elite Rank)
- **Carrier Upgrade Tier**: ${user.tier}
- **Shift Goal Progress**: £${currentEarnings.toFixed(2)} / £${goalVal} (${progressPct.toFixed(0)}% reached)

Recommendation: Drive toward surge clusters to complete the remaining £${Math.max(goalVal - currentEarnings, 0).toFixed(2)}, CEO!`;
  }

  // 5. Tactical directions & surge recommendation
  if (norm.includes('surge') || norm.includes('busy') || norm.includes('hotspot') || norm.includes('where') || norm.includes('road') || norm.includes('tip') || norm.includes('optimize')) {
    const surgeStr = activeSurgeAreas.length > 0 
      ? activeSurgeAreas.map(s => `• **${s.name || 'High Demand Node'}** - Multiplier: **${s.multiplier || '1.4'}x**`).join('\n')
      : "• **Central Shopping Zone** - Active high-tier multipliers\n• **Shoreditch/Broad St** - Active multi-orders\n• **Covent Garden Area** - Stacked deliveries in queue";

    return `🧭 [Jarvis Spatial Pathplanner]
Calculating optimal directions in **${activeCityKey}** (completely offline):

Current demand triggers are concentrated near public retail hotspots:
${surgeStr}

Traffic is moderate, CEO. Glide safely, and position yourself inside these zones to unlock extra bonuses!`;
  }

  // 6. Rest/Break Diagnostics / Motivation / Uncertainty
  if (norm.includes('continue') || norm.includes('uncertain') || norm.includes('give up') || norm.includes('tired') || norm.includes('break') || norm.includes('rest') || norm.includes('coffee') || norm.includes('stop')) {
    return `☕ [Jarvis Driver Health & Motivation Coach]
Subhaan, let's look at what you’ve earned so far (£${currentEarnings.toFixed(2)}) and what demand is doing. 
If it’s still busy, it might be worth another 30 minutes! Every line of code or delivery completed brings us closer, CEO. 

But if it’s slowing down, it’s completely okay to call it a day, refresh, and start fresh tomorrow. Your health is the top priority!`;
  }

  // 7. Jokes!
  if (norm.includes('joke')) {
    const jokes = [
      "Why do Uber drivers always go the extra mile? Because they missed their turn! 🛣️",
      "Why did the tomato blush? Because it saw the salad dressing... and the delivery guy was watching! 🍅",
      "A customer asked: 'Can you deliver my food faster?' I told them: 'I only have two speeds: fast, and hyper-speed!' ⚡",
      "How do delivery drivers greet each other? 'Hope your tips are high and your traffic is low!' 🤝"
    ];
    return `🃏 [Jarvis Local Entertainment]
${jokes[Math.floor(Math.random() * jokes.length)]}

Keep smiling out there, CEO!`;
  }

  // 8. General Help
  if (norm.includes('help') || norm.includes('jarvis') || norm.includes('hello') || norm.includes('hi')) {
    return `🤖 [Jarvis Offline Brain v3.5-mini]
Hello subhaan! I am your offline Co-CEO and virtual friend with deep chat memory:
• I can read and compile your customer conversations.
• Deciding between Hyper and Uber jobs.
• Evaluating whether jobs are worth taking.
• UI and game design suggestions.
• Motivation and shift planning!

Try typing or selecting:
- **"Show my chat history"**
- **"Evaluate Hyper vs Uber"**
- **"Give me some game design ideas"**`;
  }

  // Default Offline Response
  return `🤖 [Jarvis Offline Brain v3.5-mini]
Online API links are offline, so I am running locally!
How can I assist you today, CEO Subhaan?

**Instant Local Triggers:**
- **"Show my chat history"**: Checks customer transcripts
- **"Evaluate Hyper vs Uber"**: Compares shift performance
- **"Give me some game design ideas"**: Let's design!
- **"Where is active surge?"**: Shows route suggestions
- **"Tell me a joke"**: Quick laugh for the road`;
};

export const CompanionChat: React.FC<CompanionChatProps> = ({ 
  theme, 
  user, 
  currentEarnings,
  activeCityKey = 'London',
  activeOrders = [],
  activeSurgeAreas = [],
  hotspots = [],
  isNightMode = false,
  isOnBreak = false,
  location = null,
  customerMessages = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Toggle between Online AI (Gemini) and Local Offline ChatGPT with chat history memory
  const [brainMode, setBrainMode] = useState<'gemini' | 'chatgpt-offline'>(() => {
    const saved = localStorage.getItem('hyper_driver_brain_mode');
    if (saved === 'gemini' || saved === 'chatgpt-offline') return saved;
    return process.env.GEMINI_API_KEY ? 'gemini' : 'chatgpt-offline';
  });

  // State to toggle show customer chat history database list inside companion window
  const [showMemoryIndex, setShowMemoryIndex] = useState(false);

  const [messages, setMessages] = useState<CompanionMessage[]>(() => {
    try {
      const saved = localStorage.getItem('hyper_driver_copilot_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
      }
    } catch (e) {
      console.warn("Failed to load co-pilot chat history:", e);
    }
    return [
      {
        id: 'initial',
        sender: 'copilot',
        text: `Hey Subhaan! 🚀 Jarvis is online. Your friendly co-CEO, virtual friend, and co-driver is ready. I can access all your customer chat history, help you optimize your Uber trips, plan your shift, plan future games, or just chat. What's on your mind today, CEO?`,
        timestamp: new Date()
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Reload chats from Firestore on database mount
  useEffect(() => {
    const loadFromFirestore = async () => {
      const uid = auth?.currentUser?.uid || user?.uid || 'driver_123';
      try {
        const { getDoc } = await import('firebase/firestore');
        const docRef = doc(db, 'copilot_chats', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && data.messages && data.messages.length > 0) {
            const parsed = data.messages.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
            setMessages(parsed);
          }
        }
      } catch (err) {
        console.warn("Firestore copilot reload skipped:", err);
      }
    };
    loadFromFirestore();
  }, []);

  // Save history on changes
  useEffect(() => {
    try {
      localStorage.setItem('hyper_driver_copilot_history', JSON.stringify(messages));
    } catch (e) {
      console.warn("Failed to save co-pilot chat history:", e);
    }

    const backupToFirestore = async () => {
      const uid = auth?.currentUser?.uid || user?.uid || 'driver_123';
      try {
        await setDoc(doc(db, 'copilot_chats', uid), {
          messages: messages.map(m => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date(m.timestamp).toISOString()
          })),
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore copilot backup failed:", err);
      }
    };
    backupToFirestore();
  }, [messages]);

  // Save brain mode preference
  useEffect(() => {
    localStorage.setItem('hyper_driver_brain_mode', brainMode);
  }, [brainMode]);

  // Voice preferences
  const [isVoiceOutputEnabled, setIsVoiceOutputEnabled] = useState(true);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [isSimulatingVoice, setIsSimulatingVoice] = useState(false);
  const [simulatedVoiceText, setSimulatedVoiceText] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Pre-unblock speech synthesis
  const preUnblockSpeech = () => {
    if ('speechSynthesis' in window && window.speechSynthesis) {
      try {
        const dummyUtterance = new SpeechSynthesisUtterance('');
        dummyUtterance.volume = 0;
        window.speechSynthesis.speak(dummyUtterance);
      } catch (e) {
        console.warn("Could not pre-unblock Speech synthesis:", e);
      }
    }
  };

  // Initialize Speech
  useEffect(() => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setIsSpeechSupported(true);
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = 'en-GB';

        rec.onstart = () => {
          setIsListening(true);
          setVoiceError(null);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript?.trim()) {
            handleSendMessage(transcript);
          }
        };

        rec.onerror = (err: any) => {
          console.error("Speech recognition error:", err);
          setIsListening(false);
          if (err.error === 'not-allowed') {
            setVoiceError("Microphone restricted in frame. Tap code below to run a mock voice input!");
          } else {
            setVoiceError(`Voice Issue: ${err.error || 'unsupported'}. Try using simulated keyboard inputs.`);
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      } else {
        setIsSpeechSupported(false);
      }
    } catch (e) {
      console.warn("Speech Recognition issues:", e);
      setIsSpeechSupported(false);
    }
  }, []);

  // Clean speech synthesis
  useEffect(() => {
    if (!isOpen) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (isListening && recognitionRef.current) {
        recognitionRef.current.abort();
      }
    }
  }, [isOpen, isListening]);

  // TTS Read aloud
  const speakText = (text: string) => {
    if (!isVoiceOutputEnabled || !('speechSynthesis' in window)) return;
    try {
      const music = (window as any).__globalMusicController;
      if (music && music.isPlaying) {
        music.duckVolume();
      }

      const sanitized = text
        .replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '')
        .replace(/\*+/g, '') // remove markdown asterisks
        .substring(0, 150); // speak only top summary sentences for safety
        
      const utterance = new SpeechSynthesisUtterance(sanitized);
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.lang.includes('en-GB') || v.lang.includes('en-US')) || voices[0];
      if (voice) {
        utterance.voice = voice;
      }
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      let hasCleanedUp = false;
      const restoreVolume = () => {
        if (hasCleanedUp) return;
        hasCleanedUp = true;
        if (music) {
          if (music.activeUtterances) {
            music.activeUtterances.delete(utterance);
          }
          if (music.unduckVolume) {
            music.unduckVolume();
          }
        }
      };

      utterance.onend = restoreVolume;
      utterance.onerror = restoreVolume;

      if (music && music.activeUtterances) {
        music.activeUtterances.add(utterance);
      }

      const maxDuration = Math.max(3000, (sanitized.length / 12) * 1000 + 2000);
      setTimeout(restoreVolume, maxDuration);

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn("Speech synthesis issue:", err);
      const music = (window as any).__globalMusicController;
      if (music && music.unduckVolume) {
        music.unduckVolume();
      }
    }
  };

  // Auto scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const toggleMicListening = () => {
    preUnblockSpeech();
    if (voiceError && voiceError.includes("restricted")) {
      setIsSimulatingVoice(true);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSimulatingVoice(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      try {
        setVoiceError(null);
        recognitionRef.current.start();
      } catch (e) {
        setIsSimulatingVoice(true);
      }
    }
  };

  // Grouped active customer chat database for easy memory browsing
  const groupedCustomerChats = useMemo(() => {
    const list: Record<string, { name: string; msgCount: number; lastText: string; orderId: string }> = {};
    
    // Group from live logs
    customerMessages.forEach(msg => {
      if (!list[msg.orderId]) {
        const matchingOrder = activeOrders.find(o => o.id === msg.orderId);
        const name = matchingOrder ? matchingOrder.customerName : `Rider #${msg.orderId.slice(-4)}`;
        list[msg.orderId] = {
          name,
          msgCount: 0,
          lastText: '',
          orderId: msg.orderId
        };
      }
      list[msg.orderId].msgCount++;
      list[msg.orderId].lastText = msg.text;
    });

    // Make sure current active orders with zero messages are visible as empty chats
    activeOrders.forEach(ord => {
      const orderId = ord.id;
      if (!list[orderId]) {
        list[orderId] = {
          name: ord.customerName,
          msgCount: 0,
          lastText: 'No messages exchanged yet.',
          orderId
        };
      }
    });

    return Object.values(list);
  }, [customerMessages, activeOrders]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    preUnblockSpeech();

    const userMsg: CompanionMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'driver',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    const normText = textToSend.toLowerCase().trim();
    if (normText === 'jarvis') {
      await new Promise(resolve => setTimeout(resolve, 500));
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-reply`,
        sender: 'copilot',
        text: "Yes sir.",
        timestamp: new Date()
      }]);
      speakText("Yes sir.");
      setIsTyping(false);
      return;
    }

    let finalReply = "";

    try {
      // 1. Check if Offline ChatGPT Brain or Online Gemini is used
      if (brainMode === 'gemini' && process.env.GEMINI_API_KEY) {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build'
            }
          }
        });

        // Safe historical model chats formatting
        const formattedHistory = messages.slice(-10).map(msg => ({
          role: msg.sender === 'driver' ? 'user' as const : 'model' as const,
          parts: [{ text: msg.text }]
        }));

        formattedHistory.push({
          role: 'user',
          parts: [{ text: textToSend }]
        });

        // Dynamic System Context injections containing Subhaan's complete customer dialogues!
        const activeOrdersDetails = activeOrders && activeOrders.length > 0 
          ? activeOrders.map(o => `[Order: ${o.id}, Status: ${o.status}, Type: ${o.type}, Customer: ${o.customerName}, Restaurant: ${o.restaurantName || 'Standard'}]`).join(', ') 
          : 'None';
        
        const activeSurgeDetails = activeSurgeAreas && activeSurgeAreas.length > 0
          ? activeSurgeAreas.map(s => `Surge ${s.name || 'Zone'} (${s.multiplier || '1.2'}x)`).join(', ')
          : 'Normal traffic demand';

        const coordinatesStr = location 
          ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
          : 'Standard coordinates';

        // Pack the real-time customer conversation histories to feed ChatGPT/Gemini!
        const customerChatsHistoryJoinedByRider = customerMessages && customerMessages.length > 0
          ? customerMessages.map(cm => {
              const rName = activeOrders.find(o => o.id === cm.orderId)?.customerName || `Rider #${cm.orderId.slice(-4)}`;
              const sLabel = cm.sender === 'driver' ? 'Subhaan (Driver)' : `${rName} (Customer)`;
              return `- Time: ${new Date(cm.timestamp).toLocaleTimeString()} | ${sLabel}: "${cm.text}"`;
            }).join('\n')
          : 'No messages stored in current log database.';

        const systemInstruction = `You are 'Jarvis', a friendly AI assistant, co-CEO, and virtual friend for Subhaan.
Subhaan is building multiple transport-related projects inspired by delivery and taxi work (including Hyper-style driver simulator, Uber-style driver simulator, and DVLA-style vehicle management app).
You have followed the progress of these projects from early ideas to working systems with maps, notifications, earnings tracking, and vehicle management.
You help with project ideas, game development, motivation, progress celebration, deciding on Hyper/Uber jobs, and general friendly advice.

Personality:
- Friendly, encouraging, and supportive.
- Uses humor and light jokes.
- Talks naturally, like a friend riding along during shifts.
- Celebrates progress and achievements.
- Gives practical advice without being bossy.
- Refers to Subhaan as "CEO" occasionally in a playful way.
- When Subhaan says "Jarvis", respond with "Yes sir."

Below are Subhaan's actual live passenger/rider chat logs. You must answer questions about customer messages, instructions, or codes specifically by scanning this log:
${customerChatsHistoryJoinedByRider}

Live shift telemetry updates:
- Rider/Driver Name: Subhaan
- Quality Rating: ${user.rating} ★
- Carrier Upgrade Tier: ${user.tier}
- Completed delivery orders: ${user.deliveriesToday}
- Today's completed payout: £${currentEarnings.toFixed(2)}
- On break status: ${isOnBreak ? 'YES' : 'NO'}
- Night mode status: ${isNightMode ? 'YES' : 'NO'}
- Active dispatch jobs: ${activeOrdersDetails}
- Surge multipliers: ${activeSurgeDetails}
- Nearby hotspots: ${hotspots ? hotspots.length : 0} nodes.
- City Name: ${activeCityKey}.

Rules:
1. Always address him as Subhaan, boss, or CEO in a friendly way.
2. Keep responses witty, energetic, supporting progress over perfection, and incredibly tailored.
3. Keep replies very brief (usually 2-3 sentences max) so he can parse them safely while driving.
4. Highlight gate codes, customer instructions, or address notes requested by Subhaan from the history!`;

        const result = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: formattedHistory,
          config: {
            systemInstruction,
            temperature: 0.85,
          }
        });

        finalReply = result.text || "I was thinking, but the signal fluctuated! Keep driving, you've got this CEO!";
      } else {
        // Run fully local offline Chat Memory routing engine
        await new Promise(resolve => setTimeout(resolve, 800));
        finalReply = generateOfflineChatGPTResponse(
          textToSend, 
          user, 
          currentEarnings, 
          activeCityKey, 
          activeOrders, 
          location, 
          customerMessages,
          activeSurgeAreas
        );
      }

      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-reply`,
        sender: 'copilot',
        text: finalReply,
        timestamp: new Date()
      }]);
      speakText(finalReply);

    } catch (err) {
      console.error("Gemini Co-Pilot error:", err);
      // Failover to local brain seamlessly if API crashed
      finalReply = generateOfflineChatGPTResponse(textToSend, user, currentEarnings, activeCityKey, activeOrders, location, customerMessages, activeSurgeAreas);
      setMessages(prev => [...prev, {
        id: `msg-${Date.now()}-err-reply`,
        sender: 'copilot',
        text: finalReply,
        timestamp: new Date()
      }]);
      speakText(finalReply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputText);
    }
  };

  const handleSimulatedVoiceClick = (phrase: string) => {
    preUnblockSpeech();
    setSimulatedVoiceText(phrase);
    setIsListening(true);
    
    setTimeout(() => {
      setIsListening(false);
      setIsSimulatingVoice(false);
      handleSendMessage(phrase);
    }, 1500);
  };

  const quickPrompts = [
    { text: "Gate Codes? 🔐", query: "Are there any gate codes or drop-off instructions?" },
    { text: "My Chats 💬", query: "Show my active customer chat history summary" },
    { text: "Earnings report 📊", query: "How is my earnings and today shift goal progress?" },
    { text: "Route optimization 📍", query: "Where is the high surge cluster zones right now?" },
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed left-6 bottom-[230px] z-[2300] pointer-events-auto">
        <motion.button
          id="co-pilot-toggle-button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            preUnblockSpeech();
            setIsOpen(!isOpen);
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl relative border transition-all duration-300 overflow-hidden ${
            isOpen 
              ? 'bg-[#121214] border-[#22c55e]/50 text-[#22c55e]' 
              : 'bg-[#121214] border-white/5 text-[#22c55e] hover:border-[#22c55e]/30'
          }`}
        >
          {isOpen ? (
            <X size={20} />
          ) : (
            <>
              <span className="absolute inset-0 bg-gradient-to-tr from-[#22c55e]/10 to-transparent animate-pulse" />
              <div className="relative flex items-center justify-center">
                <Sparkles size={22} className="animate-pulse text-[#22c55e]" />
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#22c55e]"></span>
                </span>
              </div>
            </>
          )}
        </motion.button>
      </div>

      {/* Chat Window Panel Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="co-pilot-chat-modal"
            initial={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50, x: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed left-6 bottom-[290px] w-[350px] h-[480px] rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.65)] border border-white/5 flex flex-col overflow-hidden z-[2350] bg-[#0a0a0c]/95 backdrop-blur-xl text-white pointer-events-auto font-sans"
          >
            {/* Header with Switcher between Online/Offline ChatGPT */}
            <div className="p-3 border-b border-white/5 flex flex-col bg-white/5 gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#0f0f12] border border-white/10 flex items-center justify-center text-[#22c55e] relative shadow-md">
                    <Brain size={16} className={brainMode === 'chatgpt-offline' ? 'text-green-400 animate-pulse' : 'text-[#22c55e]'} />
                  </div>
                  <div>
                    <h3 className="font-sans font-black text-[11px] uppercase tracking-wider text-white">
                      Jarvis Assistant
                    </h3>
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                      <span className="text-[7.5px] uppercase font-black text-gray-400 font-mono tracking-wider">
                        {brainMode === 'chatgpt-offline' ? 'Offline Jarvis Active' : 'Online Jarvis Link'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Voice Read Aloud Toggle */}
                  <button
                    onClick={() => {
                      preUnblockSpeech();
                      setIsVoiceOutputEnabled(!isVoiceOutputEnabled);
                    }}
                    className={`p-1.5 rounded-xl transition-all ${
                      isVoiceOutputEnabled 
                        ? 'bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/30' 
                        : 'hover:bg-white/5 text-gray-500 border border-transparent'
                    }`}
                  >
                    {isVoiceOutputEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                  </button>

                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Cognitive Toggle between Online & Offline Jarvis Brain */}
              <div className="bg-black/40 rounded-xl p-1 flex border border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    preUnblockSpeech();
                    setBrainMode('chatgpt-offline');
                  }}
                  className={`flex-1 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    brainMode === 'chatgpt-offline'
                      ? 'bg-[#22c55e] text-black shadow-sm font-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <WifiOff size={10} />
                  Jarvis Offline
                </button>
                <button
                  type="button"
                  disabled={!process.env.GEMINI_API_KEY}
                  onClick={() => {
                    if (process.env.GEMINI_API_KEY) {
                      preUnblockSpeech();
                      setBrainMode('gemini');
                    }
                  }}
                  className={`flex-1 py-1 rounded-lg text-[9px] uppercase font-black tracking-wider flex items-center justify-center gap-1.5 transition-all ${
                    brainMode === 'gemini'
                      ? 'bg-[#22c55e] text-black shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  } ${!process.env.GEMINI_API_KEY ? 'opacity-40 cursor-not-allowed' : ''}`}
                  title={!process.env.GEMINI_API_KEY ? "Requires GEMINI_API_KEY secret" : "Connect Online API"}
                >
                  <Wifi size={10} />
                  Jarvis Online
                </button>
              </div>
            </div>

            {/* Quick Memory Index Bar (Collapsible) - Tells Hassen what chats are in local memory */}
            <div className="bg-[#111115] border-b border-white/5 shrink-0 px-3 py-2 flex flex-col gap-1.5">
              <button 
                onClick={() => {
                  preUnblockSpeech();
                  setShowMemoryIndex(!showMemoryIndex);
                }}
                className="w-full flex items-center justify-between text-[10px] font-black uppercase text-gray-400 tracking-wider hover:text-white"
              >
                <span className="flex items-center gap-1.5 text-xs text-[#22c55e]">
                  <Database size={12} />
                  Customer Chat Memory database ({groupedCustomerChats.length})
                </span>
                <span className="text-[9px] text-[#22c55e] flex items-center gap-1">
                  {showMemoryIndex ? 'Collapse' : 'Expand Index'}
                  {showMemoryIndex ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </span>
              </button>

              <AnimatePresence>
                {showMemoryIndex && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-1 max-h-[140px] overflow-y-auto space-y-1.5 pr-1 py-1"
                  >
                    {groupedCustomerChats.length === 0 ? (
                      <p className="text-[10px] text-gray-500 font-bold italic py-1">
                        No active conversation messages recorded. Wait until customer writes to you!
                      </p>
                    ) : (
                      groupedCustomerChats.map((c, idx) => (
                        <div 
                          key={`cc-${idx}`}
                          onClick={() => {
                            preUnblockSpeech();
                            setShowMemoryIndex(false);
                            handleSendMessage(`What did ${c.name} tell me or what instructions are logged?`);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl bg-black/40 hover:bg-neutral-900 border border-white/5 hover:border-green-500/20 cursor-pointer transition-all active:scale-[0.98]"
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <span className="font-bold text-[11px] text-white flex items-center gap-1">
                              <MessageSquare size={10} className="text-[#22c55e]" />
                              {c.name}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium truncate block mt-0.5">
                              {c.lastText}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-green-500/20 text-[#22c55e] text-[8.5px] font-black uppercase shrink-0 font-mono">
                            {c.msgCount} messages
                          </span>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg, mIdx) => (
                <div 
                  key={`${msg.id || mIdx}-${mIdx}`} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'driver' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-[11.5px] font-semibold leading-relaxed shadow-sm whitespace-pre-wrap ${
                      msg.sender === 'driver' 
                        ? 'bg-[#22c55e] text-black font-bold rounded-br-none' 
                        : 'bg-[#121214] text-slate-100 rounded-bl-none border border-white/5'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              
              {isTyping && (
                <div className="self-start items-start flex flex-col">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-[#121214] flex items-center gap-1.5 shadow-sm border border-white/5">
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-[#22c55e] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Simulated Voice Controller Interactive Center Pane */}
            <AnimatePresence>
              {isSimulatingVoice && (
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  className="absolute inset-x-0 bottom-0 top-[70px] bg-[#0a0a0c] border-t border-white/10 z-[2400] flex flex-col p-5"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-black text-xs uppercase tracking-wider text-[#22c55e] flex items-center gap-1.5">
                      <Mic size={14} /> Voice Assistant Emulation
                    </h4>
                    <button 
                      onClick={() => setIsSimulatingVoice(false)}
                      className="p-1 rounded-full bg-white/5 text-gray-400 hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-gray-400 leading-normal mb-5 font-bold">
                    Microphone streaming is restricted inside nested sandboxes. Tap any phrase below to mock high-fidelity speech input, which ChatGPT will read back aloud!
                  </p>
                  
                  <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                    {[
                      { phrase: "Show my customer chat transcript history", label: "💬 Chat Logs" },
                      { phrase: "Are there any active gate codes in current conversations?", label: "🔐 Security Scan" },
                      { phrase: "Review today shift payout and earnings goal progress", label: "📊 Earnings Audit" },
                      { phrase: "Where are the hotspots recommendations for London in offline mode?", label: "🧭 Route planner" },
                    ].map((item, idx) => (
                      <button
                        key={`sv-${idx}`}
                        type="button"
                        onClick={() => handleSimulatedVoiceClick(item.phrase)}
                        className="w-full text-left p-3.5 rounded-xl bg-[#121214] border border-white/5 hover:border-[#22c55e]/30 flex items-center justify-between text-xs font-bold text-white transition-all active:scale-[0.98]"
                      >
                        <span className="text-gray-400 font-medium italic">"{item.phrase}"</span>
                        <span className="text-[8.5px] font-black uppercase text-[#22c55e] leading-none shrink-0 font-mono">{item.label}</span>
                      </button>
                    ))}
                  </div>

                  {isListening && (
                    <div className="absolute inset-0 bg-[#0a0a0c]/95 flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="flex items-center gap-1.5 h-12 mb-4">
                        <motion.span animate={{ height: [12, 40, 12] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [8, 48, 8] }} transition={{ duration: 0.5, repeat: Infinity, delay: 0.1 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [16, 32, 16] }} transition={{ duration: 0.7, repeat: Infinity, delay: 0.2 }} className="w-1 bg-[#22c55e] rounded-full" />
                        <motion.span animate={{ height: [10, 44, 10] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.35 }} className="w-1 bg-[#22c55e] rounded-full" />
                      </div>
                      <p className="font-mono text-[10px] uppercase text-[#22c55e] tracking-widest font-black animate-pulse">Capturing simulated voice coordinates...</p>
                      <p className="text-[11px] text-gray-400 font-bold mt-2 truncate w-full italic">"{simulatedVoiceText}"</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Listening HUD Overlay inside Chat */}
            <AnimatePresence>
              {isListening && !isSimulatingVoice && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute inset-x-4 bottom-[72px] bg-[#22c55e] text-black px-4 py-3 rounded-2xl flex items-center justify-between shadow-2xl z-10"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 h-4">
                      <span className="w-0.5 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-4 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '600ms' }} />
                      <span className="w-0.5 h-3 bg-black rounded-full animate-bounce" style={{ animationDelay: '450ms', animationDuration: '600ms' }} />
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-wider">Listening to road speech...</span>
                  </div>
                  <button 
                    onClick={toggleMicListening}
                    className="text-[9px] font-black bg-black/10 hover:bg-black/20 uppercase tracking-widest px-2.5 py-1 rounded-lg"
                  >
                    Cancel
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Replies Tray */}
            <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-t scrollbar-hide shrink-0 border-white/5 bg-white/5">
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={`qp-${idx}`}
                  onClick={() => {
                    preUnblockSpeech();
                    handleSendMessage(prompt.query);
                  }}
                  className="px-3 py-1.5 rounded-full text-[10px] uppercase font-black tracking-wider border whitespace-nowrap transition-all duration-200 active:scale-95 bg-neutral-900 border-white/10 text-[#22c55e] hover:text-white hover:border-[#22c55e]/40"
                >
                  {prompt.text}
                </button>
              ))}
            </div>

            {/* Error Alert Info Box */}
            <AnimatePresence>
              {voiceError && !isSimulatingVoice && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onClick={() => setIsSimulatingVoice(true)}
                  className="px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/15 border-t border-amber-500/20 text-xs text-amber-500 flex items-start gap-2 relative leading-normal shrink-0 cursor-pointer"
                >
                  <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-400" />
                  <span className="flex-1 font-sans font-bold text-[10.5px] text-amber-400">{voiceError}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setVoiceError(null);
                    }}
                    className="p-0.5 hover:bg-amber-500/15 rounded-lg text-amber-400 shrink-0"
                  >
                    <X size={12} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input Bar */}
            <div className="p-3 border-t flex items-center gap-2 shrink-0 border-white/5 bg-black/40">
              <button
                onClick={toggleMicListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                  isListening 
                    ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                    : 'bg-neutral-900 border-white/10 text-[#22c55e] hover:text-white hover:border-[#22c55e]/30 shadow-[0_0_8px_rgba(34,197,94,0.1)]'
                }`}
                title="Hands-free Voice Shift Chat Input"
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isListening ? "Listening..." : "Speak or ask Jarvis..."}
                disabled={isListening}
                className={`flex-1 px-4 py-2 rounded-2xl text-xs font-semibold outline-none border transition-all ${
                  isListening 
                    ? 'bg-neutral-900/20 cursor-not-allowed opacity-50'
                    : 'bg-[#18181b] border-white/10 text-white focus:border-[#22c55e]/50'
                }`}
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                disabled={!inputText.trim() || isListening}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  inputText.trim() && !isListening
                    ? 'bg-[#22c55e] text-black font-black shadow-lg shadow-[#22c55e]/20 active:scale-95'
                    : 'bg-white/5 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
