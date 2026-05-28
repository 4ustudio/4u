type StatsCardProps = {
  number: string;
  label: string;
};

export default function StatsCard({ number, label }: StatsCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl px-8 py-5 min-w-[220px] hover:bg-white/[0.15] transition-all duration-300">
      <p className="text-[#ff7a00] font-bold text-2xl font-poppins">
        {number}
      </p>
      <p className="text-white/60 text-base font-roboto">
        {label}
      </p>
    </div>
  );
}
