"use client";

import { useState, useActionState, useMemo, type ReactNode } from "react";
import Image from "next/image";
import { createAppointment } from "@/app/agendar/actions";
import type { BookingFormState } from "@/types/booking";
import { ACADEMY } from "@/lib/constants";

type BookingAction = (prev: BookingFormState, data: FormData) => Promise<BookingFormState>

type BookingCalendarProps = {
  serverAction?: BookingAction
  mode?: 'public' | 'student'
  isLoggedIn?: boolean
  instructors?: { id: string; name: string }[]
}

// Convierte "6:00 PM" → "18:00" para el campo hidden en modo estudiante
function to24h(t: string): string {
  const [time, period] = t.split(' ')
  const [h, m] = time.split(':').map(Number)
  const h24 = period === 'PM' && h !== 12 ? h + 12 : period === 'AM' && h === 12 ? 0 : h
  return `${String(h24).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const WA_PHONE = ACADEMY.phone;
const ORANGE = "#ff7a00";

const COURSES = ["Canto", "Guitarra", "Piano", "Teclado", "Batería", "Bajo", "Producción Musical"];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_ES = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];

const TIME_SLOTS = [
  "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM", "9:00 PM",
];

const initialState: BookingFormState = { status: "idle" };

function buildWALink(name: string, course: string) {
  const msg = `Hola! Acabo de solicitar una clase de ${course} en 4U Studio Academy. Mi nombre es ${name}. Me gustaría hablar con alguien del equipo.`;
  return `https://api.whatsapp.com/send/?phone=${WA_PHONE}&text=${encodeURIComponent(msg)}`;
}

function buildWALinkDirect(course: string, date: Date | null, time: string | null) {
  let msg = `Hola! Me gustaría agendar una clase de ${course} en 4U Studio Academy.`;
  if (date && time) {
    const dateStr = date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    msg += ` Me interesa el ${dateStr} a las ${time}.`;
  }
  msg += ` ¿Podrían ayudarme?`;
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

// ─── Shared WhatsApp icon ──────────────────────────────────────
function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
      <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
    </svg>
  );
}

// ─── Step indicator helper ─────────────────────────────────────
function StepHeader({ step, title, isComplete, note }: { step: number; title: string; isComplete: boolean; note?: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0"
        style={{ backgroundColor: isComplete ? ORANGE : 'rgba(255,255,255,0.1)', color: '#fff' }}
      >
        {isComplete ? '✓' : step}
      </span>
      <p className="text-sm font-bold text-white font-poppins">
        {title}{note && <span className="text-white/30 text-xs font-normal ml-1">{note}</span>}
      </p>
    </div>
  );
}

