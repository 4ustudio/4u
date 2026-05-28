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
            className="text-sm font-medium tracking-[0.22em] uppercase text-[#ff7a00] mb-4 font-poppins"
          >
          {label}
        </p>
      )}
        <h2
          className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-[1.1] font-poppins tracking-tight"
        >
        {title}{" "}
        {accent && (
          <span className="text-[#ff7a00]">{accent}</span>
        )}
      </h2>
      {description && (
          <p
            className="text-gray-500 text-base leading-[1.7] max-w-sm font-roboto"
          >
          {description}
        </p>
      )}
    </div>
  );
}
