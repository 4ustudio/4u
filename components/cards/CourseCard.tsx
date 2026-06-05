import OptimizedImage from "@/components/ui/OptimizedImage";
import type { Course } from "@/types";

type CourseCardProps = {
  course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="group relative flex h-[390px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative h-[175px] shrink-0 overflow-hidden">
        <OptimizedImage
          src={course.image || "/images/hero/banner-principal.jpg"}
          alt={course.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
            style={{ backgroundColor: course.color }}
          >
            <div className="text-xl [&_svg]:w-5 [&_svg]:h-5 [&_svg]:fill-white">
              {course.icon}
            </div>
          </div>
          <h3 className="text-[17px] font-bold leading-tight text-gray-900 font-poppins">
            {course.title}
          </h3>
        </div>

        <p className="text-xs leading-relaxed text-gray-500 font-roboto line-clamp-3">
          {course.description}
        </p>

        <div className="mt-auto flex items-center gap-2">
          <span className="flex items-center gap-1" aria-hidden="true">
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
            <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
          </span>
          <span className="text-[10px] font-medium text-gray-500 font-roboto">
            {course.status}
          </span>
        </div>
      </div>
    </div>
  );
}
