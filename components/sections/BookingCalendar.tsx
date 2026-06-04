"use client";

import {
  useState,
  useActionState,
  useMemo,
  useEffect,
  useRef,
} from "react";
import Image from "next/image";
import { createBrowserClient } from "@supabase/ssr";
import { createAppointment } from "@/app/agendar/actions";
import { getAvailableSlotsAction } from "@/app/(student)/_actions/student";
import type { BookingFormState } from "@/types/booking";
import { ACADEMY } from "@/lib/constants";
import { getHolidayMap } from "@/lib/calendar/colombia-holidays";

// ─── Types ───────────────────────────────────────────────────────────────────

type SlotRow = {
  slot_time: string;       // "17:00:00"
  classroom_id: string;
  classroom_name: string;
  is_available: boolean;
};

type TimeSlot = {
  time: string;            // "17:00"
  label: string;           // "5:00 PM"
  available: boolean;
};

type BookingAction = (prev: BookingFormState, data: FormData) => Promise<BookingFormState>;

type BookingCalendarProps = {
  serverAction?: BookingAction;
  mode?: "public" | "student";
  isLoggedIn?: boolean;
  instructors?: { id: string; name: string }[];
  activeCourses?: { id: string; name: string }[];
  studentId?: string;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const FALLBACK_COURSES = [
  "Bajo", "Batería", "Canto", "Guitarra", "Piano", "Producción Musical", "Teclado",
];

// Slots estáticos para modo público (sin auth)
const STATIC_SLOTS: TimeSlot[] = [
  { time: "17:00", label: "5:00 PM", available: true },
  { time: "18:00", label: "6:00 PM", available: true },
  { time: "19:00", label: "7:00 PM", available: true },
  { time: "20:00", label: "8:00 PM", available: true },
  { time: "21:00", label: "9:00 PM", available: true },
];

const MONTHS_ES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const DAYS_ES = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
const ORANGE = "#ff7a00";
const initialState: BookingFormState = { status: "idle" };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSlotTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const total = new Date(year, month + 1, 0).getDate();
  const prevTotal = new Date(year, month, 0).getDate();
  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstDow - 1; i >= 0; i--) cells.push({ day: prevTotal - i, current: false });
  for (let d = 1; d <= total; d++) cells.push({ day: d, current: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDow - total + 1, current: false });
  return cells;
}

