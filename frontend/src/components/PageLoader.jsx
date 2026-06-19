import React from 'react';
import { GiChiliPepper } from 'react-icons/gi';

export default function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-cream">
      <div className="w-16 h-16 bg-chilli-600 rounded-2xl flex items-center justify-center animate-pulse shadow-glow">
        <GiChiliPepper className="text-white text-3xl animate-bounce" />
      </div>
      <p className="mt-4 font-display font-bold text-bark-600 animate-pulse">Loading spices...</p>
    </div>
  );
}
