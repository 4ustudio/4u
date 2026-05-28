import OptimizedImage from "@/components/ui/OptimizedImage";
import { instructors } from "@/data/instructors";
import type { Course } from "@/types";

type CourseCardProps = {
  course: Course;
};

function AvatarInitials({ name }: { name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("");
  return (
    <div className="w-6 h-6 rounded-full bg-[#ff7a00]/15 flex items-center justify-center flex-shrink-0">
      <span className="text-[10px] font-semibold text-[#ff7a00] font-poppins">{initials}</span>
    </div>
  );
}

export default function CourseCard({ course }: CourseCardProps) {
  const instructor = course.instructorId
    ? instructors.find((i) => i.id === course.instructorId)
    : null;

  return (
    <div className="group relative rounded-xl overflow-hidden bg-white border border-gray-100 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-500 h-[360px]">
      <div className="absolute inset-0 h-[55%]">
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
            className="absolute inset-0 flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${course.color}30 0%, ${course.color}15 40%, ${course.color}08 70%, ${course.color}03 100%)`,
            }}
          >
            <div className="opacity-15 w-16 h-16 md:w-20 md:h-20">
              {course.icon}
            </div>
          </div>
        )}
      </div>

      {course.duration && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-block px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 text-gray-500 font-poppins">
            {course.duration}
          </span>
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/5 to-transparent h-8 pointer-events-none" />

      <div className="absolute bottom-0 inset-x-0 p-5 bg-white">
        <p
          className="text-[10px] font-semibold uppercase tracking-wider mb-1"
          style={{ color: course.color, fontFamily: "'Poppins', sans-serif" }}
        >
          {course.subtitle}
        </p>
        <h3
          className="text-xl md:text-2xl font-bold text-gray-900 mb-2 font-poppins"
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
            <div className="flex items-center gap-1.5">
              <AvatarInitials name={instructor.name} />
              <span className="text-[11px] text-gray-400 font-roboto">
                {instructor.name.split(" ")[0]}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 to-white/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5">
        <p className="text-gray-600 text-sm leading-relaxed mb-1 font-roboto">
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
