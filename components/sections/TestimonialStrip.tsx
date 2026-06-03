export default function TestimonialStrip() {
  return (
    <section className="w-full bg-white py-3">
      <div className="home-frame">
        <div className="flex overflow-hidden rounded-xl bg-zinc-900 min-h-[315px] md:min-h-[340px]">

          {/* Mitad izquierda — texto */}
          <div className="relative flex w-1/2 flex-col justify-center px-8 py-10 md:px-12 md:py-12">
            {/* Glow naranja de fondo */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 70% at 20% 55%, rgba(255,122,0,0.15), transparent 70%)",
              }}
              aria-hidden="true"
            />
            <p className="relative font-poppins text-xl font-extrabold italic leading-[1.2] text-white md:text-[26px] lg:text-[30px]">
              La música no solo cambia tu sonido,<br />
              <span className="text-[#ff7a00]">cambia tu vida.</span>
            </p>
            <p className="relative mt-3 font-roboto text-sm italic leading-relaxed text-white/65">
              Atrévete a comenzar tu historia musical hoy.
            </p>
          </div>

          {/* Mitad derecha — video */}
          <div className="w-1/2 overflow-hidden">
            <video
              src="/images/hero/hf_20260603_135817_bc2bc082-82e4-46f3-bc75-4747aa356fee.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
              style={{ objectPosition: "center center" }}
            />
          </div>

        </div>
      </div>
    </section>
  );
}
