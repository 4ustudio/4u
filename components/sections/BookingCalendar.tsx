"use client";

import { useState, useActionState } from "react";
import { createAppointment } from "@/app/agendar/actions";
import type { BookingFormState } from "@/types/booking";

const WA_PHONE = "573107639163";
const ORANGE = "#ff7a00";

const COURSES = ["Canto", "Guitarra", "Piano", "Batería", "Bajo", "Producción Musical"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];

const TIME_SLOTS = [
  "10:00 AM", "11:00 AM", "12:00 PM",
  "2:00 PM",  "3:00 PM",  "4:00 PM",
  "5:00 PM",  "6:00 PM",  "7:00 PM",
];

const initialState: BookingFormState = { status: "idle" };

function buildWALink(name: string, course: string) {
  const msg = `Hola! Acabo de solicitar una clase de ${course} en 4U Studio Academy. Mi nombre es ${name}. Me gustaría hablar con alguien del equipo.`;
  return `https://api.whatsapp.com/send/?phone=${WA_PHONE}&text=${encodeURIComponent(msg)}`;
}

// ─── Calendar helper ───────────────────────────────────────────
function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay(); // 0=Dom
  const total    = new Date(year, month + 1, 0).getDate();
  // Prev month padding
  const prevTotal = new Date(year, month, 0).getDate();
  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevTotal - i, current: false });
  }
  for (let d = 1; d <= total; d++) {
    cells.push({ day: d, current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - firstDow - total + 1, current: false });
  }
  return cells;
}

