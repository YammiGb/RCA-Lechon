import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-b from-rca-green via-rca-green to-rca-green py-24 px-4 overflow-hidden">
      {/* Decorative pattern background */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1200 800">
          <defs>
            <pattern id="leaf-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M100,50 Q150,100 100,150 Q50,100 100,50" fill="#FFFFFF" opacity="0.1"/>
            </pattern>
          </defs>
          <rect width="1200" height="800" fill="url(#leaf-pattern)"/>
        </svg>
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        <h1 className="text-5xl md:text-7xl font-playfair font-bold mb-4 animate-fade-in">
          <span className="text-white">RCA</span>
        </h1>
        <p className="text-3xl md:text-4xl font-semibold text-rca-red mb-6 animate-slide-up">
          Lechon Belly & Bilao
        </p>
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto animate-slide-up opacity-95">
          Authentic Filipino lechon, crispy skin, succulent meat. Served fresh from our traditional bilao.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a 
            href="#menu"
            className="bg-rca-red hover:bg-rca-red-dark text-white px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg"
          >
            Order Now
          </a>
          <a 
            href="#menu"
            className="border-2 border-white text-white hover:bg-white hover:text-rca-green px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 font-semibold text-lg"
          >
            View Menu
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;