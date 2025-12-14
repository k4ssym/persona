import React from 'react';
import { KioskProvider, useKiosk } from './context/KioskContext';
import { AppState } from './types';
import AvatarScene from './components/AvatarScene';
import SleepOverlay from './components/SleepOverlay';
import Header from './components/Header';
import DashboardWidgets from './components/DashboardWidgets';
import AuroraBackground from './components/AuroraBackground';
import MessageBar from './components/MessageBar';
import Typewriter from './components/Typewriter';
import ActionOverlay from './components/ActionOverlay';
import Sidebar from './components/Sidebar';
import KioskViews from './components/KioskViews';
import { motion, AnimatePresence } from 'framer-motion';

// Fix: Cast motion to any to prevent TypeScript errors
const Motion = motion as any;

// --- DASHBOARD VIEW COMPONENT ---
// This acts as the "Home Page" content
const DashboardView = () => {
  return (
    <div className="flex flex-col items-center w-full h-full pt-[12vh]">
      {/* Greeting Section */}
      <div className="text-center pointer-events-auto mb-8 md:mb-10 z-20">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium text-white tracking-tight leading-tight drop-shadow-2xl mb-4 flex flex-col md:block">
            <span className="opacity-80 font-light mr-4 inline-block">
              <Typewriter text="Good Morning," delay={0.5} hideCursorOnComplete />
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 inline-block">
              <Typewriter text="Arai" delay={1.8} hideCursorOnComplete />
            </span>
          </h1>
        </Motion.div>

        <Motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3, duration: 0.8 }}
          className="text-lg md:text-xl text-white/50 font-light tracking-wide max-w-md mx-auto"
        >
          <Typewriter text="I'm ready to assist you. Tap me to start." delay={3} hideCursorOnComplete />
        </Motion.p>
      </div>

      {/* Widgets Section - Toggleable via Header */}
      <div className="w-full z-20">
        <DashboardWidgets />
      </div>
    </div>
  );
};

// --- MAIN LAYOUT COMPONENT ---
const KioskInterface = () => {
  const { appState, isIdle, inConversation, enterConversation, showDashboard, lastAction, clearAction, activeView } = useKiosk();

  // Handle Avatar Click to transition from Dashboard -> Conversation
  const handleAvatarClick = () => {
    if (!isIdle && !inConversation && activeView === 'home') {
      enterConversation();
    }
  };

  // Determine Aura Colors based on state
  const auraColor = appState === AppState.LISTENING
    ? "bg-red-500/20"
    : appState === AppState.PROCESSING
      ? "bg-cyan-500/30"
      : appState === AppState.SPEAKING
        ? "bg-purple-500/30"
        : "bg-blue-500/10";

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black font-sans flex flex-col select-none">

      {/* LAYER 0: Background Strategy */}
      {/* Aurora is ONLY for Home. Static Professional Gradient for Admin Views. */}
      {activeView === 'home' ? (
        <AuroraBackground />
      ) : (
        <div className="fixed inset-0 z-0 bg-[#080808]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[linear-gradient(to_bottom,_rgba(255,255,255,0.01)_1px,_transparent_1px)] bg-[size:100%_40px] opacity-20" />
        </div>
      )}

      {/* LAYER 1: Header & Sidebar */}
      <AnimatePresence>
        {!isIdle && (
          <>
            {/* Header - Always visible on all pages when active */}
            <Motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 w-full z-50 pl-20"
            >
              <Header />
            </Motion.div>

            {/* New Pinned Sidebar */}
            <Sidebar />
          </>
        )}
      </AnimatePresence>

      {/* LAYER 2: Main Content Switcher */}
      {/* Added pl-20 (Sidebar width) + extra padding */}
      <div className="relative z-20 flex flex-col w-full h-full max-w-[1600px] mx-auto p-6 md:p-10 pl-24 md:pl-32">

        {/* ROUTE: HOME */}
        <AnimatePresence mode="wait">
          {activeView === 'home' && !isIdle && !inConversation && showDashboard && !lastAction && (
            <Motion.div
              key="home-dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full pointer-events-none" // Widgets have pointer-events-auto inside
            >
              <DashboardView />
            </Motion.div>
          )}

          {/* ROUTE: PAGES (Analytics, Logs, Settings) */}
          {activeView !== 'home' && (
            <Motion.div
              key="kiosk-views"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full pointer-events-auto"
            >
              <KioskViews />
            </Motion.div>
          )}
        </AnimatePresence>

        {/* STAGE 3: CONVERSATION UI (Overlay on top of Home) */}
        <AnimatePresence>
          {inConversation && !lastAction && activeView === 'home' && (
            <Motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col pointer-events-none"
            >
              <MessageBar />
            </Motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* LAYER 3: Avatar Scene (Home View Only) */}
      <Motion.div
        className={`absolute left-0 right-0 mx-auto w-full max-w-[1200px] h-[800px] transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${!isIdle && !inConversation ? 'cursor-pointer z-30' : 'z-10'}
        `}
        style={{
          // CRITICAL: Hide Avatar completely when not on Home to act as "Separate Pages"
          display: activeView === 'home' ? 'block' : 'none'
        }}
        // Animation Variants for Avatar Position
        initial="idle"
        animate={inConversation ? "conversation" : "dashboard"}
        variants={{
          idle: { y: "100vh" },
          dashboard: {
            y: "40vh",
            scale: 0.55,
            filter: "brightness(0.95)"
          },
          conversation: {
            y: "45vh",
            scale: 0.65,
            filter: "brightness(1.1)"
          }
        }}
      >
        {/* Dynamic Aura - Only show if Avatar is visible */}
        {activeView === 'home' && (
          <Motion.div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[100px] transition-colors duration-1000 ${auraColor}`}
            animate={{
              scale: inConversation ? [1, 1.2, 1] : 0.8,
              opacity: inConversation ? 0.6 : 0
            }}
            transition={{
              scale: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              opacity: { duration: 0.5 }
            }}
          />
        )}

        {/* The Avatar Scene - Clickable */}
        <div
          className="w-full h-full relative"
          onClick={handleAvatarClick}
          title="Tap to speak"
        >
          <AvatarScene />
        </div>

      </Motion.div>

      {/* LAYER 4: Smart Actions Overlay (e.g. Map) */}
      <AnimatePresence>
        {lastAction === 'SHOW_MAP' && (
          <ActionOverlay onClose={clearAction} />
        )}
      </AnimatePresence>

      {/* LAYER 5: Idle Overlay */}
      <SleepOverlay />

    </main>
  );
};

const App: React.FC = () => {
  return (
    <KioskProvider>
      <KioskInterface />
    </KioskProvider>
  );
};

export default App;