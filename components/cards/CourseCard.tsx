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
    <div className="group relative rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-lg shadow-gray-200/30 hover:shadow-xl hover:border-[#ff7a00]/20 hover:-translate-y-1 transition-all duration-500 h-[360px]">
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
          <div className="absolute inset-0">
            <div className="absolute inset-0" style={{
              background: `linear-gradient(135deg, ${course.color}40 0%, ${course.color}15 40%, ${course.color}08 70%, ${course.color}03 100%)`
            }} />
            <div
              className="absolute inset-0 opacity-[0.025]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '128px 128px',
              }}
            />
            <svg className="absolute inset-0 w-full h-full opacity-[0.04]" viewBox="0 0 400 220" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 40 Q200 55 400 38" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M0 70 Q200 85 400 68" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M0 100 Q200 115 400 98" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M0 130 Q200 145 400 128" stroke="white" strokeWidth="0.5" fill="none" />
              <path d="M0 160 Q200 175 400 158" stroke="white" strokeWidth="0.5" fill="none" />
            </svg>
            <div className="absolute inset-0" style={{
              background: `radial-gradient(circle at 90% 10%, ${course.color}25 0%, transparent 60%)`
            }} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
            <div className="absolute top-[18%] left-1/2 -translate-x-1/2 opacity-10 group-hover:opacity-20 transition-opacity duration-700">
              <div className="w-20 h-20 md:w-24 md:h-24">
                {course.icon}
              </div>
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

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/10 to-transparent h-12 pointer-events-none" />

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

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/95 via-white/90 to-white/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-5">
        <p className="text-gray-600 text-sm leading-relaxed mb-1 font-roboto translate-y-2 group-hover:translate-y-0 transition-transform duration-500">
          {course.description}
        </p>
        {instructor && (
          <p className="text-xs text-[#ff7a00] font-medium font-poppins translate-y-2 group-hover:translate-y-0 transition-transform duration-500 delay-75">
            {instructor.name}
          </p>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#ff7a00]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#ff7a00]/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
