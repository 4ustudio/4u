import type { Course } from "@/types";

type CourseCardProps = {
  course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <div className="group relative rounded-2xl overflow-hidden bg-white/[0.05] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/20 hover:bg-white/[0.08] hover:border-white/20 hover:scale-[1.03] transition-all duration-500 h-[420px]">
      <div
        className="absolute inset-0 bg-gradient-to-br"
        style={{
          backgroundImage: `linear-gradient(135deg, ${course.color}30, ${course.color}05)`,
        }}
      />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity duration-500">
        {course.icon}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent pt-20">
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: course.color, fontFamily: "'Poppins', sans-serif" }}
        >
          {course.subtitle}
        </p>
        <h3
          className="text-2xl md:text-3xl font-bold text-white mb-2"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {course.title}
        </h3>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5" aria-hidden="true">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          </span>
          <span
            className="text-xs text-white/50 font-roboto"
          >
            {course.status}
          </span>
        </div>
      </div>

      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}
