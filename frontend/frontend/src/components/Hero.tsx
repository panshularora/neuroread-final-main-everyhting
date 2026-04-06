export default function Hero() {
  return (
    <header className="relative h-screen w-full overflow-hidden flex items-center">
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1470115636492-6d2b56f9146d?q=80&w=2070&auto=format&fit=crop"
          className="w-full h-full object-cover object-center"
          alt="Dark Forest"
        />
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        <div className="max-w-4xl hero-content">
          <h1 className="flex flex-col">
            <span className="hero-anim text-white leading-[1.1] text-5xl md:text-7xl lg:text-[6rem] font-medium tracking-tight">
              Reading,
            </span>
            <span className="hero-anim text-white leading-[1.1] text-5xl md:text-7xl lg:text-[6.5rem] font-medium tracking-tight">
              Reimagined
            </span>
            <span className="hero-anim text-white/90 leading-[0.9] text-5xl md:text-7xl lg:text-[8rem] font-medium tracking-tighter italic">
              for Every
            </span>
            <span className="hero-anim text-white/90 leading-[0.9] text-5xl md:text-7xl lg:text-[8.5rem] font-medium tracking-tighter italic">
              Mind..
            </span>
          </h1>
          <p className="hero-anim text-white/70 md:text-xl leading-relaxed text-base max-w-lg mt-16 font-light">
            AI that adapts reading for every mind — helping children learn and adults understand complex text with ease.
          </p>
        </div>
      </div>
    </header>
  );
}

