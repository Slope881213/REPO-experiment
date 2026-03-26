/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, FormEvent, RefObject, forwardRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { db, auth } from './firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Bed, 
  Lamp, 
  Monitor, 
  Trash2, 
  Utensils, 
  ArrowDown, 
  CheckCircle2, 
  ShieldCheck, 
  Heart, 
  Zap, 
  ChevronRight, 
  UserCheck, 
  Clock, 
  TrendingDown,
  ShoppingCart,
  ArrowRight,
  RefreshCw,
  Mail,
  Coffee,
  Book,
  Shirt,
  Headphones,
  Camera,
  Tv,
  Watch,
  Smartphone,
  Guitar,
  Bike,
  Music,
  Gamepad2,
  Dumbbell,
  Palette,
  Mic2,
  Speaker,
  Store,
  Luggage,
  Send,
  Bell,
  MapPin,
  MessageSquare,
  Package,
  Wallet,
  Check,
  Calendar,
  AlertTriangle,
  Hourglass,
  User,
  Bot,
  Search,
  Target,
  Handshake,
  CreditCard,
  BarChart3,
  Shield
} from 'lucide-react';
import { AnalyticsState, INITIAL_ANALYTICS, IntroFirstNeed, SellerItem, BuyerItem } from './types';

// Set this to true to enable Firebase tracking, false to disable and save quota
const ENABLE_FIREBASE = true;

