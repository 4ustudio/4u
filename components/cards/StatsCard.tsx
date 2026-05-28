type StatsCardProps = {
  number: string;
  label: string;
};

export default function StatsCard({ number, label }: StatsCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl px-5 py-3.5 min-w-[160px] hover:bg-white/[0.15] transition-all duration-300">
      <p className="text-[#ff7a00] font-bold text-xl font-poppins">
        {number}
      </p>
      <p className="text-white/60 text-sm font-roboto">
        {label}
      </p>
    </div>
  );
}
