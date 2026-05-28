type SectionTitleProps = {
  label?: string;
  title: string;
  accent?: string;
  description?: string;
};

export default function SectionTitle({ label, title, accent, description }: SectionTitleProps) {
  return (
    <div>
      {label && (
        <p
          className="text-sm font-medium tracking-[0.2em] uppercase text-[#ff7a00] mb-4"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {label}
        </p>
      )}
      <h2
        className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {title}{" "}
        {accent && (
          <span className="text-[#ff7a00]">{accent}</span>
        )}
      </h2>
      {description && (
        <p
          className="text-white/50 text-base leading-relaxed max-w-sm"
          style={{ fontFamily: "'Roboto', sans-serif" }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
