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
            className="text-sm font-medium tracking-[0.2em] uppercase text-[#ff7a00] mb-4 font-poppins"
          >
          {label}
        </p>
      )}
        <h2
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight font-poppins"
        >
        {title}{" "}
        {accent && (
          <span className="text-[#ff7a00]">{accent}</span>
        )}
      </h2>
      {description && (
          <p
            className="text-gray-500 text-base leading-relaxed max-w-sm font-roboto"
          >
          {description}
        </p>
      )}
    </div>
  );
}
