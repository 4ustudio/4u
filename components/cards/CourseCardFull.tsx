import OptimizedImage from "@/components/ui/OptimizedImage";
import type { Course } from "@/types";

type CourseCardFullProps = {
  course: Course;
  onClick: () => void;
};

export default function CourseCardFull({ course, onClick }: CourseCardFullProps) {
  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/60 shadow-lg transition-all duration-500 hover:-translate-y-1.5 hover:shadow-2xl hover:border-white/20 cursor-pointer"
    >
      <div className="relative h-[200px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-900/90 z-10" />
        <OptimizedImage
          src={course.image || "/images/hero/banner-principal.jpg"}
          alt={course.title}
          fill
          className="object-cover object-[center_25%] transition-all duration-700 ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute top-4 left-4 z-20">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg backdrop-blur-sm"
            style={{ backgroundColor: course.color }}
          >
            <div className="text-xl [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-white">
              {course.icon}
            </div>
          </div>
        </div>
        {/* Hint "Ver detalles" aparece en hover */}
        <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="rounded-full bg-black/60 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-xs font-semibold text-white font-poppins">
            Ver detalles →
          </span>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-3 px-5 pb-5 pt-4">
        <div>
          <h3 className="text-lg font-bold leading-tight text-white font-poppins">
            {course.title}
          </h3>
          {course.subtitle && (
            <p className="text-xs text-white/35 font-roboto mt-0.5">{course.subtitle}</p>
          )}
        </div>

        <p className="text-sm leading-relaxed text-white/55 font-roboto line-clamp-2">
          {course.description}
        </p>

        {course.highlights && course.highlights.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
            {course.highlights.map((h) => (
              <span key={h} className="flex items-center gap-2 text-xs text-white/60 font-roboto">
                <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: course.color }} />
                {h}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
            <span className="text-[11px] font-medium text-white/35 uppercase tracking-wide font-roboto">
              {course.status}
            </span>
          </div>
          <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors font-roboto">
            Ver detalles →
          </span>
        </div>
      </div>
    </article>
  );
}