export default function App() {
  const [analytics, setAnalytics] = useState<AnalyticsState>(INITIAL_ANALYTICS);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem('relo_session_id');
    if (saved) return saved;
    const newId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    sessionStorage.setItem('relo_session_id', newId);
    return newId;
  });

  // Standardized Firestore error handler
  const handleFirestoreError = (error: unknown, operationType: string, path: string | null) => {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: auth.currentUser?.uid,
        email: auth.currentUser?.email,
        emailVerified: auth.currentUser?.emailVerified,
        isAnonymous: auth.currentUser?.isAnonymous,
        tenantId: auth.currentUser?.tenantId,
        providerInfo: auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  };

  // Initialize session in Firestore
  useEffect(() => {
    if (!ENABLE_FIREBASE) {
      console.log('Firebase is disabled (Dev Mode). Session ID:', sessionId);
      return;
    }
    const initSession = async () => {
      console.log('Attempting to initialize session:', sessionId);
      const sessionRef = doc(db, 'sessions', sessionId);
      try {
        const snap = await getDoc(sessionRef);
        if (!snap.exists()) {
          await setDoc(sessionRef, {
            id: sessionId,
            createdAt: serverTimestamp(),
            startSellingSimulationClicked: false,
            notifyBuyerClicked: false,
            acceptSuggestedPriceClicked: false,
            wouldSellHereClicked: false,
            sellInterestReasons: [],
            startBuyerSimulationClicked: false,
            checkoutItems: [],
            wouldBuyHereClicked: false,
            buyerInterestReasons: [],
            waitlistEmail: "",
            result_tag: 0,
            updatedAt: serverTimestamp()
          });
          console.log('Session created successfully in Firestore:', sessionId);
        } else {
          console.log('Session already exists in Firestore:', sessionId);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
        handleFirestoreError(error, 'get', `sessions/${sessionId}`);
      }
    };
    initSession();
  }, [sessionId]);

  const trackEvent = async (updates: any) => {
    if (!ENABLE_FIREBASE) {
      console.log('Firebase is disabled. Event tracked locally:', updates);
      return;
    }
    const sessionRef = doc(db, 'sessions', sessionId);
    try {
      await updateDoc(sessionRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', `sessions/${sessionId}`);
    }
  };

  const [sectionToScroll, setSectionToScroll] = useState<number | null>(null);
  
  const sellerRef = useRef<HTMLDivElement>(null);
  const buyerRef = useRef<HTMLDivElement>(null);
  const endingRef = useRef<HTMLDivElement>(null);

  const handleSectionComplete = (nextSection: number) => {
    setCurrentSection(nextSection);
    // Use a small timeout to ensure the component is rendered before scrolling
    setTimeout(() => {
      const refs = [null, sellerRef, buyerRef, endingRef];
      const targetRef = refs[nextSection];
      if (targetRef?.current) {
        targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Log analytics whenever they change
  useEffect(() => {
    console.log('Behavioral Signals Captured:', analytics);
  }, [analytics]);

  const updateAnalytics = (updates: Partial<AnalyticsState>) => {
    setAnalytics(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="relative min-h-full flex flex-col">
      {/* Section 1: Intro Story */}
      <IntroStory analytics={analytics} updateAnalytics={updateAnalytics} onComplete={() => {}} />
      
      {/* Section 2: Problem Framing & Product Intro */}
      <ProductIntroduction onComplete={() => {
        handleSectionComplete(1);
      }} />
      
      {/* Section 3: Seller Simulation */}
      <AnimatePresence>
        {currentSection >= 1 && (
          <SellerSimulation 
            ref={sellerRef}
            analytics={analytics} 
            updateAnalytics={updateAnalytics} 
            onComplete={() => handleSectionComplete(2)} 
            trackEvent={trackEvent}
          />
        )}
      </AnimatePresence>
      
      {/* Section 4: Buyer Simulation */}
      <AnimatePresence>
        {currentSection >= 2 && (
          <BuyerSimulation 
            ref={buyerRef}
            analytics={analytics} 
            updateAnalytics={updateAnalytics} 
            onComplete={() => handleSectionComplete(3)} 
            trackEvent={trackEvent}
          />
        )}
      </AnimatePresence>
      
      {/* Section 5: Ending */}
      <AnimatePresence>
        {currentSection >= 3 && (
          <Ending 
            ref={endingRef}
            analytics={analytics} 
            updateAnalytics={updateAnalytics} 
            trackEvent={trackEvent}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- SECTION 1: INTRO STORY ---
function IntroStory({ analytics, updateAnalytics, onComplete }: { 
  analytics: AnalyticsState, 
  updateAnalytics: (u: Partial<AnalyticsState>) => void,
  onComplete: () => void
}) {
  const lifestyleIcons = [
    Bed, Lamp, Monitor, Utensils, Coffee, Book, Shirt, Headphones, 
    Camera, Tv, Watch, Smartphone, Guitar, Bike, Music, Gamepad2, 
    Dumbbell, Palette, Mic2, Speaker
  ];

  return (
    <div className="flex flex-col">
      {/* Scene 1: Arrival */}
      <section className="scene-container bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          <h1 className="story-text">You arrive at your new campus.</h1>
          <p className="story-subtext">Your room is empty. A new chapter begins.</p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-8 md:mt-10 flex justify-center px-4"
          >
            <div className="relative w-full max-w-2xl">
              <img 
                src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=1000" 
                alt="Empty room" 
                className="w-full h-56 md:h-80 object-cover rounded-2xl shadow-2xl border border-border"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-2xl" />
              <div className="absolute bottom-4 left-6 text-left">
                <p className="text-white text-xs md:text-sm font-medium italic opacity-90">Quiet, overwhelming, empty.</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div 
            animate={{ y: [0, 10, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="mt-12 md:mt-16 text-muted flex flex-col items-center gap-2"
          >
            <span className="text-xs font-medium uppercase tracking-widest">Scroll to start your journey</span>
            <ArrowDown size={16} />
          </motion.div>
        </motion.div>
      </section>

      {/* Scene: The Reality Check */}
      <section className="scene-container bg-gray-50">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl w-full"
        >
          <h2 className="story-text mb-4 mx-auto">The real struggle.</h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto text-center">Getting settled is never as easy as it looks.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: Clock, 
                title: "The clock is ticking.", 
                text: "You need the basics—a bed, a desk, a lamp. And you need them before class starts."
              },
              { 
                icon: Wallet, 
                title: "The budget is tight.", 
                text: "Buying everything brand-new? Forget it. Your wallet can't take that hit."
              },
              { 
                icon: Package, 
                title: "The logistics nightmare.", 
                text: "Even if you find cheap furniture online, how are you moving a mattress across the city without a truck?"
              }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="card flex flex-col items-center text-center p-8 border-t-4 border-t-primary"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                  <card.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-4">{card.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>



      {/* Scene 3: Accumulation */}
      <section className="scene-container bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="story-text">Fast forward to graduation.</h2>
          <p className="story-subtext">Your empty room is now full. And it’s time to let it all go.</p>
          
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 1 }}
            className="mt-8 md:mt-10 grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4 opacity-40"
          >
            {Array.from({ length: 16 }).map((_, i) => {
              const IconComponent = lifestyleIcons[i % lifestyleIcons.length];
              return (
                <motion.div 
                  key={i} 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="p-3 md:p-4 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  <IconComponent size={20} md:size={24} className="text-gray-400" />
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* Scene: The Nightmare Back Again */}
      <section className="scene-container bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl w-full"
        >
          <h2 className="story-text mb-4 mx-auto text-center">The nightmare, back again.</h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto text-center">Clearing out is never as smooth as you planned.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: Calendar, 
                title: "The deadline pressure.", 
                text: "Your lease is up and your flight is booked. Finding reliable buyers in just a few days feels impossible."
              },
              { 
                icon: Trash2, 
                title: "Wasted value.", 
                text: "You spent good money on these items. Throwing perfectly good furniture in the dumpster or giving it away for free hurts."
              },
              { 
                icon: AlertTriangle, 
                title: "The selling nightmare.", 
                text: "Managing endless messages, lowball offers, and buyers who never show up while you're trying to pack is overwhelmingly stressful."
              }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="card flex flex-col items-center text-center p-8 border-t-4 border-t-primary"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                  <card.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-ink">{card.title}</h3>
                <p className="text-gray-500 leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>



      {/* Scene 5: Pain Points */}
      <section className="scene-container bg-white">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="max-w-5xl w-full"
        >
          <h2 className="story-text mb-4 mx-auto text-center">You try general platforms like Facebook Marketplace.</h2>
          <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto text-center">Everyone is on there, and so is every problem.</p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { 
                icon: User, 
                title: "Stranger danger.", 
                text: "You’re meeting up with completely anonymous people off the internet. You never really know who you’re inviting over or meeting in a parking lot."
              },
              { 
                icon: Bot, 
                title: "High risk of scams.", 
                text: "General platforms are flooded with fake profiles, automated bots, and payment frauds. It’s hard to tell what’s actually real anymore."
              },
              { 
                icon: Search, 
                title: "Endless scrolling.", 
                text: "These sites just passively list items. You waste hours searching for the exact thing you need, or wait days hoping the right buyer stumbles upon your post."
              }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.6 }}
                className="card flex flex-col items-center text-center p-8 border-t-4 border-t-primary"
              >
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                  <card.icon size={32} />
                </div>
                <h3 className="text-xl font-bold mb-3 text-ink">{card.title}</h3>
                <p className="text-gray-500 leading-relaxed">{card.text}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}

// --- SECTION 2: PRODUCT INTRODUCTION ---
function ProductIntroduction({ onComplete }: { onComplete: () => void }) {
  return (
    <section className="scene-container bg-white text-ink">
      <div className="max-w-5xl w-full">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10 md:mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4">What if there was a marketplace built for student life?</h2>
          <p className="text-lg md:text-xl text-muted">Designed for move-in, move-out, and everything in between.</p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          {[
            { title: "Verified Student Community", desc: "Every buyer and seller is a verified student from your campus.", icon: Shield },
            { title: "Smart Wishlist Matching", desc: "Stop searching. We connect your items directly to people already looking for them.", icon: Target },
            { title: "Dynamic Pricing Guidance", desc: "AI-driven suggestions to help you price right based on your departure deadline.", icon: Zap },
            { title: "Guaranteed Buyout", desc: "Can’t find a buyer? RELO buys your leftovers so you can leave stress-free.", icon: Handshake },
            { title: "In-App Secure Payments", desc: "No more awkward cash exchanges or Venmo scams. Secure, instant transactions.", icon: CreditCard },
            { title: "Flexible Storage Solutions", desc: "Not ready to sell? Store your items with us and pick them up next semester.", icon: Package },
            { title: "Campus Pickup Hubs", desc: "Safe, designated spots on campus for easy and reliable item handovers.", icon: MapPin }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
              className="p-3 md:p-4 bg-gray-50 border border-border rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-2">
                <feature.icon size={16} />
              </div>
              <h3 className="text-base font-bold mb-1">{feature.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-10 md:mt-12 flex justify-center"
        >
          <motion.button 
            onClick={onComplete} 
            className="btn-primary text-lg px-8 py-4 flex items-center gap-3"
          >
            Try the seller experience <ChevronRight size={20} />
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

// --- SECTION 3: SELLER SIMULATION ---
const SellerSimulation = forwardRef<HTMLDivElement, { 
  analytics: AnalyticsState, 
  updateAnalytics: (u: Partial<AnalyticsState>) => void,
  onComplete: () => void,
  trackEvent: (u: any) => void
}>(({ analytics, updateAnalytics, onComplete, trackEvent }, ref) => {
  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<SellerItem[]>([]);
  
  const items = [
    { id: 'lamp', name: 'Desk lamp', icon: '💡' },
    { id: 'monitor', name: 'Monitor', icon: '🖥️' },
    { id: 'vacuum', name: 'Vacuum', icon: '🧹' },
    { id: 'cooker', name: 'Rice cooker', icon: '🍚' },
    { id: 'chair', name: 'Chair', icon: '🪑' },
    { id: 'bedding', name: 'Bedding', icon: '🛏️' },
    { id: 'fridge', name: 'Mini fridge', icon: '🧊' },
    { id: 'fan', name: 'Electric fan', icon: '🌀' }
  ];

  const handleToggleItem = (item: { id: string, name: string, icon: string }) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else if (selectedItems.length < 3) {
      setSelectedItems([...selectedItems, {
        id: item.id,
        name: item.name,
        icon: item.icon,
        price: 30,
        condition: 'Good',
        departureDate: '3 weeks from now',
        published: false
      }]);
    }
  };

  const handlePublish = (id: string) => {
    setSelectedItems(selectedItems.map(i => i.id === id ? { ...i, published: true } : i));
    updateAnalytics({ 
      seller_selected_items: selectedItems.map(i => i.name),
      seller_listing_completed: true 
    });
  };

  const allPublished = selectedItems.length > 0 && selectedItems.every(i => i.published);

  useEffect(() => {
    if (step > 0) {
      const timer = setTimeout(() => {
        if (ref && typeof ref !== 'function' && ref.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [step, ref]);

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8 }}
      className={`min-h-screen transition-colors duration-700 ${step === 5 ? 'bg-slate-900' : 'bg-gray-50'} ${step === 0 ? 'py-12 justify-center' : 'pt-6 pb-16 justify-start'} md:py-16 px-6 flex flex-col items-center`}
    >
      <div className="max-w-4xl mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card p-8 md:p-10 text-center w-full"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 md:mb-8">
                <Clock size={32} md:size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-3 md:mb-4">Graduation is near. Your room is still full.</h2>
              <p className="text-lg md:text-xl text-muted mb-6 md:mb-8">You’re moving out in just 3 weeks. You have plenty to pack, but those extra essentials need a new home fast. Let our platform help you clear your space.</p>
              <motion.button 
                onClick={() => {
                  setStep(1);
                  trackEvent({ startSellingSimulationClicked: true });
                }} 
                className="btn-primary text-lg px-8"
              >
                Start selling simulation
              </motion.button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div 
              key="select"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Select up to 3 items to sell</h2>
                  <p className="text-muted text-sm">Select the items you can't take with you.</p>
                </div>
                <p className="text-muted font-medium">{selectedItems.length}/3 selected</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {items.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => handleToggleItem(item)}
                    className={`card-interactive flex flex-col items-center gap-3 md:gap-4 p-6 md:p-8 ${
                      selectedItems.find(i => i.id === item.id) ? 'card-selected' : ''
                    }`}
                  >
                    <span className="text-3xl md:text-4xl">{item.icon}</span>
                    <span className="font-bold text-sm md:text-base">{item.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 flex justify-end">
                <motion.button 
                  disabled={selectedItems.length === 0}
                  onClick={() => setStep(2)} 
                  className="btn-primary flex items-center gap-2"
                >
                  Continue <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="list"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full"
            >
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Quick Listing & Price Guidance</h2>
                <p className="text-muted text-sm leading-relaxed">Users provide item details and photos. We display real-time demand indicators and suggest a price range to help sellers optimize listings.</p>
              </div>
              
              <div className="space-y-3 md:space-y-4">
                {selectedItems.map(item => (
                  <div key={item.id} className="card p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start">
                    <div className="w-full md:w-32 h-32 md:w-40 md:h-40 bg-gray-100 rounded-xl flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                      <span className="text-3xl md:text-4xl mb-1">{item.icon}</span>
                      <span className="text-[8px] uppercase font-bold">Photo Placeholder</span>
                    </div>
                    
                    <div className="flex-1 w-full space-y-2 md:space-y-3">
                      <div className="grid grid-cols-2 gap-2 md:gap-3">
                        <div className="col-span-2">
                          <label className="block text-[8px] md:text-xs font-bold text-muted mb-1 uppercase">Title</label>
                          <input type="text" defaultValue={item.name} className="w-full p-1.5 md:p-2 rounded-xl border border-border focus:border-primary outline-none transition-all text-xs md:text-sm" />
                        </div>
                        <div>
                          <label className="block text-[8px] md:text-xs font-bold text-muted mb-1 uppercase">Condition</label>
                          <select defaultValue="Good" className="w-full p-1.5 md:p-2 rounded-xl border border-border focus:border-primary outline-none bg-white text-xs md:text-sm">
                            <option>Like new</option>
                            <option>Good</option>
                            <option>Fair</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[8px] md:text-xs font-bold text-muted mb-1 uppercase">Price ($)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={item.price === 0 ? '' : item.price} 
                              placeholder="0"
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                const newPrice = val === '' ? 0 : parseInt(val);
                                setSelectedItems(selectedItems.map(si => si.id === item.id ? { ...si, price: newPrice } : si));
                              }}
                              className="w-full p-1.5 md:p-2 rounded-xl border border-border focus:border-primary outline-none text-xs md:text-sm" 
                            />
                            <div className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[7px] md:text-[9px] font-bold text-primary bg-primary/10 px-1 md:px-1.5 py-0.5 rounded-lg">
                              <Zap size={6} md:size={8} /> ${Math.floor(item.price * 0.8)}-{Math.floor(item.price * 1.2)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        <div className="p-1.5 md:p-2 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-1.5">
                          <Clock size={12} md:size={14} className="text-primary" />
                          <span className="text-[8px] md:text-[10px] font-medium">Departure: <span className="text-primary">In 3 weeks</span></span>
                        </div>
                        <div className="p-1.5 md:p-2 bg-green-50 rounded-xl border border-green-100 flex items-center gap-1.5">
                          <Heart size={12} md:size={14} className="text-green-600" />
                          <span className="text-[8px] md:text-[10px] font-medium text-green-700">Wishlist Matching: <span className="font-bold">Active</span></span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        {item.published ? (
                          <div className="flex items-center gap-1.5 text-green-600 font-bold text-xs md:text-sm">
                            <CheckCircle2 size={14} md:size={16} /> Published
                          </div>
                        ) : (
                          <motion.button 
                            onClick={() => handlePublish(item.id)} 
                            className="btn-primary text-xs md:text-sm py-1.5 md:py-2"
                          >
                            Publish item
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 flex justify-end">
                <motion.button 
                  disabled={!allPublished}
                  onClick={() => setStep(3)} 
                  className="btn-primary flex items-center gap-2"
                >
                  Continue to results <ArrowRight size={20} />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="wishlist"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="max-w-2xl mx-auto"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4">Smart Matching</h2>
                <p className="text-muted text-lg leading-relaxed">Buyers submit wishlists for the items they intend to purchase. We monitor these requests and notify you the moment your listing matches an active requirement, enabling an immediate connection and eliminating the traditional wait for a buyer.</p>
              </div>
              
              <div className="card p-6 md:p-8 border-primary-light bg-primary/5 relative overflow-hidden">
                <div className="flex flex-wrap gap-2 mb-6 md:mb-0 md:absolute md:top-0 md:right-0 md:p-4 md:flex-col md:items-end">
                  <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">Wishlist match</span>
                  <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 whitespace-nowrap">
                    <ShieldCheck size={10} /> Verified Buyer
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-white rounded-full border border-border flex items-center justify-center text-2xl shadow-sm">
                      🎓
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Alex M.</h3>
                    <p className="text-muted text-sm flex items-center gap-1">
                      <UserCheck size={14} /> Sophomore @ Campus
                    </p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-border">
                    <span className="font-medium">Looking for:</span>
                    <span className="font-bold text-primary">{selectedItems[0]?.name || 'Desk lamp'}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-border">
                    <span className="font-medium">Local Campus:</span>
                    <span className="font-bold flex items-center gap-1">
                      <Store size={16} className="text-muted" /> North Campus (0.4 mi)
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-xl border border-border">
                    <span className="font-medium">Urgency:</span>
                    <span className="text-red-500 font-bold">Needs it this week</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => {
                      updateAnalytics({ seller_wishlist_choice: 'Wait for organic interest' });
                      setStep(4);
                    }}
                    className="btn-primary"
                  >
                    Wait for organic
                  </button>
                  <motion.button 
                    onClick={() => {
                      updateAnalytics({ seller_wishlist_choice: 'Notify this buyer' });
                      setStep(4);
                      trackEvent({ notifyBuyerClicked: true });
                    }}
                    className="btn-primary"
                  >
                    Notify this buyer
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="ai-price"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              {(() => {
                const currentPrice = selectedItems[0]?.price ?? 30;
                const suggestedPrice = Math.floor(currentPrice / 2);
                return (
                  <>
                    <div className="text-center mb-6">
                      <h2 className="text-2xl md:text-3xl font-bold">Dynamic Pricing Guidance</h2>
                      <p className="text-muted mt-2 text-sm leading-relaxed">
                        As the departure date approaches, we provide adaptive pricing suggestions to maximize the probability of a sale. By analyzing remaining time and active buyer requirements, the system helps users adjust prices to ensure a successful transaction before their deadline.
                      </p>
                    </div>
                    
                    <div className="card p-6 md:p-8 text-center">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4 md:mb-5">
                        <TrendingDown size={24} md:size={28} />
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-bold mb-1">Pricing Guidance</h3>
                      <p className="text-muted mb-6 md:mb-8 text-sm">Based on your departure urgency and campus demand.</p>
                      
                      <div className="flex justify-center items-center gap-6 md:gap-8 mb-6 md:mb-8">
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-muted uppercase mb-1">Current</p>
                          <p className="text-2xl md:text-3xl font-bold line-through text-gray-300">${currentPrice}</p>
                        </div>
                        <ArrowRight className="text-muted" size={20} />
                        <div className="text-center">
                          <p className="text-[10px] font-bold text-primary uppercase mb-1">Suggested</p>
                          <p className="text-4xl md:text-5xl font-bold text-primary">${suggestedPrice}</p>
                        </div>
                      </div>
                      
                      <div className="p-3 md:p-4 bg-gray-50 rounded-xl mb-6 md:mb-8 text-xs md:text-sm text-left border border-border">
                        <p className="font-bold mb-1">Why this price?</p>
                        <p className="text-muted">Lower price = 85% higher chance to sell before you leave in 14 days.</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <button 
                          onClick={() => {
                            updateAnalytics({ seller_ai_price_decision: 'Keep my price' });
                            setStep(5);
                          }}
                          className="btn-primary text-sm py-2 md:py-3"
                        >
                          Keep my price
                        </button>
                        <motion.button 
                          onClick={() => {
                            updateAnalytics({ seller_ai_price_decision: 'Accept suggested price' });
                            setStep(5);
                            trackEvent({ acceptSuggestedPriceClicked: true });
                          }}
                          className="btn-primary text-sm py-2 md:py-3"
                        >
                          Accept suggested
                        </motion.button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="buyout"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh] py-12"
            >
              <div className="text-left order-1 lg:order-1">
                <motion.h2 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  className="text-4xl md:text-5xl font-bold mb-6 text-white"
                >
                  Guaranteed Buyout Program
                </motion.h2>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
                  className="text-slate-400 text-lg leading-relaxed mb-8"
                >
                  For items unsold by the departure date, we offer a guaranteed buyout option. Executed at the lowest suggested pricing tier, this mechanism prioritizes immediate stress relief and waste reduction, ensuring users recover partial value without the burden of disposal.
                </motion.p>
                <div className="hidden lg:block">
                  <motion.button 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                    onClick={() => setStep(6)}
                    className="btn-primary px-8 py-3 text-lg"
                  >
                    Continue
                  </motion.button>
                </div>
              </div>

              <div className="relative flex justify-center lg:justify-end order-2 lg:order-2 lg:row-span-2">
                <motion.div 
                  initial={{ y: -500, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ 
                    delay: 0.8, 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 15 
                  }}
                  className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl relative"
                >
                  <div className="p-6 border-b border-slate-700 bg-slate-800/50">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">PLATFORM BUYOUT OFFER</span>
                      <ShieldCheck className="text-orange-500" size={18} />
                    </div>
                  </div>
                  
                  <div className="p-8 space-y-6">
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-bold mb-1">Item Name</p>
                      <p className="text-xl font-bold text-white">Desk Lamp</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-500 text-xs uppercase font-bold mb-1">Status</p>
                      <p className="text-sm text-slate-300">Unsold at deadline</p>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-slate-500 text-xs uppercase font-bold mb-1">Buyout Price</p>
                      <p className="text-5xl font-bold text-orange-500">$5.00</p>
                    </div>
                    
                    <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
                      <p className="text-[10px] text-slate-400 leading-tight">
                        Based on minimum suggested tier. Zero disposal fees.
                      </p>
                    </div>
                    
                    <button disabled className="w-full py-4 bg-slate-700 text-slate-400 rounded-xl font-bold text-sm cursor-not-allowed flex items-center justify-center gap-2">
                      <Clock size={16} /> Funds Guaranteed
                    </button>
                  </div>

                  {/* Stamp Effect */}
                  <motion.div 
                    initial={{ scale: 2, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 1.8, duration: 0.4, ease: "backOut" }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-4 border-orange-500/50 text-orange-500 font-black text-3xl px-4 py-2 rounded-xl uppercase tracking-tighter pointer-events-none bg-slate-800/80 backdrop-blur-sm"
                  >
                    Guaranteed
                  </motion.div>
                </motion.div>
              </div>

              <div className="flex justify-center lg:justify-start pt-12 pb-20 lg:pt-0 lg:pb-0 order-3 lg:order-3 lg:col-start-1 lg:hidden">
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  onClick={() => setStep(6)}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div 
              key="commitment"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-4xl font-bold mb-4">Experience complete.</h2>
              <p className="text-xl text-muted mb-12">You’ve now experienced how selling could work on our platform.</p>
              
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button 
                  onClick={() => {
                    updateAnalytics({ seller_commitment_choice: 'Continue exploring' });
                    onComplete();
                  }}
                  className="btn-primary text-lg px-10"
                >
                  Continue exploring
                </button>
                <motion.button 
                  onClick={() => {
                    updateAnalytics({ seller_commitment_choice: 'I would sell items here' });
                    setStep(7);
                    trackEvent({ wouldSellHereClicked: true });
                  }}
                  className="btn-primary text-lg px-10"
                >
                  I would sell items here
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div 
              key="reasons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xl w-full mx-auto px-6"
            >
              <div className="card p-6 md:p-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">What makes you most willing to sell here?</h2>
                <p className="text-muted mb-6 text-sm md:text-base">Select all that apply.</p>
                
                <div className="space-y-2 mb-8">
                  {[
                    "Buyer wishlist matching",
                    "Verified buyers",
                    "Pricing guidance",
                    "Local campus users",
                    "Guaranteed buyout program"
                  ].map(reason => (
                    <button
                      key={reason}
                      onClick={() => {
                        const current = analytics.seller_interest_reasons;
                        const next = current.includes(reason) 
                          ? current.filter(r => r !== reason) 
                          : [...current, reason];
                        updateAnalytics({ seller_interest_reasons: next });
                        trackEvent({ sellInterestReasons: next });
                      }}
                      className={`w-full p-3 md:p-4 rounded-xl border-2 text-left font-medium transition-all flex justify-between items-center text-sm md:text-base ${
                        analytics.seller_interest_reasons.includes(reason)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border bg-white hover:border-primary-light'
                      }`}
                    >
                      {reason}
                      {analytics.seller_interest_reasons.includes(reason) && <CheckCircle2 size={18} md:size={20} />}
                    </button>
                  ))}
                </div>
                
                <motion.button 
                  onClick={onComplete}
                  className="btn-primary w-full py-4 text-lg font-bold"
                >
                  Continue
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.section>
  );
});
const BuyerSimulation = forwardRef<HTMLDivElement, { 
  analytics: AnalyticsState, 
  updateAnalytics: (u: Partial<AnalyticsState>) => void,
  onComplete: () => void,
  trackEvent: (u: any) => void
}>(({ analytics, updateAnalytics, onComplete, trackEvent }, ref) => {
  const [step, setStep] = useState(0);
  const [selectedItems, setSelectedItems] = useState<BuyerItem[]>([]);
  
  useEffect(() => {
    if (ref && 'current' in ref && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step, ref]);

  const buyerItems: BuyerItem[] = useMemo(() => {
    const items: BuyerItem[] = [
      { id: 'cooker-v', name: 'Rice cooker', price: 30, seller: 'Sarah K.', verified: true, image: '🍚' },
      { id: 'cooker-nv', name: 'Rice cooker', price: 30, seller: 'User992', verified: false, image: '🍚' },
      { id: 'lamp-v', name: 'Desk lamp', price: 15, seller: 'Jason L.', verified: true, image: '💡' },
      { id: 'lamp-nv', name: 'Desk lamp', price: 15, seller: 'CookerExpert', verified: false, image: '💡' },
      { id: 'chair-v', name: 'Chair', price: 25, seller: 'Elena R.', verified: true, image: '🪑' },
      { id: 'chair-nv', name: 'Chair', price: 25, seller: 'FurnitureGuy', verified: false, image: '🪑' },
    ];
    // Shuffle the items
    return [...items].sort(() => Math.random() - 0.5);
  }, []);

  const handleToggleItem = (item: BuyerItem) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      if (selectedItems.length < 2) {
        setSelectedItems([...selectedItems, item]);
      } else {
        // FIFO: Remove the first one and add the new one
        setSelectedItems([selectedItems[1], item]);
      }
    }
  };

  const handleCheckout = () => {
    const verifiedCount = selectedItems.filter(i => i.verified).length;
    updateAnalytics({
      buyer_selected_items: selectedItems.map(i => i.name),
      buyer_verified_count: verifiedCount,
      buyer_nonverified_count: selectedItems.length - verifiedCount
    });
    trackEvent({
      checkoutItems: selectedItems.map(i => ({ name: i.name, verified: i.verified })),
      result_tag: verifiedCount
    });
    setStep(4);
  };

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="min-h-screen bg-white overflow-hidden flex flex-col items-center justify-center"
    >
      <AnimatePresence mode="wait">
        {/* Step 0: Start Simulation */}
        {step === 0 && (
          <motion.div 
            key="start-simulation"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-xl w-full mx-auto"
          >
            <div className="card p-8 md:p-12 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-6 md:mb-8">
                <ShoppingCart size={32} md:size={40} />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">A new city. An empty room.</h2>
              <p className="text-muted text-base md:text-lg mb-8 md:mb-10 leading-relaxed">
                You’ve just arrived on campus. You need the basics to settle in, but figuring out where to buy them is a headache. Let our platform help you find exactly what you need.
              </p>
              <motion.button 
                onClick={() => {
                  setStep(1);
                  trackEvent({ startBuyerSimulationClicked: true });
                }}
                className="btn-primary text-lg px-10 py-4"
              >
                Start buyer simulation
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 1: Wishlist */}
        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gray-50 flex items-center justify-center p-6 w-full"
          >
            <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
              {/* Left: Content */}
              <div className="flex-1 text-center md:text-left space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Build Your Wishlist</h2>
                  <p className="text-xl text-muted leading-relaxed max-w-lg mx-auto md:mx-0">
                    Users can create a personal wishlist. Our platform automatically matches these requests with active listings.
                  </p>
                </motion.div>
              </div>

              {/* Right: Phone Mockup */}
              <div className="flex-1 flex justify-center">
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white p-6 md:p-8 rounded-[3rem] shadow-2xl border border-border w-full max-w-sm"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white font-bold">R</div>
                    <h3 className="font-bold text-xl">RELO Wishlist</h3>
                  </div>
                  
                  <div className="space-y-3 min-h-[180px]">
                    {['Rice cooker', 'Desk lamp', 'Chair'].map((item, i) => (
                      <motion.div 
                        key={item}
                        initial={{ x: -20, opacity: 0, scale: 0.95 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        transition={{ 
                          delay: 0.6 + i * 0.4,
                          duration: 0.5,
                          type: "spring"
                        }}
                        className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-border shadow-sm"
                      >
                        <motion.div 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + i * 0.4 }}
                          className="w-5 h-5 rounded-full border-2 border-primary flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        </motion.div>
                        <span className="font-semibold text-base">{item}</span>
                      </motion.div>
                    ))}
                  </div>

                  <motion.button 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.0 }}
                    onClick={() => setStep(2)}
                    className="w-full mt-8 btn-primary flex items-center justify-center gap-2 py-4 text-lg"
                  >
                    Create Wishlist <ArrowRight size={20} />
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Matching */}
        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-white flex items-center justify-center p-6 w-full relative"
          >
            <div className="max-w-6xl w-full flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
              {/* Left: Content */}
              <div className="flex-1 text-center md:text-left space-y-8 order-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">Smart Matching</h2>
                  <p className="text-xl text-muted leading-relaxed max-w-lg mx-auto md:mx-0">
                    Users are notified instantly when their desired items are posted. This eliminates the friction of manual searching.
                  </p>
                </motion.div>
              </div>

              {/* Right: Phone & Plane */}
              <div className="flex-1 relative flex justify-center order-2 md:-translate-x-16">
                {/* Paper Plane Animation */}
                <motion.div
                  initial={{ x: -400, y: 200, opacity: 0, rotate: -45, scale: 0.5 }}
                  animate={{ 
                    x: [-400, -100, 50], 
                    y: [200, 0, -50],
                    opacity: [0, 1, 0],
                    rotate: [-45, 0, 20],
                    scale: [0.5, 1, 0.8]
                  }}
                  transition={{ duration: 2, ease: "easeInOut", delay: 0.5 }}
                  className="absolute top-1/2 left-0 text-primary z-30 pointer-events-none"
                >
                  <Send size={60} />
                </motion.div>

                {/* Phone Mockup */}
                <motion.div 
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="relative w-64 h-[500px] md:w-72 md:h-[580px] bg-ink rounded-[3rem] border-[10px] border-gray-800 shadow-2xl overflow-hidden"
                >
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-800 rounded-b-3xl z-20" />
                  
                  {/* Screen Content */}
                  <div className="p-4 pt-16 space-y-3">
                    {[
                      { id: 1, item: 'Rice Cooker 🍚', delay: 1.2 },
                      { id: 2, item: 'Desk Lamp 💡', delay: 1.6 },
                      { id: 3, item: 'Chair 🪑', delay: 2.0 },
                    ].map((notif) => (
                      <motion.div 
                        key={notif.id}
                        initial={{ x: 50, opacity: 0, scale: 0.9 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        transition={{ delay: notif.delay, type: "spring", stiffness: 100 }}
                        className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-5 h-5 bg-primary rounded-md flex items-center justify-center text-[8px] text-white font-bold">R</div>
                          <span className="text-[9px] text-white/60 font-medium">RELO • Just now</span>
                        </div>
                        <p className="text-[11px] text-white font-bold">Match Found!</p>
                        <p className="text-[10px] text-white/80">A {notif.item} just listed.</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom Bar */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full" />
                </motion.div>

                {/* Background Glow */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-primary/10 rounded-full blur-3xl -z-10"
                />
              </div>

              {/* Button */}
              <div className="order-3 flex justify-center md:justify-end md:absolute md:bottom-12 md:right-12 z-50">
                <motion.button 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 2.5 }}
                  onClick={() => setStep(3)}
                  className="btn-primary text-lg px-8 py-4 shadow-xl"
                >
                  See Matches
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Your Choice */}
        {step === 3 && (
          <motion.div 
            key="step3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-10 md:py-12 px-6 bg-gray-100 w-full"
          >
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-6">
                <div className="max-w-xl">
                  <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Select 2 Items for Checkout</h2>
                  <p className="text-muted text-sm md:text-base leading-relaxed">
                    Multiple students are selling what you need. Review the options below and add exactly two items to your cart to proceed.
                  </p>
                </div>
                <div className="relative">
                  <div className="p-2 md:p-3 bg-white rounded-2xl shadow-sm border border-border flex items-center gap-2 md:gap-3">
                    <ShoppingCart className="text-primary" size={16} md:size={18} />
                    <div className="text-left">
                      <p className="text-[7px] font-bold text-muted uppercase">Cart</p>
                      <p className="font-bold text-[10px] md:text-xs">{selectedItems.length} / 2 Items</p>
                    </div>
                    {selectedItems.length > 0 && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center border-2 border-white"
                      >
                        {selectedItems.length}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {buyerItems.map((item) => (
                  <motion.div 
                    key={item.id}
                    layout
                    onClick={() => handleToggleItem(item)}
                    className={`card-interactive flex flex-col p-0 overflow-hidden bg-gray-50 shadow-lg ${
                      selectedItems.find(i => i.id === item.id) ? 'card-selected ring-4 ring-primary/20' : ''
                    }`}
                  >
                    <div className="h-16 md:h-24 bg-white flex items-center justify-center text-2xl md:text-3xl relative">
                      {item.image}
                      {item.verified && (
                        <div className="verified-badge">
                          <Check size={8} md:size={10} strokeWidth={3} /> Verified Student
                        </div>
                      )}
                    </div>
                    <div className="p-2 md:p-2.5 bg-white">
                      <div className="flex justify-between items-start mb-0.5 md:mb-1">
                        <h3 className="font-bold text-xs md:text-sm truncate pr-2">{item.name}</h3>
                        <span className="text-primary font-bold text-xs md:text-sm">${item.price}</span>
                      </div>
                      <p className="text-[8px] md:text-[10px] text-muted mb-1.5 md:mb-2">Seller: {item.seller}</p>
                      <div className="flex items-center justify-between mt-1.5 md:mt-2 pt-1.5 md:pt-2 border-t border-border">
                        <span className="text-[7px] md:text-[9px] text-muted flex items-center gap-1">
                          <MapPin size={7} md:size={9} /> 0.3 mi away
                        </span>
                        <button className={`text-[8px] md:text-[10px] font-bold ${selectedItems.find(i => i.id === item.id) ? 'text-primary' : 'text-muted'}`}>
                          {selectedItems.find(i => i.id === item.id) ? 'Selected' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex justify-center">
                <motion.button 
                  disabled={selectedItems.length !== 2}
                  onClick={handleCheckout}
                  className={`btn-primary px-10 py-3 text-base flex items-center gap-2 transition-all ${
                    selectedItems.length === 2 ? 'opacity-100 scale-100' : 'opacity-50 scale-95 cursor-not-allowed'
                  }`}
                >
                  Check Out <ArrowRight size={18} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 4: Checkout Summary */}
        {step === 4 && (
          <motion.div 
            key="step4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-10 md:py-16 px-6 bg-white w-full"
          >
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-3">Checkout Summary</h2>
                <p className="text-sm md:text-base text-muted">Please review your selected items before proceeding to coordinate the pickup.</p>
              </div>

              <motion.div 
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                className="card p-5 md:p-6 space-y-5 shadow-2xl border-border relative z-10"
              >
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm border border-gray-100">
                          {item.image}
                        </div>
                        <div>
                          <p className="font-bold text-base">{item.name}</p>
                          <p className="text-[10px] text-muted">Seller: {item.seller}</p>
                        </div>
                      </div>
                      <p className="font-bold text-primary text-base">${item.price}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-dashed border-gray-200 space-y-2">
                  <div className="flex justify-between text-muted text-sm">
                    <span>Subtotal</span>
                    <span>${selectedItems.reduce((acc, item) => acc + item.price, 0)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">${selectedItems.reduce((acc, item) => acc + item.price, 0)}</span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white shrink-0">
                    <UserCheck size={14} />
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    You will arrange the pickup directly with the seller on campus. Zero shipping fees.
                  </p>
                </div>

                <motion.button 
                  onClick={() => setStep(5)}
                  className="btn-primary w-full py-3 text-base font-bold shadow-lg"
                >
                  Confirm & Arrange Pickup
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Step 5: Integrated Chat & Safe Meetups */}
        {step === 5 && (
          <motion.div 
            key="step5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-8 md:py-12 px-6 bg-white w-full relative"
          >
            {(() => {
              const chatItem = selectedItems[0] || { seller: 'Sarah K.', name: 'rice cooker' };
              return (
                <>
                  <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6 md:gap-10 items-center">
                    <div className="space-y-4 md:space-y-6">
                      <div className="space-y-2 md:space-y-3">
                        <h2 className="text-2xl md:text-3xl font-bold">Integrated Chat & Safe Meetups</h2>
                        <p className="text-base md:text-lg text-muted leading-relaxed">
                          Coordinate exchanges entirely within the app without sharing personal contact info. The platform recommends highly visible, public campus locations for secure handoffs.
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-2xl border border-green-100">
                          <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center text-white">
                            <ShieldCheck size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-green-900 text-sm md:text-base">Suggested Safe Zones</p>
                            <p className="text-[10px] md:text-xs text-green-700">Library, Canteen, or Dorm Lobby</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-2xl border border-blue-100">
                          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white">
                            <MapPin size={18} />
                          </div>
                          <div>
                            <p className="font-bold text-blue-900 text-sm md:text-base">Proximity Indicator</p>
                            <p className="text-[10px] md:text-xs text-blue-700">Seller is in Building B (0.1 mi)</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <div className="bg-gray-100 rounded-[2rem] p-4 shadow-2xl border border-border aspect-[4/5] relative overflow-hidden">
                        {/* Chat Mockup */}
                        <div className="bg-white rounded-2xl h-full flex flex-col shadow-inner">
                          <div className="p-4 border-b border-border flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-bold">
                              {chatItem.seller[0]}
                            </div>
                            <div>
                              <p className="font-bold text-sm">{chatItem.seller}</p>
                              <div className="text-[10px] text-green-500 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                              </div>
                            </div>
                          </div>
                          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.5 }}
                              className="bg-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm"
                            >
                              Hi! I saw you're interested in the {chatItem.name.toLowerCase()}.
                            </motion.div>
                            <motion.div 
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 1.5 }}
                              className="bg-primary text-white p-3 rounded-2xl rounded-tr-none max-w-[80%] ml-auto text-sm"
                            >
                              Yes! Can we meet at the Library lobby?
                            </motion.div>
                            <motion.div 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 2.5 }}
                              className="bg-gray-100 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-sm"
                            >
                              Perfect! I'm in Building B, so I can be there in 5 mins.
                            </motion.div>
                          </div>
                          <div className="p-4 border-t border-border flex gap-2">
                            <div className="flex-1 bg-gray-50 rounded-full px-4 py-2 text-xs text-muted border border-border">
                              Type a message...
                            </div>
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
                              <Send size={14} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 flex justify-center md:justify-end md:absolute md:bottom-12 md:right-12 z-50">
                    <motion.button 
                      onClick={() => setStep(6)} 
                      className="btn-primary py-3 px-10 text-base shadow-xl"
                    >
                      Continue
                    </motion.button>
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Step 6: Curated Starter Bundles */}
        {step === 6 && (
          <motion.div 
            key="step6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full bg-slate-950 text-white flex items-center justify-center overflow-hidden"
          >
            <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 items-center min-h-screen">
              {/* Left Column: Content */}
              <div className="flex flex-col justify-center items-center lg:items-start p-8 lg:p-24 space-y-8 z-10 text-center lg:text-left order-1 lg:order-1">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">
                    Curated Starter Bundles
                  </h2>
                  <p className="text-lg md:text-xl text-slate-400 leading-relaxed max-w-xl">
                    To bypass the time and energy required to acquire items individually, we provide pre-packaged starter bundles. Users can instantly secure all their basic necessities in one streamlined transaction, skipping the hassle of individual sourcing.
                  </p>
                  <div className="hidden lg:block pt-4">
                    <motion.button 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                      onClick={() => setStep(7)}
                      className="btn-primary px-8 py-3 text-lg"
                    >
                      Continue
                    </motion.button>
                  </div>
                </motion.div>
              </div>

              {/* Right Column: Animation Area */}
              <div className="relative flex items-center justify-center min-h-[50vh] lg:min-h-screen order-2 lg:order-2 lg:row-span-2">
                {/* Chaos Icons */}
                <AnimatePresence>
                  {[
                    { Icon: Lamp, x: -150, y: -200, delay: 0 },
                    { Icon: Utensils, x: 180, y: -150, delay: 0.1 },
                    { Icon: Coffee, x: -200, y: 50, delay: 0.2 },
                    { Icon: Shirt, x: 150, y: 180, delay: 0.3 },
                    { Icon: Bed, x: -100, y: 220, delay: 0.4 },
                    { Icon: Monitor, x: 220, y: -50, delay: 0.5 },
                    { Icon: Book, x: -250, y: -80, delay: 0.6 },
                    { Icon: Smartphone, x: 50, y: -250, delay: 0.7 },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: item.x, y: item.y, scale: 0 }}
                      animate={{ 
                        opacity: [0, 0.4, 0.4],
                        x: [item.x, item.x, 0],
                        y: [item.y, item.y, 0],
                        scale: [0, 1, 0],
                      }}
                      transition={{
                        times: [0, 0.2, 1],
                        duration: 2.5,
                        delay: item.delay,
                        ease: "easeInOut"
                      }}
                      className="absolute text-white/60"
                    >
                      <motion.div
                        animate={{ y: [0, -15, 0] }}
                        transition={{ repeat: Infinity, duration: 3 + i, ease: "easeInOut" }}
                      >
                        <item.Icon size={48} />
                      </motion.div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Bundle Card */}
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotateY: 90 }}
                  animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                  transition={{ 
                    delay: 2.2, 
                    duration: 0.8, 
                    type: "spring", 
                    stiffness: 100, 
                    damping: 12 
                  }}
                  className="relative z-20 w-80 bg-slate-900/40 backdrop-blur-xl border border-orange-500/30 rounded-[2.5rem] p-8 shadow-2xl shadow-orange-500/10 flex flex-col items-center text-center space-y-6"
                >
                  {/* Glow Effect */}
                  <div className="absolute inset-0 bg-orange-500/5 rounded-[2.5rem] blur-2xl -z-10" />
                  
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-32 h-32 bg-orange-500/10 rounded-3xl flex items-center justify-center text-orange-500"
                  >
                    <Package size={80} strokeWidth={1.5} />
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-white">Essentials Kit</h3>
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
                      <Clock size={14} />
                      <span>one transaction</span>
                    </div>
                  </div>

                  <div className="w-full pt-4 border-t border-white/10">
                    <p className="text-3xl font-black text-orange-500">$200</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">All-inclusive Price</p>
                  </div>

                  {/* Guarantee Stamp */}
                  <motion.div
                    initial={{ scale: 3, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: -12 }}
                    transition={{ delay: 3.2, duration: 0.5, type: "spring" }}
                    className="absolute -top-4 -right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-lg shadow-green-900/20 border-2 border-green-400"
                  >
                    one transaction
                  </motion.div>
                </motion.div>

                {/* Background Particles/Glow */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[120px]" />
                </div>
              </div>

              <div className="flex justify-center lg:justify-start items-start px-8 lg:px-24 pt-12 pb-20 lg:pt-0 lg:pb-0 z-10 order-3 lg:order-3 lg:col-start-1 lg:hidden">
                <motion.button 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  onClick={() => setStep(7)}
                  className="btn-primary px-8 py-3 text-lg"
                >
                  Continue
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 7: Buyer Experience Complete */}
        {step === 7 && (
          <motion.div 
            key="step7"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="max-w-2xl w-full mx-auto text-center px-6"
          >
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Buyer experience complete.</h2>
                <p className="text-xl text-muted leading-relaxed">
                  You've seen how our platform simplifies buying campus essentials. Based on this tour, would you use this to buy items?
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button 
                  onClick={() => {
                    updateAnalytics({ buyer_commitment_choice: 'Continue' });
                    onComplete();
                  }}
                  className="btn-primary w-full sm:w-auto px-10 py-4"
                >
                  Continue
                </button>
                <motion.button 
                  onClick={() => {
                    updateAnalytics({ buyer_commitment_choice: 'I would buy here' });
                    setStep(8);
                    trackEvent({ wouldBuyHereClicked: true });
                  }}
                  className="btn-primary w-full sm:w-auto px-10 py-4"
                >
                  I would buy here
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 8: Buyer Reasons Survey */}
        {step === 8 && (
          <motion.div 
            key="buyer-reasons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl w-full mx-auto px-6"
          >
            <div className="card p-6 md:p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">What makes you most willing to buy here?</h2>
              <p className="text-muted mb-6 text-sm md:text-base">Select all that apply.</p>
              
              <div className="space-y-2 mb-8">
                {[
                  "Smart Wishlist Matching",
                  "Verified Student Sellers",
                  "Safe In-App Chat & Meetups",
                  "Local Campus Inventory",
                  "Pre-packaged Starter Kits"
                ].map(reason => (
                  <button
                    key={reason}
                    onClick={() => {
                      const current = analytics.buyer_interest_reasons;
                      const next = current.includes(reason) 
                        ? current.filter(r => r !== reason) 
                        : [...current, reason];
                      updateAnalytics({ buyer_interest_reasons: next });
                      trackEvent({ buyerInterestReasons: next });
                    }}
                    className={`w-full p-3 md:p-4 rounded-xl border-2 text-left font-medium transition-all flex justify-between items-center text-sm md:text-base ${
                      analytics.buyer_interest_reasons.includes(reason)
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-white hover:border-primary-light'
                    }`}
                  >
                    {reason}
                    {analytics.buyer_interest_reasons.includes(reason) && <CheckCircle2 size={18} md:size={20} />}
                  </button>
                ))}
              </div>
              
              <motion.button 
                onClick={onComplete} 
                className="btn-primary w-full py-4 text-lg font-bold"
              >
                Continue
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
});
const Ending = forwardRef<HTMLDivElement, { 
  analytics: AnalyticsState, 
  updateAnalytics: (u: Partial<AnalyticsState>) => void,
  trackEvent: (u: any) => void
}>(({ analytics, updateAnalytics, trackEvent }, ref) => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateAnalytics({ final_waitlist_email: email });
    trackEvent({ waitlistEmail: email });
    setSubmitted(true);
  };

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.8 }}
      className="scene-container bg-white text-ink min-h-screen"
    >
      <div className="max-w-3xl w-full text-center">
        <div
          className="opacity-100"
        >
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-8">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-5xl font-bold mb-4">Thanks for exploring.</h2>
          <p className="text-2xl text-muted mb-12">You just helped us test a better student marketplace.</p>
          
          <div className="card bg-gray-50 border-border p-6 md:p-10 text-left">
            {!submitted ? (
              <>
                <h3 className="text-xl md:text-2xl font-bold mb-2">Join the waitlist</h3>
                <p className="text-sm md:text-base text-muted mb-6 md:mb-8">Be the first to know when we launch on your campus.</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 md:gap-4">
                  <div className="flex-1 relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} md:size={20} />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com" 
                      className="w-full bg-white border border-border rounded-xl py-3 md:py-4 pl-11 md:pl-12 pr-4 outline-none focus:border-primary transition-all text-sm md:text-base"
                    />
                  </div>
                  <motion.button 
                    type="submit" 
                    className="btn-primary px-8 py-3"
                  >
                    Join early access
                  </motion.button>
                </form>
              </>
            ) : (
              <div className="text-center py-4">
                <h3 className="text-xl md:text-2xl font-bold text-primary mb-2">You're on the list!</h3>
                <p className="text-gray-400 text-sm md:text-base">We'll reach out soon with next steps.</p>
              </div>
            )}
          </div>
          
          <div className="mt-10 md:mt-12 flex flex-col items-center gap-4 md:gap-6">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center gap-2 text-muted hover:text-ink transition-colors text-sm md:text-base"
            >
              <RefreshCw size={16} md:size={18} /> Back to top
            </button>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">RELO experiment V1.0</p>
          </div>
        </div>
      </div>
    </motion.section>
  );
});
