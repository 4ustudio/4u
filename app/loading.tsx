export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full animate-pulse"
        style={{ backgroundColor: "#ff7a00" }}
      />
    </div>
  );
}
