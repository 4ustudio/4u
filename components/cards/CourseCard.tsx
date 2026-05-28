import OptimizedImage from "@/components/ui/OptimizedImage";
import { instructors } from "@/data/instructors";
import type { Course } from "@/types";

type CourseCardProps = {
  course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
  const instructor = course.instructorId
    ? instructors.find((i) => i.id === course.instructorId)
    : null;

  return (
    <div className="group relative h-[142px] overflow-hidden rounded-md border border-gray-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="absolute inset-x-0 top-0 h-[70px] overflow-hidden">
        {course.image ? (
          <OptimizedImage
            src={course.image}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <OptimizedImage
            src="/images/hero/banner-principal.jpg"
            alt={course.title}
            fill
            className="object-cover object-[65%_50%] transition-transform duration-500 group-hover:scale-105"
            sizes="220px"
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="absolute left-4 top-[55px] z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#ff7a00] text-white shadow-lg shadow-[#ff7a00]/30">
        <div className="scale-[0.32] [&_svg]:fill-white [&_svg]:opacity-100">
          {course.icon}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-white px-4 pb-3 pt-5">
        <h3 className="mb-0.5 text-[15px] font-bold text-gray-900 font-poppins">
          {course.title}
        </h3>
        <p className="mb-2 text-[11px] leading-tight text-gray-600 font-roboto">
          {course.subtitle}
        </p>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-[9px] text-gray-500 font-roboto">
              {course.status}
            </span>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 flex flex-col justify-end bg-white/95 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <p className="mb-2 text-xs leading-relaxed text-gray-600 font-roboto">
          {course.description}
        </p>
        {instructor && (
          <p className="text-xs text-[#ff7a00] font-medium font-poppins">
            {instructor.name}
          </p>
        )}
      </div>
    </div>
  );
}
