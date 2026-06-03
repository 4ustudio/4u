export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 min-h-[280px] md:min-h-[300px]">

          {/* Video — sujeto principal empujado al tercio derecho */}
          <div className="absolute inset-0">
            <video
              src="/images/hero/hf_20260603_135817_bc2bc082-82e4-46f3-bc75-4747aa356fee.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              style={{ objectPosition: "75% center" }}
            />
          </div>

          {/* Capa 1 — negro intenso izq → transparencia progresiva */}
          <div
            className="pointer-events-none absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 28%, rgba(0,0,0,0.35) 52%, rgba(0,0,0,0.08) 72%, rgba(0,0,0,0) 100%)",
            }}
            aria-hidden="true"
          />

          {/* Capa 2 — glow naranja sutil detrás del texto */}
          <div
            className="pointer-events-none absolute inset-0 z-[2]"
            style={{
              background:
                "radial-gradient(ellipse 38% 70% at 18% 55%, rgba(255,122,0,0.13), transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* Capa 3 — viñeta perimetral */}
          <div
            className="pointer-events-none absolute inset-0 z-[3]"
            style={{
              boxShadow: "inset 0 0 80px 20px rgba(0,0,0,0.45)",
            }}
            aria-hidden="true"
          />

          {/* Texto — tercio izquierdo */}
          <div className="relative z-10 flex flex-col justify-center px-8 py-10 md:w-[58%] md:px-12 md:py-12">
            <span className="mb-1 font-poppins text-5xl font-black leading-none text-[#ff7a00]">&ldquo;</span>
            <p className="max-w-xl font-poppins text-xl font-extrabold italic leading-[1.2] text-white md:text-[26px] lg:text-[30px]">
              La música no solo cambia tu sonido,<br />
              <span className="text-[#ff7a00]">cambia tu vida.</span>
              <span className="ml-2 font-poppins text-5xl font-black leading-none text-[#ff7a00]">&rdquo;</span>
            </p>
            <p className="mt-3 max-w-sm font-roboto text-sm italic leading-relaxed text-white/65">
              Atrévete a comenzar tu historia musical hoy.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