function instructorInitials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function buildWALink(course: string, date: Date | null, timeLabel: string | null) {
  let msg = `Hola! Me gustaría agendar una clase de ${course || "música"} en 4U Studio Academy.`;
  if (date && timeLabel) {
    const dateStr = date.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
    msg += ` Me interesa el ${dateStr} a las ${timeLabel}.`;
  }
  msg += " ¿Podrían ayudarme?";
  return `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=${encodeURIComponent(msg)}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
      <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z" />
    </svg>
  );
}

function StepBadge({ step, done }: { step: number; done: boolean }) {
  return (
    <span
      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 transition-colors"
      style={{ backgroundColor: done ? ORANGE : "rgba(255,255,255,0.12)", color: "#fff" }}
    >
      {done ? "✓" : step}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BookingCalendar({
  serverAction,
  mode = "public",
  isLoggedIn = false,
  instructors = [],
  activeCourses,
  studentId,
}: BookingCalendarProps = {}) {
  const [state, formAction, isPending] = useActionState(
    serverAction ?? createAppointment,
    initialState
  );

  const today = new Date();
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string | null>(null); // "17:00"
  const [selectedInstructorId, setSelectedInstructorId] = useState<string>(
    instructors[0]?.id ?? ""
  );
  const [slots, setSlots] = useState<SlotRow[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [raceError, setRaceError] = useState<string | null>(null);

  const todayMidnight = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Ref para la comparación dentro del callback de realtime
  const selectedTimeRef = useRef(selectedTime);
  useEffect(() => { selectedTimeRef.current = selectedTime; }, [selectedTime]);

  const courses = activeCourses?.map((c) => c.name) ?? FALLBACK_COURSES;
  const activeInstructor =
    instructors.find((i) => i.id === selectedInstructorId) ??
    instructors[0] ??
    null;

  const selectedDateIso = useMemo(
    () => (selectedDate ? toIsoDate(selectedDate) : null),
    [selectedDate]
  );

  // Holiday map para el año actual ±1
  const holidayMap = useMemo(
    () => ({
      ...getHolidayMap(viewDate.getFullYear() - 1),
      ...getHolidayMap(viewDate.getFullYear()),
      ...getHolidayMap(viewDate.getFullYear() + 1),
    }),
    [viewDate]
  );

  const cells = useMemo(
    () => calendarDays(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  // ─── Fetch slots cuando cambia la fecha (solo modo estudiante) ────────
  useEffect(() => {
    if (!selectedDateIso || mode !== "student") {
      setSlots([]);
      setSlotsLoading(false);
      return;
    }
    setSlotsLoading(true);
    setSelectedTime(null);
    setRaceError(null);
    getAvailableSlotsAction(selectedDateIso)
      .then((data) => { setSlots(data); setSlotsLoading(false); })
      .catch(() => setSlotsLoading(false));
  }, [selectedDateIso, mode]);

  // ─── Re-fetch tras race condition en submit ───────────────────────────
  useEffect(() => {
    if (state.status === "error" && state.isRaceCondition && selectedDateIso) {
      setSelectedTime(null);
      setRaceError(state.message ?? null);
      getAvailableSlotsAction(selectedDateIso)
        .then((data) => setSlots(data))
        .catch(() => {});
    }
  }, [state, selectedDateIso]);

  // ─── Supabase Realtime — disponibilidad en vivo ───────────────────────
  useEffect(() => {
    if (!selectedDateIso || mode !== "student" || !isLoggedIn) return;

    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let channel: any;

    const subscribe = () => {
      if (disposed) return;
      channel = sb
        .channel(`booking-avail-${selectedDateIso}-${Date.now()}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "class_sessions",
            filter: `scheduled_date=eq.${selectedDateIso}`,
          },
          async () => {
            if (disposed) return;
            const newSlots = await getAvailableSlotsAction(selectedDateIso);
            if (disposed) return;
            setSlots(newSlots);

            // Verificar si el horario elegido ya no está disponible
            const curTime = selectedTimeRef.current;
            if (curTime) {
              const still = newSlots.some(
                (s) => s.slot_time.slice(0, 5) === curTime && s.is_available
              );
              if (!still) {
                setSelectedTime(null);
                setRaceError(
                  "Este horario acaba de ser reservado. Por favor selecciona otro horario disponible."
                );
              }
            }
          }
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(retry);
            retry = setTimeout(() => {
              if (disposed) return;
              if (channel) sb.removeChannel(channel);
              subscribe();
            }, 3000);
          }
        });
    };

    subscribe();

    // Polling de respaldo cada 30s
    const timer = setInterval(async () => {
      if (disposed || !selectedDateIso) return;
      const newSlots = await getAvailableSlotsAction(selectedDateIso);
      if (!disposed) setSlots(newSlots);
    }, 30_000);

    return () => {
      disposed = true;
      clearTimeout(retry);
      if (channel) sb.removeChannel(channel);
      clearInterval(timer);
    };
  }, [selectedDateIso, mode, isLoggedIn]);

  // ─── Time slots deduplicados para mostrar ────────────────────────────
  const timeSlots = useMemo((): TimeSlot[] => {
    if (mode !== "student") return STATIC_SLOTS;
    const map: Record<string, TimeSlot> = {};
    for (const s of slots) {
      const time = s.slot_time.slice(0, 5);
      if (!map[time]) {
        map[time] = { time, label: fmtSlotTime(s.slot_time), available: false };
      }
      if (s.is_available) map[time].available = true;
    }
    return Object.values(map).sort((a, b) => a.time.localeCompare(b.time));
  }, [slots, mode]);

  // ─── Helpers de calendario ───────────────────────────────────────────
  const isPast = (d: number, cur: boolean) => {
    if (!cur) return false;
    const dt = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
    dt.setHours(0, 0, 0, 0);
    return dt < todayMidnight;
  };
  const isSunday = (d: number, cur: boolean) => {
    if (!cur) return false;
    return new Date(viewDate.getFullYear(), viewDate.getMonth(), d).getDay() === 0;
  };
  const isToday = (d: number, cur: boolean) =>
    cur &&
    d === today.getDate() &&
    viewDate.getMonth() === today.getMonth() &&
    viewDate.getFullYear() === today.getFullYear();
  const isSelected = (d: number, cur: boolean) =>
    cur &&
    selectedDate?.getDate() === d &&
    selectedDate?.getMonth() === viewDate.getMonth() &&
    selectedDate?.getFullYear() === viewDate.getFullYear();
  const getHoliday = (d: number, cur: boolean) => {
    if (!cur) return null;
    const key = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return holidayMap[key]?.[0] ?? null;
  };

  const handleDay = (d: number, cur: boolean) => {
    if (!cur || isSunday(d, cur) || isPast(d, cur)) return;
    setSelectedDate(new Date(viewDate.getFullYear(), viewDate.getMonth(), d));
    setSelectedCourse("");
    setSelectedTime(null);
    setRaceError(null);
  };

  // Pasos completados
  const step1Done = !!selectedDate;
  const step2Done = !!selectedCourse;
  const step3Done = !!selectedTime;
  const canSubmit = step1Done && step2Done && step3Done;

  // Etiqueta del horario seleccionado para WhatsApp
  const selectedTimeLabel = selectedTime ? fmtSlotTime(selectedTime + ":00") : null;

  // ─── SUCCESS: Estudiante ─────────────────────────────────────────────
  if (state.status === "success" && mode === "student") {
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
            {state.submittedCourse ? `Tu clase de ${state.submittedCourse}` : "Tu clase"} ha sido reservada.<br />
            La verás reflejada en tu dashboard.
          </p>
        </div>
        <a
          href="/mi-cuenta"
          className="px-6 py-2.5 rounded-full text-sm font-semibold font-poppins text-white border border-white/20 hover:border-white/40 transition-all"
        >
          Ver mis clases
        </a>
      </div>
    );
  }

  // ─── SUCCESS: Público ────────────────────────────────────────────────
  if (state.status === "success") {
    const waLink = buildWALink(state.submittedCourse ?? "música", null, null);
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
            Guardamos tu solicitud. Te contactaremos para confirmar tu clase.
          </p>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 font-poppins"
          style={{ backgroundColor: "#25D366", boxShadow: "0 8px 24px rgba(37,211,102,0.25)" }}
        >
          <WaIcon className="h-5 w-5 shrink-0" />
          Continuar por WhatsApp
        </a>
      </div>
    );
  }

  // ─── MAIN FORM ───────────────────────────────────────────────────────
  return (
    <form action={formAction} noValidate>
      {/* Hidden fields */}
      <input type="hidden" name="course" value={selectedCourse} />
      <input type="hidden" name="modality" value="presencial" />
      <input type="hidden" name="source" value="agendar" />
      <input type="hidden" name="selected_date_iso" value={selectedDateIso ?? ""} />
      <input type="hidden" name="selected_time_24h" value={selectedTime ?? ""} />
      <input type="hidden" name="selected_instructor_id" value={selectedInstructorId} />

      <div className="grid lg:grid-cols-[1fr_2fr] gap-5 items-start">

        {/* ═══════════════════════════════════════
            COLUMNA IZQUIERDA: Header + Instructor + Resumen
        ═══════════════════════════════════════ */}
        <div className="space-y-4">
          {/* Título */}
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-[1.08] font-poppins">
              Agenda tu<br />
              curso <span style={{ color: ORANGE }}>ideal</span>
            </h1>
            <p className="text-white/55 text-sm mt-3 leading-relaxed font-roboto">
              Selecciona fecha, instrumento y horario. Confirmación inmediata.
            </p>
          </div>

          {/* Tarjeta instructor */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.05] backdrop-blur-md p-5 space-y-3">
            <div className="flex items-center gap-4">
              {mode === "student" && activeInstructor ? (
                <div className="h-[110px] w-[110px] rounded-xl overflow-hidden shrink-0 shadow-xl shadow-black/40 bg-[#ff7a00]/20 flex items-center justify-center">
                  <span className="text-white font-poppins font-black text-3xl">
                    {instructorInitials(activeInstructor.name)}
                  </span>
                </div>
              ) : (
                <div className="h-[110px] w-[110px] rounded-xl overflow-hidden shrink-0 shadow-xl shadow-black/40">
                  <Image
                    src="/images/instructors/Perfil.png"
                    alt="Instructor 4U Studio"
                    width={110}
                    height={110}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-white font-bold text-sm font-poppins">
                    {mode === "student" && activeInstructor
                      ? activeInstructor.name
                      : "Andrés Ospina"}
                  </p>
                  <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill={ORANGE} aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                </div>
                <p className="text-white/50 text-xs font-roboto">Instructor 4U Studio Academy</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <svg className="h-3 w-3 fill-yellow-400" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                  </svg>
                  <span className="text-yellow-400 text-xs font-semibold">4.9</span>
                  <span className="text-white/30 text-xs">(128 reseñas)</span>
                </div>
              </div>
            </div>

            {/* Selector de instructor (solo cuando hay múltiples) */}
            {mode === "student" && instructors.length > 1 && (
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2 font-roboto">Instructor:</p>
                <div className="flex flex-wrap gap-1.5">
                  {instructors.map((inst) => (
                    <button
                      key={inst.id}
                      type="button"
                      onClick={() => setSelectedInstructorId(inst.id)}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all font-roboto leading-tight"
                      style={
                        selectedInstructorId === inst.id
                          ? { backgroundColor: ORANGE, color: "#fff" }
                          : { backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }
                      }
                    >
                      {inst.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <p className="text-white/40 text-xs leading-relaxed font-roboto">
              Más de 10 años de experiencia. Enfoque personalizado y resultados reales.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-[10px] font-semibold text-orange-400 font-roboto">
                <span className="h-2 w-2 rounded-full bg-orange-400 inline-block" />Presencial
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-[10px] font-semibold text-green-400 font-roboto">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />Disponible hoy
              </span>
            </div>
          </div>

          {/* Resumen de selección */}
          {(step1Done || step2Done || step3Done) && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 space-y-2.5">
              <p className="text-white/40 text-[10px] uppercase tracking-wider font-roboto">Tu reserva</p>
              {selectedDate && (
                <div className="flex items-center gap-2.5 text-sm text-white">
                  <svg className="h-4 w-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                  </svg>
                  <span className="capitalize">
                    {selectedDate.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                  </span>
                </div>
              )}
              {selectedCourse && (
                <div className="flex items-center gap-2.5 text-sm text-white">
                  <svg className="h-4 w-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                  </svg>
                  {selectedCourse}
                </div>
              )}
              {selectedTime && (
                <div className="flex items-center gap-2.5 text-sm text-white">
                  <svg className="h-4 w-4 text-orange-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                  {fmtSlotTime(selectedTime + ":00")}
                </div>
              )}
            </div>
          )}

          {/* Info strip */}
          <div className="grid grid-cols-4 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-md overflow-hidden">
            {[
              {
                icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
                label: "Duración", value: "60 min",
              },
              {
                icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>,
                label: "Modalidad", value: "Presencial",
              },
              {
                icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
                label: "Sede", value: "4U Studio",
              },
              {
                icon: <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>,
                label: "Incluye", value: "Material",
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
        </div>

        {/* ═══════════════════════════════════════
            COLUMNA DERECHA: Calendario + Pasos
        ═══════════════════════════════════════ */}
        <div className="relative rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-lg overflow-hidden">
          <div
            className="pointer-events-none absolute -inset-20 opacity-50"
            style={{ background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(255,122,0,0.08), transparent 70%)" }}
            aria-hidden="true"
          />

          <div className="relative lg:grid lg:grid-cols-[1fr_1fr]">
            {/* ─── PASO 1: CALENDARIO ────────────────── */}
            <div className="p-4 lg:p-6 lg:border-r border-white/[0.08]">
              <div className="flex items-center gap-2 mb-4">
                <StepBadge step={1} done={step1Done} />
                <p className="text-sm font-bold text-white font-poppins">Selecciona una fecha</p>
              </div>

              {/* Header del mes */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
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
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="h-11 w-11 rounded-full border border-white/15 flex items-center justify-center text-white/60 hover:text-white hover:bg-[#ff7a00]/20 hover:border-[#ff7a00]/40 transition-all"
                  aria-label="Mes siguiente"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>

              {/* Encabezados de días */}
              <div className="grid grid-cols-7 mb-2">
                {DAYS_ES.map((d) => (
                  <div key={d} className="text-center text-[11px] font-bold text-white/35 py-1 font-roboto">{d}</div>
                ))}
              </div>

              {/* Celdas del calendario */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map(({ day, current }, idx) => {
                  const sun = isSunday(day, current);
                  const past = isPast(day, current);
                  const tod = isToday(day, current);
                  const sel = isSelected(day, current);
                  const disabled = !current || sun || past;
                  const holiday = getHoliday(day, current);
                  const isHoliday = !!holiday && current && !past;

                  let btnStyle: React.CSSProperties = {};
                  if (sel) {
                    btnStyle = { backgroundColor: ORANGE, boxShadow: "0 0 30px rgba(255,122,0,0.45)" };
                  } else if (isHoliday) {
                    btnStyle = { backgroundColor: "rgba(253,224,71,0.12)", border: "1px solid rgba(253,224,71,0.25)" };
                  }

                  return (
                    <div key={idx} className="relative flex flex-col items-center">
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => handleDay(day, current)}
                        className={[
                          "h-9 w-9 rounded-full text-sm font-semibold transition-all font-roboto flex items-center justify-center",
                          !current ? "text-white/15 cursor-default" : "",
                          current && sun ? "text-red-400/40 cursor-not-allowed" : "",
                          current && past && !sun ? "text-white/20 cursor-not-allowed" : "",
                          current && !disabled && !sel && !isHoliday ? "text-white/70 hover:bg-white/10 hover:text-white" : "",
                          current && !disabled && isHoliday && !sel ? "text-yellow-300/90 hover:bg-yellow-400/10" : "",
                          tod && !sel ? "text-[#ff7a00] font-bold" : "",
                          sel ? "text-white font-bold" : "",
                        ].filter(Boolean).join(" ")}
                        style={btnStyle}
                        aria-label={current ? `${day} de ${MONTHS_ES[viewDate.getMonth()]}${isHoliday ? " — Festivo: " + holiday!.title : ""}` : undefined}
                        aria-pressed={sel}
                        title={isHoliday ? holiday!.title : undefined}
                      >
                        {day}
                      </button>
                      {/* Punto festivo */}
                      {isHoliday && (
                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-yellow-400" aria-hidden="true" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-[10px] text-white/45 font-roboto">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />Disponible
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />Festivo
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-white/15 inline-block" />No disponible
                </span>
              </div>
            </div>

            {/* ─── PASOS 2, 3 Y CTA ───────────────────── */}
            <div className="p-4 lg:p-6 space-y-5">

              {/* PASO 2: Instrumento */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StepBadge step={2} done={step2Done} />
                  <p className="text-sm font-bold text-white font-poppins">Elige tu instrumento</p>
                </div>
                {!step1Done ? (
                  <p className="text-white/30 text-xs font-roboto">Primero selecciona una fecha en el calendario.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {courses.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => { setSelectedCourse(c); setSelectedTime(null); setRaceError(null); }}
                        className="py-2.5 px-3 rounded-lg text-xs font-semibold font-roboto text-left transition-all"
                        style={
                          selectedCourse === c
                            ? { backgroundColor: ORANGE, color: "#fff", boxShadow: "0 0 14px rgba(255,122,0,0.35)" }
                            : { backgroundColor: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.65)", border: "1px solid rgba(255,255,255,0.1)" }
                        }
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PASO 3: Horarios */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <StepBadge step={3} done={step3Done} />
                  <p className="text-sm font-bold text-white font-poppins">
                    Horarios disponibles
                    {slotsLoading && (
                      <span className="ml-2 text-white/30 text-xs font-normal">actualizando…</span>
                    )}
                  </p>
                </div>

                {/* Alerta de race condition */}
                {raceError && (
                  <div className="mb-3 rounded-lg bg-amber-500/10 border border-amber-500/25 px-3 py-2 flex items-start gap-2">
                    <svg className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <p className="text-amber-300 text-xs font-roboto">{raceError}</p>
                  </div>
                )}

                {!step1Done || !step2Done ? (
                  <p className="text-white/30 text-xs font-roboto">
                    {!step1Done ? "Selecciona una fecha para ver horarios." : "Elige un instrumento para ver horarios."}
                  </p>
                ) : slotsLoading ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-11 rounded-lg bg-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : timeSlots.length === 0 ? (
                  <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-6 text-center">
                    <p className="text-white/40 text-sm font-roboto">No hay horarios disponibles para este día.</p>
                    <p className="text-white/25 text-xs mt-1 font-roboto">Prueba con otro día.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map((ts) => (
                      <button
                        key={ts.time}
                        type="button"
                        disabled={!ts.available}
                        onClick={() => { setSelectedTime(ts.time); setRaceError(null); }}
                        className={[
                          "py-3.5 min-h-[44px] rounded-lg text-xs font-semibold font-roboto transition-all",
                          !ts.available ? "cursor-not-allowed" : "cursor-pointer",
                        ].join(" ")}
                        style={
                          !ts.available
                            ? {
                              backgroundColor: "rgba(255,255,255,0.03)",
                              color: "rgba(255,255,255,0.2)",
                              border: "1px solid rgba(255,255,255,0.05)",
                              textDecoration: "line-through",
                            }
                            : selectedTime === ts.time
                            ? { backgroundColor: ORANGE, color: "#fff", boxShadow: "0 0 20px rgba(255,122,0,0.5)", transform: "scale(1.05)" }
                            : { backgroundColor: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.7)", border: "1px solid rgba(255,255,255,0.1)" }
                        }
                        title={!ts.available ? "Horario no disponible" : ts.label}
                      >
                        {ts.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ─── CTA ──────────────────────────── */}
              <div className="space-y-3 pt-1">
                {isLoggedIn ? (
                  <>
                    {state.status === "error" && !state.isRaceCondition && (
                      <p className="text-red-400 text-xs text-center font-roboto bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                        {state.message}
                      </p>
                    )}

                    {/* Trust strip */}
                    <div className="flex flex-wrap gap-3 text-[10px] text-white/40 font-roboto">
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                        Confirmación inmediata
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-[#ff7a00]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                          <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                        </svg>
                        Instructor verificado
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="h-3 w-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Reserva segura
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={isPending || !canSubmit}
                      className="w-full flex items-center justify-center gap-2.5 rounded-xl py-4 text-sm font-bold text-white font-poppins transition-all duration-300 h-14 disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110"
                      style={{
                        backgroundColor: canSubmit ? "#ff8800" : ORANGE,
                        boxShadow: canSubmit
                          ? "0 0 32px rgba(255,122,0,0.5), 0 4px 16px rgba(255,122,0,0.3)"
                          : "none",
                      }}
                    >
                      {isPending ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
                          </svg>
                          Confirmando reserva…
                        </>
                      ) : !step1Done ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
                          </svg>
                          Paso 1: Selecciona una fecha
                        </>
                      ) : !step2Done ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
                          </svg>
                          Paso 2: Elige un instrumento
                        </>
                      ) : !step3Done ? (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                          </svg>
                          Paso 3: Elige un horario
                        </>
                      ) : (
                        <>
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                            <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
                          </svg>
                          Confirmar reserva
                        </>
                      )}
                    </button>

                    <a
                      href={buildWALink(selectedCourse || "música", selectedDate, selectedTimeLabel)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold text-green-400/70 hover:text-green-400 font-roboto transition-all border border-white/10 hover:border-green-400/30 hover:bg-green-400/5"
                    >
                      <WaIcon className="h-3.5 w-3.5 fill-current shrink-0 text-green-400/70" />
                      También puedes agendar por WhatsApp
                    </a>
                  </>
                ) : (
                  <>
                    <a
                      href={buildWALink(selectedCourse || "música", selectedDate, selectedTimeLabel)}
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

                <p className="text-center text-white/25 text-[10px] font-roboto flex items-center justify-center gap-1.5">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  Tu información está segura con nosotros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Feature strip ─────────────────────────────────────────── */}
      <div className="mt-8 grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {[
          {
            icon: (
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0-3-3.87" />
              </svg>
            ),
            label: "Atención personalizada",
            sub: "Instructores expertos enfocados en ti.",
          },
          {
            icon: (
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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
                <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            ),
            label: "Clases presenciales",
            sub: "Aprende en nuestro estudio con todo el equipo disponible.",
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

      {/* ─── Sticky mobile CTA ─────────────────────────────────────── */}
      {isLoggedIn && canSubmit && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black via-black/95 to-transparent lg:hidden">
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl py-4 text-sm font-bold text-white font-poppins"
            style={{ backgroundColor: "#ff7a00", boxShadow: "0 0 24px rgba(255,122,0,0.4)" }}
          >
            {isPending
              ? "Confirmando…"
              : `Confirmar — ${selectedDate?.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" })} ${selectedTimeLabel ?? ""}`}
          </button>
        </div>
      )}
    </form>
  );
}