export default function BookingCalendar({ serverAction, mode = 'public', isLoggedIn = false, instructors = [] }: BookingCalendarProps = {}) {
  const [state, formAction, isPending] = useActionState(serverAction ?? createAppointment, initialState);

  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("Canto");

  const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const todayMidnight = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);

  const cells = useMemo(
    () => calendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

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
    return dt < todayMidnight;
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
    ? `Fecha: ${selectedDate.toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} | Horario: ${selectedTime}`
    : "";

  // Step completion states
  const step1Complete = !!selectedDate;
  const step2Complete = !!selectedTime;

  // ─── SUCCESS STATE (modo estudiante) ────────────────────────
  if (state.status === "success" && mode === 'student') {
    return (
      <div className="flex flex-col items-center text-center py-12 px-4 gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/15 ring-1 ring-green-500/30">
          <svg className="h-8 w-8 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-2xl font-extrabold text-white font-poppins">¡Clase agendada!</h3>
          <p className="text-white/55 text-sm font-roboto leading-relaxed">
            {state.submittedCourse ? `Tu clase de ${state.submittedCourse}` : 'Tu clase'} ha sido reservada.<br />
            La verás reflejada en tu dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-full text-sm font-semibold font-poppins text-white border border-white/20 hover:border-white/40 transition-all"
        >
          Ver mis clases
        </button>
      </div>
    );
  }

  // ─── SUCCESS STATE (modo público) ────────────────────────────
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
          <WaIcon className="h-5 w-5 fill-white shrink-0" />
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
      <input type="hidden" name="selected_date_iso"    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''} />
      <input type="hidden" name="selected_time_24h"    value={selectedTime ? to24h(selectedTime) : ''} />
      <input type="hidden" name="selected_instructor_id" value="" />

      <div className="grid lg:grid-cols-[1fr_2fr] gap-5 items-start">

        {/* ─── COLUMNA IZQUIERDA: Instructor + info ──── */}
        <div className="space-y-4">
          {/* Heading */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.08] font-poppins">
              Agenda tu<br />
              curso <span style={{ color: ORANGE }}>ideal</span>
            </h1>
            <p className="text-white/55 text-sm mt-3 leading-relaxed font-roboto">
              Selecciona la fecha y el horario que mejor se adapten a ti. Un instructor especializado será asignado automáticamente.
            </p>
          </div>

          {/* Instructor card — compact */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-5 space-y-3">
            {/* Avatar + nombre */}
            <div className="flex items-center gap-4">
              <div className="h-[110px] w-[110px] rounded-xl overflow-hidden shrink-0 shadow-xl shadow-black/40">
                <Image
                  src="/images/instructors/Perfil.png"
                  alt="Andrés Ospina"
                  width={110}
                  height={110}
                  className="object-cover w-full h-full"
                />
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
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all font-roboto leading-tight"
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
            <p className="text-white/40 text-xs leading-relaxed font-roboto">
              Más de 10 años de experiencia ayudando a estudiantes a descubrir y potenciar su talento. Enfoque personalizado y resultados reales.
            </p>

            {/* Disponibilidad */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold text-orange-400 font-roboto"><span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />Presencial</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-400 font-roboto"><span className="h-2 w-2 rounded-full bg-green-400 inline-block" />Disponible hoy</span>
            </div>
          </div>

          {/* Info strip — grid 4 columnas iguales with SVG icons */}
          <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden">
            {[
              {
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                ),
                label: "Duración",
                value: "60 min",
              },
              {
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                ),
                label: "Modalidad",
                value: "Presencial",
              },
              {
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                ),
                label: "Sede",
                value: "4U Studio",
              },
              {
                icon: (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                ),
                label: "Incluye",
                value: "Material",
              },
            ].map((item, i) => (
              <div
                key={item.label}
                className="flex flex-col items-center justify-center py-4 px-1 text-center min-w-0"
                style={i < 3 ? { borderRight: "1px solid rgba(255,255,255,0.1)" } : undefined}
              >
                <span className="mb-1.5 block leading-none" style={{ color: ORANGE }}>{item.icon}</span>
                <p className="text-[10px] text-white/40 font-roboto truncate w-full">{item.label}</p>
                <p className="text-[11px] text-white/75 font-semibold font-roboto truncate w-full">{item.value}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-white/40 font-roboto">
            Conócenos y descubre tu potencial.
          </p>
        </div>

        {/* ─── PANEL ÚNICO DERECHO: Calendario + Horarios + Resumen ──── */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-lg overflow-hidden">
          {/* Glow sutil naranja de fondo */}
          <div className="pointer-events-none absolute -inset-20 opacity-50" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,122,0,0.08), transparent 70%)" }} aria-hidden="true" />

          <div className="relative lg:grid lg:grid-cols-[1fr_1fr]">
            {/* ─── CALENDARIO ──── */}
            <div className="p-4 lg:p-6 lg:border-r border-white/[0.08]">
              <StepHeader step={1} title="Selecciona una fecha" isComplete={step1Complete} />

              {/* Header mes */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="h-11 w-11 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#ff7a00]/20 hover:border-[#ff7a00]/40 transition-all"
                  aria-label="Mes anterior"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <span className="text-[26px] lg:text-[28px] font-bold text-white font-poppins tracking-tight">
                  {MONTHS_ES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="h-11 w-11 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#ff7a00]/20 hover:border-[#ff7a00]/40 transition-all"
                  aria-label="Mes siguiente"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Días de la semana */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_ES.map((d) => (
                  <div key={d} className="text-center text-[11px] font-bold text-white/35 py-1 font-roboto">
                    {d}
                  </div>
                ))}
              </div>

              {/* Celdas */}
              <div className="grid grid-cols-7 gap-1.5">
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
                        "h-9 w-9 mx-auto rounded-full text-sm font-semibold transition-all font-roboto flex items-center justify-center",
                        !current       ? "text-white/15 cursor-default"                          : "",
                        current && sun  ? "text-red-400/40 cursor-not-allowed"                   : "",
                        current && past && !sun ? "text-white/20 cursor-not-allowed"             : "",
                        current && !disabled && !sel && !tod ? "text-white/70 hover:bg-white/10 hover:text-white" : "",
                        tod && !sel    ? "text-[#ff7a00] font-bold"                             : "",
                        sel            ? "text-white font-bold"                                  : "",
                      ].filter(Boolean).join(" ")}
                      style={sel ? { backgroundColor: ORANGE, boxShadow: "0 0 30px rgba(255,122,0,0.45)" } : undefined}
                      aria-label={current ? `${day} de ${MONTHS_ES[viewDate.getMonth()]}` : undefined}
                      aria-pressed={sel}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="mt-4 flex items-center gap-2 text-[11px] text-white/50">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                Fechas disponibles
              </div>
            </div>

            {/* ─── HORARIOS + RESUMEN ──── */}
            <div className="p-4 lg:p-6 space-y-6">
              {/* Horarios */}
              <div>
                <StepHeader step={2} title="Horarios disponibles" isComplete={step2Complete} />
                <div className="grid grid-cols-3 gap-2.5">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className="py-3.5 min-h-[44px] rounded-lg text-xs font-semibold font-roboto"
                      style={
                        selectedTime === t
                          ? { backgroundColor: ORANGE, color: "#fff", boxShadow: "0 0 20px rgba(255,122,0,0.5)", transform: "scale(1.05)", transition: "all 0.15s ease" }
                          : { backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Paso 3: Tipo de clase ── */}
              <div>
                <StepHeader step={3} title="Tipo de clase" isComplete={true} />
                <div className="flex flex-wrap gap-2">
                  {COURSES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedCourse(c)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all font-roboto"
                      style={
                        selectedCourse === c
                          ? { backgroundColor: ORANGE, color: '#fff', boxShadow: '0 0 14px rgba(255,122,0,0.35)' }
                          : { backgroundColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.08)' }
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>


              {/* ── Acciones CTA ── */}
              <div className="space-y-3">

                {isLoggedIn ? (
                  /* Estudiante logueado: botón de reserva en sistema */
                  <>
                    {state.status === 'error' && (
                      <p className="text-red-400 text-xs text-center font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {state.message}
                      </p>
                    )}

                    {/* Trust strip */}
                    <div className="flex flex-wrap gap-3 text-[10px] text-white/40 font-roboto">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                          <path d="M20 6 9 17l-5-5"/>
                        </svg>
                        Confirmación inmediata
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-[#ff7a00]" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
                        </svg>
                        Instructor verificado
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Reserva segura
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending || !selectedDate || !selectedTime}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white font-poppins transition-all duration-300 h-14 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                      style={{
                        backgroundColor: selectedDate && selectedTime ? '#ff8800' : ORANGE,
                        boxShadow: selectedDate && selectedTime ? "0 0 32px rgba(255,122,0,0.5), 0 4px 16px rgba(255,122,0,0.3)" : "none",
                      }}
                    >
                      {isPending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                          </svg>
                          Agendando...
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M8 2v4M16 2v4M4 10h16M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
                          </svg>
                          {!selectedDate || !selectedTime ? "Selecciona fecha y horario" : "Agendar Clase"}
                        </>
                      )}
                    </button>

                    {/* WhatsApp secundario — más visible */}
                    <a
                      href={buildWALinkDirect(selectedCourse, selectedDate, selectedTime)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-green-400/70 hover:text-green-400 font-roboto transition-all border border-white/10 hover:border-green-400/30 hover:bg-green-400/5"
                    >
                      <WaIcon className="h-3.5 w-3.5 fill-current shrink-0 text-green-400/70" />
                      También puedes agendar por WhatsApp
                    </a>
                  </>
                ) : (
                  /* Usuario no logueado: WhatsApp principal + login secundario */
                  <>
                    <a
                      href={buildWALinkDirect(selectedCourse, selectedDate, selectedTime)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white font-poppins transition-all hover:brightness-110 h-14"
                      style={{ backgroundColor: "#25D366", boxShadow: "0 0 25px rgba(37,211,102,0.2)" }}
                    >
                      <WaIcon className="h-5 w-5 fill-white shrink-0" />
                      Agendar por WhatsApp
                    </a>

                    <a
                      href="/mi-cuenta/login?next=/agendar"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-white/60 hover:text-white font-roboto transition-all border border-white/10 hover:border-[#ff7a00]/40 hover:text-[#ff7a00]"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                      </svg>
                      Iniciar sesión para agendar en el sistema
                    </a>
                  </>
                )}

              </div>

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
      </div>

      {/* ─── FEATURE STRIP ───────────────────────────── */}
      <div className="mt-8 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {[
          {
            icon: (
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
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
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
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
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ),
            label: "Clases presenciales personalizadas",
            sub: "Aprende directamente en nuestro estudio con todo el equipo a tu disposición.",
          },
        ].map((f) => (
          <div key={f.label} className="flex items-center gap-4 px-6 py-6">
            <span className="shrink-0" style={{ color: ORANGE }}>{f.icon}</span>
            <div>
              <p className="text-sm font-bold text-white font-poppins">{f.label}</p>
              <p className="text-xs text-white/40 mt-0.5 font-roboto">{f.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ─── STICKY MOBILE CTA ───────────────────────── */}
      {isLoggedIn && selectedDate && selectedTime && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent lg:hidden">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-4 text-sm font-bold text-white font-poppins"
            style={{ backgroundColor: '#ff7a00', boxShadow: '0 0 24px rgba(255,122,0,0.4)' }}
          >
            {isPending ? 'Agendando...' : `Agendar — ${selectedDate.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })} ${selectedTime}`}
          </button>
        </div>
      )}
    </form>
  );
}
