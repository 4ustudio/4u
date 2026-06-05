export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="relative overflow-hidden rounded-xl bg-zinc-900 min-h-[315px] md:min-h-[340px]">

          {/* Video — cubre todo el banner */}
          <video
            src="/images/hero/hf_20260603_135817_bc2bc082-82e4-46f3-bc75-4747aa356fee.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full object-cover"
            style={{ objectPosition: "center 46%" }}
          />

          {/* Degradado cinematográfico: negro denso izq → transparente, se funde sin corte */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.72) 25%, rgba(0,0,0,0.30) 45%, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0) 72%)",
            }}
            aria-hidden="true"
          />

          {/* Glow naranja sutil detrás del texto */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 40% 65% at 16% 55%, rgba(255,122,0,0.14), transparent 70%)",
            }}
            aria-hidden="true"
          />

          {/* Texto superpuesto — 30-35% izquierdo */}
          <div className="absolute inset-0 z-10 flex flex-col justify-center pt-16 px-8 md:w-[38%] md:px-12">
            <p className="font-poppins text-xl font-extrabold italic leading-[1.2] text-white md:text-[26px] lg:text-[30px]">
              La música no solo cambia tu sonido,<br />
              <span className="text-[#ff7a00]">cambia tu vida.</span>
            </p>
            <p className="mt-3 font-roboto text-sm italic leading-relaxed text-white/65">
              Atrévete a comenzar tu historia musical hoy.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}
