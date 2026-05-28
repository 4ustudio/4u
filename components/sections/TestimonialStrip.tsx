import { testimonials } from "@/data/testimonials";

function AvatarPlaceholder({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#ff7a00]/20 to-[#ff7a00]/5 border border-[#ff7a00]/20 flex items-center justify-center flex-shrink-0">
      <span className="text-[#ff7a00] font-bold text-lg font-poppins">{initials}</span>
    </div>
  );
}

export default function TestimonialStrip() {
  const featured = testimonials[0];

  return (
    <section className="w-full py-20 md:py-28 bg-gradient-to-b from-white to-stone-50 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#ff7a00]/5 blur-3xl rounded-full" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-8">
        <div className="relative">
          <svg
            className="absolute -top-8 -left-4 w-16 h-16 text-[#ff7a00]/15"
            viewBox="0 0 512 512"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M464 256h-80v-48c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-48c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z" />
          </svg>

          <div className="bg-white shadow-lg border border-stone-100 rounded-2xl p-8 md:p-10">
            <p className="text-stone-600 text-lg md:text-xl leading-[1.7] mb-8 font-roboto pl-10 md:pl-12">
              {featured.text}
            </p>

            <div className="flex items-center gap-4">
              <AvatarPlaceholder name={featured.name} />
              <div>
                <p className="text-stone-900 font-semibold text-sm font-poppins">
                  {featured.name}
                </p>
                <p className="text-stone-400 text-xs font-roboto">
                  {featured.age} · {featured.course}
                </p>
                <div className="flex items-center gap-0.5 mt-1" aria-label={`${featured.rating} de 5 estrellas`}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg
                      key={i}
                      className={`w-3.5 h-3.5 ${i < featured.rating ? "text-[#ff7a00]" : "text-stone-200"}`}
                      viewBox="0 0 576 512"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.4 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L380.9 150.3 316.9 18z" />
                    </svg>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
