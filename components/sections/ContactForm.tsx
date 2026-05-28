"use client";

import { useState } from "react";

const courseOptions = [
  { value: "", label: "Selecciona un curso" },
  { value: "guitarra", label: "Guitarra" },
  { value: "piano", label: "Piano" },
  { value: "canto", label: "Canto" },
  { value: "bateria", label: "Batería" },
  { value: "bajo", label: "Bajo" },
  { value: "produccion", label: "Producción Musical" },
  { value: "otro", label: "Otro" },
];

export default function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", course: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const validate = () => {
    if (!form.name.trim()) return "El nombre es obligatorio";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Email inválido";
    if (!form.phone.trim() || form.phone.length < 7) return "Teléfono inválido (mín. 7 dígitos)";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) { setErrorMsg(err); setStatus("error"); return; }
    setStatus("sending");
    setErrorMsg("");

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, source: "contacto" }),
      });
      if (!res.ok) throw new Error("Error al enviar");
      setStatus("success");
      setForm({ name: "", email: "", phone: "", course: "", message: "" });
    } catch {
      setErrorMsg("Error de conexión. Intenta de nuevo.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center py-10">
        <div className="w-16 h-16 rounded-full bg-[#10b981]/20 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#10b981]" viewBox="0 0 512 512" fill="currentColor">
            <path d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm86.6 190.6l-112 112c-12.5 12.5-32.8 12.5-45.3 0l-48-48c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l25.4 25.4 89.4-89.4c12.5-12.5 32.8-12.5 45.3 0s12.5 32.8 0 45.3z" />
          </svg>
        </div>
        <p className="text-white font-semibold text-lg font-poppins">¡Mensaje enviado!</p>
        <p className="text-white/60 text-sm mt-1 font-roboto">Te responderemos a la brevedad.</p>
      </div>
    );
  }

  const inputClass =
    "w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:ring-[#ff7a00]/50 focus:border-[#ff7a00]/30 transition-all duration-300";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nombre completo"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className={inputClass}
        required
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputClass}
          required
        />
        <input
          type="tel"
          placeholder="Teléfono"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className={inputClass}
          required
        />
      </div>
      <select
        value={form.course}
        onChange={(e) => setForm({ ...form, course: e.target.value })}
        className={inputClass + " appearance-none"}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff40'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "20px",
        }}
      >
        {courseOptions.map((o) => (
          <option key={o.value} value={o.value} className="bg-stone-900 text-white">
            {o.label}
          </option>
        ))}
      </select>
      <textarea
        placeholder="Mensaje (opcional)"
        value={form.message}
        onChange={(e) => setForm({ ...form, message: e.target.value })}
        className={inputClass + " min-h-[100px] resize-none"}
        rows={3}
      />
      {status === "error" && errorMsg && (
        <p className="text-red-400 text-xs font-roboto">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full bg-[#ff7a00] text-white font-semibold py-3.5 rounded-full text-sm transition-all duration-300 shadow-xl shadow-[#ff7a00]/20 hover:shadow-2xl hover:shadow-[#ff7a00]/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
      >
        {status === "sending" ? "Enviando..." : "Enviar mensaje"}
      </button>
    </form>
  );
}