export default function BookingCalendar() {
  const [state, formAction, isPending] = useActionState(createAppointment, initialState);

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("Canto");

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const cells = calendarDays(viewDate.getFullYear(), viewDate.getMonth());

  const isToday = (d: number, cur: boolean) =>
    cur &&
    d === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();

  const isSunday = (d: number, cur: boolean) => {
    if (!cur) return false;
    const dow = new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay();
    return dow === 0;
  };

  const isPast = (d: number, cur: boolean) => {
    if (!cur) return false;
    const dt = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    dt.setHours(0, 0, 0, 0);
    const t = new Date(); t.setHours(0, 0, 0, 0);
    return dt < t;
  };

  const isSelected = (d: number, cur: boolean) =>
    cur &&
    selectedDate?.getDate() === d &&
    selectedDate?.getMonth() === viewDate.getMonth() &&
    selectedDate?.getFullYear() === viewDate.getFullYear();

  const handleDay = (d: number, cur: boolean) => {
    if (!cur || isSunday(d, cur) || isPast(d, cur)) return;
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    setSelectedTime(null);
  };

  // Notes value packed into hidden field
  const notesValue = selectedDate && selectedTime
    ? `Fecha: ${selectedDate.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} | Horario: ${selectedTime} | Instructor preferido: Andrés Ospina`
    : "";

  const formattedDate = selectedDate
    ? selectedDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  // ─── SUCCESS STATE ───────────────────────────────────────────
  if (state.status === "success") {
    const waLink = buildWALink(state.submittedName ?? "", state.submittedCourse ?? "");
    return (
      <div className="flex flex-col items-center text-center py-16 px-4 gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
          <svg className="h-10 w-10 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="space-y-2">
          <h3 className="text-3xl font-extrabold text-white font-poppins">¡Solicitud recibida!</h3>
          <p className="text-white/60 max-w-md leading-relaxed font-roboto">
            Guardamos tu solicitud con el horario seleccionado. Te contactaremos para confirmar tu clase.
          </p>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 font-poppins"
          style={{ backgroundColor: "#25D366", boxShadow: "0 8px 24px rgba(37,211,102,0.25)" }}
        >
          <svg className="h-5 w-5 fill-white shrink-0" viewBox="0 0 448 512" aria-hidden="true">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
          </svg>
          Continuar por WhatsApp
        </a>
      </div>
    );
  }

  // ─── MAIN LAYOUT ─────────────────────────────────────────────
  return (
    <form action={formAction} noValidate>
      {/* Hidden fields */}
      <input type="hidden" name="course"   value={selectedCourse} />
      <input type="hidden" name="notes"    value={notesValue} />
      <input type="hidden" name="modality" value="presencial" />
      <input type="hidden" name="source"   value="agendar" />

      <div className="grid lg:grid-cols-[1fr_1.1fr_1fr] gap-5 items-start">

        {/* ─── COLUMNA IZQUIERDA: Instructor + info ──── */}
        <div className="space-y-4">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75 font-poppins backdrop-blur-md">
            <span style={{ color: ORANGE }}>♫</span> Primera clase sin compromiso
          </span>

          {/* Heading */}
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight font-poppins">
              Agenda tu<br />
              curso <span style={{ color: ORANGE }}>ideal</span>
            </h1>
            <p className="text-white/55 text-sm mt-3 leading-relaxed font-roboto">
              Elige a tu instructor, selecciona la fecha y horario que mejor se adapten a ti y comienza tu camino musical con nosotros.
            </p>
          </div>

          {/* Instructor card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-4 space-y-3">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl overflow-hidden shrink-0 bg-gradient-to-br from-orange-600 to-orange-800 flex items-center justify-center">
                <span className="text-white font-bold text-xl font-poppins">AO</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm font-poppins">Andrés Ospina</p>
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill={ORANGE} aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                </div>
                <p className="text-white/50 text-xs font-roboto">Guitarrista & Productor</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <svg className="h-3 w-3 fill-yellow-400" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  <span className="text-yellow-400 text-xs font-semibold">4.9</span>
                  <span className="text-white/30 text-xs">(128 reseñas)</span>
                </div>
              </div>
            </div>

            {/* Especialidades */}
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-roboto">Especialidades:</p>
              <div className="flex flex-wrap gap-1.5">
                {COURSES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCourse(c)}
                    className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all font-roboto"
                    style={
                      selectedCourse === c
                        ? { backgroundColor: ORANGE, color: "#fff" }
                        : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                    }
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Bio */}
            <p className="text-white/45 text-xs leading-relaxed font-roboto">
              Más de 10 años de experiencia ayudando a estudiantes a descubrir y potenciar su talento. Enfoque personalizado y resultados reales.
            </p>

            {/* Disponibilidad */}
            <div className="flex flex-wrap gap-2 text-[10px]">
              <span className="flex items-center gap-1 text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-orange-400 inline-block" />Presencial</span>
              <span className="flex items-center gap-1 text-white/60"><span className="h-1.5 w-1.5 rounded-full bg-white/40 inline-block" />Virtual</span>
              <span className="flex items-center gap-1 text-green-400"><span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />Disponible hoy</span>
            </div>
          </div>

          {/* Info strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
            {[
              { icon: "⏱", label: "Duración", value: "60 minutos" },
              { icon: "🖥", label: "Modalidad", value: "Presencial o Virtual" },
              { icon: "📍", label: "Sede", value: "4U Studio Center" },
              { icon: "🎵", label: "Incluye", value: "Material y seguimiento" },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-white/[0.04] p-3 text-center">
                <span className="text-base">{item.icon}</span>
                <p className="text-[10px] text-white/40 mt-1 font-roboto">{item.label}</p>
                <p className="text-[11px] text-white/75 font-semibold mt-0.5 font-roboto leading-tight">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 font-roboto">
            <span style={{ color: ORANGE }} className="font-semibold">🎁 Primera clase sin compromiso.</span>{" "}
            Conócenos y descubre tu potencial.
          </p>
        </div>

        {/* ─── COLUMNA CENTRAL: Calendario ─────────────── */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5">
          <p className="text-sm font-bold text-white mb-4 font-poppins">1. Selecciona una fecha</p>

          {/* Header mes */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="h-7 w-7 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
              aria-label="Mes anterior"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-bold text-white font-poppins">
              {MONTHS_ES[viewDate.getMonth()]} {viewDate.getFullYear()}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="h-7 w-7 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:border-white/30 transition-colors"
              aria-label="Mes siguiente"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS_ES.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-white/35 py-1 font-roboto">
                {d}
              </div>
            ))}
          </div>

          {/* Celdas */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map(({ day, current }, idx) => {
              const sun  = isSunday(day, current);
              const past = isPast(day, current);
              const tod  = isToday(day, current);
              const sel  = isSelected(day, current);
              const disabled = !current || sun || past;

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleDay(day, current)}
                  className={[
                    "h-8 w-full rounded-lg text-xs font-semibold transition-all font-roboto",
                    !current       ? "text-white/15 cursor-default"                          : "",
                    current && sun  ? "text-red-400/50 cursor-not-allowed"                   : "",
                    current && past && !sun ? "text-white/20 cursor-not-allowed"             : "",
                    current && !disabled && !sel && !tod ? "text-white/70 hover:bg-white/10 hover:text-white" : "",
                    tod && !sel    ? "ring-1 ring-orange-500 text-orange-400"                : "",
                    sel            ? "text-white font-bold"                                  : "",
                  ].filter(Boolean).join(" ")}
                  style={sel ? { backgroundColor: ORANGE } : undefined}
                  aria-label={current ? `${day} de ${MONTHS_ES[viewDate.getMonth()]}` : undefined}
                  aria-pressed={sel}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-4 flex items-center gap-2 text-[10px] text-white/40">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />
            Fechas disponibles
          </div>
        </div>

        {/* ─── COLUMNA DERECHA: Horarios + Resumen ─────── */}
        <div className="space-y-4">
          {/* Horarios */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5">
            <p className="text-sm font-bold text-white mb-4 font-poppins">2. Horarios disponibles</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className="py-2 rounded-lg text-xs font-semibold transition-all font-roboto"
                  style={
                    selectedTime === t
                      ? { backgroundColor: ORANGE, color: "#fff", boxShadow: `0 4px 12px rgba(255,107,0,0.35)` }
                      : { backgroundColor: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }
                  }
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Resumen */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md p-5 space-y-4">
            <p className="text-sm font-bold text-white font-poppins">3. Completa tu reserva</p>

            {/* Summary row */}
            {selectedDate && selectedTime && (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-2 text-xs font-roboto">
                {[
                  { icon: "👤", label: "Instructor", value: "Andrés Ospina" },
                  { icon: "📅", label: "Fecha", value: formattedDate ?? "" },
                  { icon: "⏰", label: "Hora", value: selectedTime },
                  { icon: "🖥", label: "Modalidad", value: "Presencial" },
                  { icon: "📍", label: "Sede", value: "4U Studio Center" },
                ].map((r) => (
                  <div key={r.label} className="flex justify-between items-center gap-2">
                    <span className="text-white/40 flex items-center gap-1.5">
                      <span>{r.icon}</span>{r.label}
                    </span>
                    <span className="text-white/80 font-medium text-right leading-tight">{r.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Campos de contacto */}
            <div className="space-y-3">
              <input
                type="text"
                name="name"
                required
                placeholder="Nombre completo *"
                autoComplete="name"
                disabled={isPending}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 focus:border-orange-500/30 transition-all disabled:opacity-50"
                style={{ ["--tw-ring-color" as string]: "rgba(255,107,0,0.4)" }}
              />
              <input
                type="tel"
                name="phone"
                required
                placeholder="WhatsApp * Ej: 3001234567"
                autoComplete="tel"
                disabled={isPending}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{ ["--tw-ring-color" as string]: "rgba(255,107,0,0.4)" }}
              />
              <input
                type="email"
                name="email"
                placeholder="Email (opcional)"
                autoComplete="email"
                disabled={isPending}
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-white text-sm placeholder:text-white/30 font-roboto focus:outline-none focus:ring-2 transition-all disabled:opacity-50"
                style={{ ["--tw-ring-color" as string]: "rgba(255,107,0,0.4)" }}
              />
            </div>

            {/* Errores */}
            {state.status === "error" && (
              <p className="text-red-400 text-xs font-roboto">
                {state.message ?? Object.values(state.errors ?? {}).find(Boolean)}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending || !selectedDate || !selectedTime}
              className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-bold text-white font-poppins transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: ORANGE, boxShadow: "0 4px 20px rgba(255,107,0,0.3)" }}
            >
              {isPending ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                  </svg>
                  Enviando...
                </>
              ) : (
                <>
                  Confirmar clase
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                  </svg>
                </>
              )}
            </button>

            {/* Nota seguridad */}
            <p className="text-center text-white/25 text-[10px] font-roboto flex items-center justify-center gap-1.5">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Tu información está segura con nosotros.
            </p>
          </div>
        </div>
      </div>

      {/* ─── FEATURE STRIP ───────────────────────────── */}
      <div className="mt-8 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {[
          {
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="9" cy="7" r="4" />
                <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            ),
            label: "Atención personalizada",
            sub: "Instructores expertos enfocados en ti.",
          },
          {
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            ),
            label: "Horarios flexibles",
            sub: "Elige el día y hora que mejor se adapten a ti.",
          },
          {
            icon: (
              <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ),
            label: "Clases presenciales y virtuales",
            sub: "Aprende desde donde estés, sin límites.",
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-4 px-6 py-5">
            <span style={{ color: ORANGE }}>{f.icon}</span>
            <div>
              <p className="text-sm font-bold text-white font-poppins">{f.label}</p>
              <p className="text-xs text-white/45 mt-0.5 font-roboto">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </form>
  );
}
