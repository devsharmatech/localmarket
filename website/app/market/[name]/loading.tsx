import { MapPin, Loader2, Store } from 'lucide-react';

export default function MarketLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center max-w-sm w-full p-8 text-center bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
        
        {/* Animated Icons */}
        <div className="relative w-20 h-20 mb-8 mx-auto">
          {/* Background Pulse */}
          <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-75"></div>
          
          {/* Main Icon Container */}
          <div className="relative w-full h-full bg-orange-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
            <Store className="text-white relative z-10" size={32} />
            <Loader2 className="absolute text-orange-200 animate-spin" size={64} strokeWidth={1} style={{ opacity: 0.3 }} />
          </div>
          
          {/* Floating Map Pin */}
          <div className="absolute -bottom-2 -right-2 bg-slate-900 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-bounce" style={{ animationDelay: '0.5s' }}>
            <MapPin size={14} className="text-white" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
          Exploring Market
        </h2>
        <p className="text-sm font-semibold text-slate-500 leading-relaxed mb-6">
          Gathering the best local vendors and deals for you...
        </p>

        {/* Progress Bar Animation */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 w-1/2 rounded-full animate-pulse" style={{ animationDuration: '1s', width: '100%' }}></div>
        </div>
      </div>
    </div>
  );
}
