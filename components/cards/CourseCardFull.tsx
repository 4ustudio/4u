import Link from "next/link";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { ACADEMY } from "@/lib/constants";
import type { Course } from "@/types";

type CourseCardFullProps = {
  course: Course;
};

export default function CourseCardFull({ course }: CourseCardFullProps) {
  const waLink = `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=Hola%2C%20quiero%20informaci%C3%B3n%20sobre%20el%20curso%20de%20${encodeURIComponent(course.title)}%20en%204U%20Studio%20Academy`;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#ff7a00]/30">
      <div className="relative h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/90 z-10" />
        <OptimizedImage
          src={course.image || "/images/hero/banner-principal.jpg"}
          alt={course.title}
          fill
          className="object-cover transition-all duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4 z-20">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: course.color }}
          >
            <div className="scale-[0.42] [&_svg]:fill-white">
              {course.icon}
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-6 pt-4">
        <h3 className="text-lg font-bold leading-tight text-white font-poppins">
          {course.title}
        </h3>

        <p className="text-sm leading-relaxed text-white/60 font-roboto">
          {course.description}
        </p>

        {course.highlights && course.highlights.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-1">
            {course.highlights.map((h) => (
              <span
                key={h}
                className="flex items-center gap-2 text-xs text-white/70 font-roboto"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: course.color }}
                />
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
            <span className="h-1 w-1 rounded-full bg-emerald-500" />
          </span>
          <span className="text-[11px] font-medium text-white/40 tracking-wide uppercase font-roboto">
            {course.status}
          </span>
        </div>

        <Link
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#25D366] px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#20bd5a] hover:-translate-y-0.5 shadow-lg shadow-[#25D366]/20 hover:shadow-xl hover:shadow-[#25D366]/30 font-poppins"
        >
          <svg className="h-4 w-4 fill-white shrink-0" viewBox="0 0 448 512" aria-hidden="true">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
          </svg>
          Solicitar información
        </Link>
      </div>
    </article>
  );
}
