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
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-lg shadow-gray-200/30 hover:shadow-xl hover:border-[#ff7a00]/20 hover:-translate-y-1 transition-all duration-500 h-[340px]">
      <div className="absolute inset-0 h-2/3">
        {course.image ? (
          <OptimizedImage
            src={course.image}
            alt={course.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br"
            style={{
              backgroundImage: `linear-gradient(135deg, ${course.color}15, ${course.color}03)`,
            }}
          />
        )}
      </div>

      {course.duration && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 font-poppins">
            {course.duration}
          </span>
        </div>
      )}

      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-8 group-hover:opacity-15 transition-opacity duration-500">
        {course.icon}
      </div>

      <div className="absolute bottom-0 inset-x-0 p-5 bg-white pt-16">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: course.color, fontFamily: "'Poppins', sans-serif" }}
        >
          {course.subtitle}
        </p>
        <h3
          className="text-xl md:text-2xl font-bold text-gray-900 mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {course.title}
        </h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            </span>
            <span className="text-[11px] text-gray-500 font-roboto">
              {course.status}
            </span>
          </div>
          {instructor && (
            <span className="text-[11px] text-gray-400 font-roboto truncate ml-2">
              {instructor.name}
            </span>
          )}
        </div>
      </div>

      {course.description && (
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
          <p className="text-gray-600 text-sm leading-relaxed font-roboto">
            {course.description}
          </p>
        </div>
      )}

      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#ff7a00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
