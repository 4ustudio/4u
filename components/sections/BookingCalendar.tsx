"use client";

import {
  useState, useActionState, useMemo, useEffect, useRef, useTransition,
} from "react";
import { createBrowserClient } from "@supabase/ssr";
import { createAppointment } from "@/app/agendar/actions";
import { getAvailableSlotsAction } from "@/app/(student)/_actions/student";
import { getHolidayMapForYears } from "@/lib/calendar/colombia-holidays";
import type { BookingFormState } from "@/types/booking";
import { ACADEMY } from "@/lib/constants";

/* eslint-disable @typescript-eslint/no-explicit-any */

type SlotRow = { slot_time: string; classroom_id: string; classroom_name: string; is_available: boolean };
type TimeSlot = { time: string; label: string; available: boolean };
type BookingAction = (prev: BookingFormState, data: FormData) => Promise<BookingFormState>;

type BookingCalendarProps = {
  serverAction?: BookingAction;
  mode?: "public" | "student";
  isLoggedIn?: boolean;
  instructors?: { id: string; name: string }[];
  activeCourses?: { id: string; name: string }[];
  studentId?: string;
};

const FALLBACK_COURSES = ["Bajo","Batería","Canto","Guitarra","Piano","Producción Musical","Teclado"];
const STATIC_SLOTS: TimeSlot[] = [
  { time:"10:00", label:"10:00 AM", available:true },
  { time:"11:00", label:"11:00 AM", available:true },
  { time:"12:00", label:"12:00 PM", available:true },
  { time:"13:00", label:"1:00 PM",  available:true },
  { time:"14:00", label:"2:00 PM",  available:true },
  { time:"15:00", label:"3:00 PM",  available:true },
  { time:"16:00", label:"4:00 PM",  available:true },
  { time:"17:00", label:"5:00 PM",  available:true },
  { time:"18:00", label:"6:00 PM",  available:true },
  { time:"19:00", label:"7:00 PM",  available:true },
  { time:"20:00", label:"8:00 PM",  available:true },
  { time:"21:00", label:"9:00 PM",  available:true },
  { time:"22:00", label:"10:00 PM", available:true },
];
const MONTHS_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DOW_HEAD    = ["D","L","M","M","J","V","S"];
const DOW_HEAD_LG = ["DOM","LUN","MAR","MIÉ","JUE","VIE","SÁB"];
const ORANGE = "#ff7a00";

function fmtSlotTime(t: string): string {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${h12}:${String(m).padStart(2,"0")} ${period}`;
}

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function fmtDateLong(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    weekday:"long", day:"numeric", month:"long",
  });
}

function fmtDateFull(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", {
    weekday:"long", day:"numeric", month:"long", year:"numeric",
  });
}

function calendarDays(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay();
  const total    = new Date(year, month+1, 0).getDate();
  const cells: { day: number; current: boolean }[] = [];
  for (let i = 0; i < firstDow; i++) cells.push({ day: 0, current: false });
  for (let d = 1; d <= total; d++)   cells.push({ day: d, current: true });
  while (cells.length % 7 !== 0)     cells.push({ day: 0, current: false });
  return cells;
}

function buildWALink(course: string, date: Date | null, timeLabel: string | null) {
  let msg = `Hola! Me gustaría agendar una clase de ${course || "música"} en 4U Studio Academy.`;
  if (date && timeLabel) {
    const ds = date.toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long" });
    msg += ` Me interesa el ${ds} a las ${timeLabel}.`;
  }
  msg += " ¿Podrían ayudarme?";
  return `https://api.whatsapp.com/send/?phone=${ACADEMY.phone}&text=${encodeURIComponent(msg)}`;
}

function WaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 448 512" aria-hidden="true">
      <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6z"/>
    </svg>
  );
}

export default function BookingCalendar({
  serverAction,
  mode = "public",
  isLoggedIn = false,
  instructors = [],
  activeCourses,
  studentId,
}: BookingCalendarProps = {}) {
  const [state, formAction, isPending] = useActionState(serverAction ?? createAppointment, { status: "idle" } as BookingFormState);

  const today = useMemo(() => new Date(), []);
  const todayIso = useMemo(() => toIsoDate(today), [today]);
  const todayYear  = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const [year,  setYear]  = useState(todayYear);
  const [month, setMonth] = useState(todayMonth);
  const [calView, setCalView] = useState<"mes"|"semana">("mes");
  const [, startTransition] = useTransition();

  const [selectedDate,   setSelectedDate]   = useState<Date | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedTime,   setSelectedTime]   = useState<string | null>(null);
  const selectedInstructorId = "";
  const [slots,       setSlots]       = useState<SlotRow[]>([]);
  const [slotsLoading,setSlotsLoading] = useState(false);
  const [raceError,   setRaceError]   = useState<string | null>(null);
  const [daySlotCounts, setDaySlotCounts] = useState<Record<string,number>>({});

  const selectedTimeRef = useRef(selectedTime);
  useEffect(() => { selectedTimeRef.current = selectedTime; }, [selectedTime]);

  const courses = activeCourses?.map(c => c.name) ?? FALLBACK_COURSES;
  const selectedDateIso = selectedDate ? toIsoDate(selectedDate) : null;
  const isCurrentMonth = year === todayYear && month === todayMonth;

  const holidayMap = useMemo(
    () => getHolidayMapForYears(year-1, year, year+1),
    [year]
  );

  const mm    = String(month).padStart(2,"0");
  const cells = useMemo(() => calendarDays(year, month-1), [year, month]);

  useEffect(() => {
    if (!selectedDateIso || mode !== "student") { setSlots([]); return; }
    setSlotsLoading(true);
    setSelectedTime(null);
    setRaceError(null);
    getAvailableSlotsAction(selectedDateIso)
      .then(data => {
        setSlots(data);
        setSlotsLoading(false);
        const available = new Set(data.filter(s => s.is_available).map(s => s.slot_time.slice(0,5))).size;
        setDaySlotCounts(prev => ({ ...prev, [selectedDateIso]: available }));
      })
      .catch(() => setSlotsLoading(false));
  }, [selectedDateIso, mode]);

  useEffect(() => {
    if (state.status === "error" && (state as any).isRaceCondition && selectedDateIso) {
      setSelectedTime(null);
      setRaceError((state as any).message ?? null);
      getAvailableSlotsAction(selectedDateIso).then(setSlots).catch(() => {});
    }
  }, [state, selectedDateIso]);

  useEffect(() => {
    if (!selectedDateIso || mode !== "student" || !isLoggedIn) return;
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    let disposed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;
    let channel: any;
    const subscribe = () => {
      if (disposed) return;
      channel = sb.channel(`booking-avail-${selectedDateIso}-${Date.now()}`)
        .on("postgres_changes", { event:"*", schema:"public", table:"class_sessions", filter:`scheduled_date=eq.${selectedDateIso}` },
          async () => {
            if (disposed) return;
            const newSlots = await getAvailableSlotsAction(selectedDateIso);
            if (disposed) return;
            setSlots(newSlots);
            const available = new Set(newSlots.filter(s => s.is_available).map(s => s.slot_time.slice(0,5))).size;
            setDaySlotCounts(prev => ({ ...prev, [selectedDateIso]: available }));
            const cur = selectedTimeRef.current;
            if (cur && !newSlots.some(s => s.slot_time.slice(0,5) === cur && s.is_available)) {
              setSelectedTime(null);
              setRaceError("Este horario acaba de ser reservado. Por favor selecciona otro.");
            }
          }
        )
        .subscribe((status: string) => {
          if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            clearTimeout(retry);
            retry = setTimeout(() => { if (disposed) return; if (channel) sb.removeChannel(channel); subscribe(); }, 3000);
          }
        });
    };
    subscribe();
    const timer = setInterval(async () => {
      if (disposed || !selectedDateIso) return;
      const ns = await getAvailableSlotsAction(selectedDateIso);
      if (!disposed) { setSlots(ns); const av = new Set(ns.filter(s=>s.is_available).map(s=>s.slot_time.slice(0,5))).size; setDaySlotCounts(p=>({...p,[selectedDateIso]:av})); }
    }, 30_000);
    return () => { disposed=true; clearTimeout(retry); if(channel) sb.removeChannel(channel); clearInterval(timer); };
  }, [selectedDateIso, mode, isLoggedIn]);

  const timeSlots = useMemo((): TimeSlot[] => {
    if (mode !== "student") return STATIC_SLOTS;
    const map: Record<string, TimeSlot> = {};
    for (const s of slots) {
      const t = s.slot_time.slice(0,5);
      if (!map[t]) map[t] = { time:t, label:fmtSlotTime(s.slot_time), available:false };
      if (s.is_available) map[t].available = true;
    }
    return Object.values(map).sort((a,b) => a.time.localeCompare(b.time));
  }, [slots, mode]);

  const todayMidnight = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const isPastDay = (d:number, cur:boolean) => {
    if (!cur || d===0) return false;
    const dt = new Date(year, month-1, d); dt.setHours(0,0,0,0); return dt < todayMidnight;
  };
  const isSunday   = (d:number, cur:boolean) => cur && d>0 && new Date(year,month-1,d).getDay()===0;
  const isSaturday = (d:number, cur:boolean) => cur && d>0 && new Date(year,month-1,d).getDay()===6;
  const isTodayDay = (d:number, cur:boolean) => cur && d>0 && `${year}-${mm}-${String(d).padStart(2,"0")}`===todayIso;
  const isSelected = (d:number, cur:boolean) => cur && d>0 && `${year}-${mm}-${String(d).padStart(2,"0")}`===selectedDateIso;
  const getHoliday = (d:number, cur:boolean) => {
    if (!cur||d===0) return null;
    return holidayMap[`${year}-${mm}-${String(d).padStart(2,"0")}`]?.[0] ?? null;
  };
  const getDateStr = (d:number) => `${year}-${mm}-${String(d).padStart(2,"0")}`;

  useEffect(() => {
    if (mode !== "student") return;
    let disposed = false;
    const eligibleDates = cells
      .filter(cell => cell.current && cell.day > 0)
      .map(cell => {
        const dateStr = getDateStr(cell.day);
        const dt = new Date(year, month-1, cell.day);
        dt.setHours(0,0,0,0);
        const dow = dt.getDay();
        const disabled = dow === 0 || dow === 6 || dt < todayMidnight || !!holidayMap[dateStr]?.[0];
        return disabled || daySlotCounts[dateStr] !== undefined ? null : dateStr;
      })
      .filter(Boolean) as string[];

    if (!eligibleDates.length) return;

    Promise.all(
      eligibleDates.map(async dateStr => {
        try {
          const data = await getAvailableSlotsAction(dateStr);
          const available = new Set(data.filter(s => s.is_available).map(s => s.slot_time.slice(0,5))).size;
          return [dateStr, available] as const;
        } catch {
          return [dateStr, 0] as const;
        }
      })
    ).then(results => {
      if (disposed) return;
      setDaySlotCounts(prev => {
        const next = { ...prev };
        for (const [dateStr, available] of results) next[dateStr] = available;
        return next;
      });
    });

    return () => { disposed = true; };
  }, [cells, daySlotCounts, holidayMap, mm, mode, month, todayMidnight, year]);

  const navigate = (delta:number) => {
    let m=month+delta, y=year;
    if (m<1) { m=12; y--; } if (m>12) { m=1; y++; }
    setYear(y); setMonth(m);
    setSelectedDate(null); setSelectedCourse(""); setSelectedTime(null);
  };
  const goToday = () => {
    setYear(todayYear); setMonth(todayMonth); setCalView("mes");
    setSelectedDate(null); setSelectedCourse(""); setSelectedTime(null);
  };

  const handleDayClick = (d:number, cur:boolean) => {
    if (!cur || d===0 || isSunday(d,cur) || isSaturday(d,cur) || isPastDay(d,cur) || getHoliday(d,cur)) return;
    setSelectedDate(new Date(year, month-1, d));
    setSelectedCourse(""); setSelectedTime(null); setRaceError(null);
    setTimeout(() => {
      document.getElementById("booking-flow")?.scrollIntoView({ behavior:"smooth", block:"nearest" });
    }, 80);
  };

  const availableCount = timeSlots.filter(ts => ts.available).length;
  const canSubmit = !!selectedDate && !!selectedCourse && !!selectedTime;
  const selectedTimeLabel = selectedTime ? fmtSlotTime(selectedTime+":00") : null;
  const currentStep = !selectedDate ? 1 : !selectedCourse ? 2 : !selectedTime ? 3 : 4;

  // ─── SUCCESS ─────────────────────────────────────────────────────
  if (state.status === "success" && mode === "student") {
    return (
      <div className="rounded-2xl border border-[#ff7a00]/20 bg-white shadow-lg p-10 flex flex-col items-center text-center gap-4"
        style={{ boxShadow:"0 4px 32px rgba(255,122,0,0.08)" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div>
          <h3 className="font-poppins text-xl font-extrabold text-gray-900">¡Clase agendada!</h3>
          <p className="text-gray-500 text-sm mt-1">
            {state.submittedCourse ? `Tu clase de ${state.submittedCourse}` : "Tu clase"} ha sido reservada.
          </p>
        </div>
        <a href="/mi-cuenta" className="px-6 py-2.5 rounded-xl bg-[#ff7a00] text-white text-sm font-bold font-poppins hover:brightness-110 transition-all">
          Ver mis clases
        </a>
      </div>
    );
  }
  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-[#ff7a00]/20 bg-white shadow-lg p-10 flex flex-col items-center text-center gap-4"
        style={{ boxShadow:"0 4px 32px rgba(255,122,0,0.08)" }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <svg className="h-7 w-7 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <div>
          <h3 className="font-poppins text-xl font-extrabold text-gray-900">¡Solicitud recibida!</h3>
          <p className="text-gray-500 text-sm mt-1">Te contactaremos para confirmar tu clase.</p>
        </div>
        <a href={buildWALink(state.submittedCourse ?? "música", null, null)} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold" style={{ backgroundColor:"#25D366" }}>
          <WaIcon className="h-4 w-4 shrink-0"/> Continuar por WhatsApp
        </a>
      </div>
    );
  }

  // ─── CLASS INFO ─────────────────────────────────────────────────
  const classInfoSection = (
    <section className="rounded-2xl border border-white/10 bg-[#141414] px-5 py-5">
      <p className="text-[10px] text-white/35 font-roboto uppercase tracking-widest mb-4">Información de la clase</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>, label:"Duración", value:"60 min" },
          { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label:"Modalidad", value:"Presencial" },
          { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label:"Sede", value:"4U Studio Academy" },
          { icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>, label:"Incluye", value:"Material de apoyo" },
        ].map((item, i) => (
          <div key={item.label} className={`flex items-center gap-3 ${i < 3 ? "sm:border-r sm:border-white/8" : ""}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor:"rgba(255,122,0,0.12)", color:"#ff7a00" }}>
              {item.icon}
            </span>
            <div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider font-roboto">{item.label}</p>
              <p className="text-sm font-bold text-white font-roboto mt-0.5">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  // ─── MAIN FORM ───────────────────────────────────────────────────
  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="course"                value={selectedCourse}/>
      <input type="hidden" name="modality"              value="presencial"/>
      <input type="hidden" name="source"                value="agendar"/>
      <input type="hidden" name="selected_date_iso"     value={selectedDateIso ?? ""}/>
      <input type="hidden" name="selected_time_24h"     value={selectedTime ?? ""}/>
      <input type="hidden" name="selected_instructor_id" value={selectedInstructorId}/>

      {/* ═══ STEPPER ════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5"
        style={{ boxShadow:"0 22px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="grid gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { step: 1, label: "Fecha", hint: selectedDateIso ? fmtDateLong(selectedDateIso) : "Elige el día" },
            { step: 2, label: "Instrumento", hint: selectedCourse || "Selecciona tu clase" },
            { step: 3, label: "Horario", hint: selectedTimeLabel || "Elige tu horario" },
            { step: 4, label: "Confirmar", hint: canSubmit ? "Revisa y confirma" : "Completa tu reserva" },
          ].map((s, i) => {
            const done = s.step < currentStep;
            const active = s.step === currentStep;
            return (
              <div key={s.step} className="relative flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold shrink-0 transition-all ${
                    done || active ? "text-white" : "text-white/45"
                  }`}
                  style={{
                    backgroundColor: done || active ? ORANGE : "rgba(255,255,255,0.10)",
                    boxShadow: active && !done ? `0 0 0 4px rgba(255,122,0,0.2)` : "none",
                  }}
                >
                  {done ? "✓" : s.step}
                </span>
                <span className="min-w-0">
                  <span className={`block text-sm font-extrabold font-poppins ${done || active ? "text-white" : "text-white/65"}`}>{s.label}</span>
                  <span className="block truncate text-xs text-white/45 font-roboto">{s.hint}</span>
                </span>
                {i < 3 && <span className="hidden sm:block absolute left-[calc(100%-12px)] top-1/2 h-px w-8 bg-white/15" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ CALENDAR CARD ═══════════════════════════════════════════ */}
      <div
        className="mt-4 rounded-2xl border border-white/10 bg-[#141414] p-4 sm:p-5"
        style={{ boxShadow:"0 22px 70px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)" }}
      >
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate(-1)}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#ff7a00] hover:border-[#ff7a00]/40 transition-colors"
              aria-label="Mes anterior">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
            </button>
            <h3 className="text-base sm:text-lg font-bold text-white font-poppins capitalize min-w-[140px] text-center select-none">
              {MONTHS_ES[month-1]} {year}
            </h3>
            <button type="button" onClick={() => navigate(1)}
              className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] flex items-center justify-center text-white/55 hover:text-[#ff7a00] hover:border-[#ff7a00]/40 transition-colors"
              aria-label="Mes siguiente">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
            </button>
            <button type="button" onClick={goToday}
              className={`h-9 px-3 rounded-xl border text-xs font-semibold font-poppins transition-colors ${
                isCurrentMonth && calView === "mes"
                  ? "border-[#ff7a00]/30 bg-[#ff7a00]/8 text-[#ff7a00] cursor-default"
                  : "border-white/10 bg-white/[0.04] text-white/55 hover:text-[#ff7a00] hover:border-[#ff7a00]/40"
              }`}>
              Hoy
            </button>
          </div>
          <div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-0.5 gap-0.5">
            {(["mes","semana"] as const).map(v => (
              <button key={v} type="button" onClick={() => setCalView(v)}
                className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-semibold font-poppins capitalize transition-all ${
                  calView===v ? "bg-[#ff7a00] text-white shadow-sm" : "text-white/55 hover:text-white"
                }`}>
                {v === "mes" ? "Mes" : "Semana"}
              </button>
            ))}
          </div>
        </div>

        {calView === "mes" ? (
          <>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DOW_HEAD.map((d,i)    => <div key={i} className="sm:hidden text-center text-[10px] font-semibold text-white/45 uppercase tracking-wider py-1">{d}</div>)}
              {DOW_HEAD_LG.map((d,i) => <div key={i} className="hidden sm:block text-center text-[10px] font-semibold text-white/45 uppercase tracking-wider py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {cells.map((cell, idx) => {
                if (!cell.current || cell.day===0) {
                  return <div key={idx} className="min-h-[38px] sm:min-h-[76px] lg:min-h-[96px] rounded-lg bg-white/[0.025]"/>;
                }
                const dateStr  = getDateStr(cell.day);
                const holiday  = getHoliday(cell.day, true);
                const sun      = isSunday(cell.day, true);
                const sat      = isSaturday(cell.day, true);
                const past     = isPastDay(cell.day, true);
                const tod      = isTodayDay(cell.day, true);
                const sel      = isSelected(cell.day, true);
                const disabled = sun || sat || past || (!!holiday && !past);
                const slotCount = daySlotCounts[dateStr];

                let cellCls: string;
                if (sel)      cellCls = "border-[#ff7a00] bg-[#ff7a00]/10 ring-1 ring-[#ff7a00]/30";
                else if (tod && !disabled) cellCls = "border-[#ff7a00]/50 bg-[#ff7a00]/8";
                else if (disabled) cellCls = "border-white/5 bg-white/[0.03] cursor-not-allowed";
                else          cellCls = "border-white/10 bg-white/[0.045] hover:border-[#ff7a00]/45 hover:bg-[#ff7a00]/8 cursor-pointer";

                const numCls = sel ? "text-[#ff7a00] font-extrabold"
                  : tod && !disabled ? "text-[#ff7a00] font-bold"
                  : past || sun || sat || holiday ? "text-white/20"
                  : "text-white/80 font-bold";

                return (
                  <div
                    key={idx}
                    role={disabled ? undefined : "button"}
                    aria-label={disabled ? undefined : `${cell.day} de ${MONTHS_ES[month-1]}${holiday ? ` — Festivo: ${holiday.title}` : ""}`}
                    aria-pressed={sel}
                    tabIndex={disabled ? undefined : 0}
                    onClick={() => handleDayClick(cell.day, true)}
                    onKeyDown={(e) => e.key==="Enter"||e.key===" " ? handleDayClick(cell.day,true):undefined}
                    className={`min-h-[38px] sm:min-h-[76px] lg:min-h-[96px] rounded-lg border p-1 sm:p-1.5 flex flex-col gap-0.5 select-none transition-all ${cellCls}`}
                  >
                    <span className={`text-[10px] sm:text-[12px] leading-none ${numCls}`}>{cell.day}</span>
                    {holiday && !past && (
                      <>
                        <span className="hidden sm:block text-[9px] text-yellow-300 px-1 py-0.5 rounded leading-none truncate"
                          title={holiday.description ?? holiday.title}>Festivo</span>
                        <span className="sm:hidden h-1.5 w-1.5 rounded-full bg-yellow-300 mt-0.5"/>
                      </>
                    )}
                    {!holiday && !past && !sun && !sat && (
                      <div className="flex flex-col gap-0.5 mt-auto">
                        {slotCount !== undefined ? (
                          slotCount > 0 ? (
                            <span className="inline-flex w-fit items-center rounded-md border border-green-400/25 bg-green-400/15 px-2 py-1 text-[8px] sm:text-[10px] font-extrabold leading-none text-green-300">
                              {slotCount} cupo{slotCount!==1?"s":""}
                            </span>
                          ) : (
                            <span className="text-[8px] sm:text-[9px] text-white/25 leading-none">Sin cupos</span>
                          )
                        ) : (
                          <span className="inline-flex w-fit items-center rounded-md border border-green-400/20 bg-green-400/10 px-2 py-1 text-[8px] sm:text-[9px] font-bold leading-none text-green-300">Cupos</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-white/45 font-roboto">Selecciona un día en la vista de <button type="button" onClick={() => setCalView("mes")} className="text-[#ff7a00] font-semibold underline-offset-2 hover:underline">Mes</button> para ver horarios.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4 pt-3 border-t border-white/10">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50"><span className="h-2 w-2 rounded-full bg-green-400"/>Con cupos</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50"><span className="h-2 w-2 rounded-full bg-yellow-400"/>Festivo</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50"><span className="h-2 w-2 rounded-full bg-white/25"/>No disponible</span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-white/50"><span className="h-2 w-2 rounded-full" style={{ backgroundColor:ORANGE }}/>Seleccionado</span>
        </div>
      </div>

      {/* ═══ BOOKING FLOW ═════════════════════════════════════════ */}
      <div id="booking-flow" className="mt-4 grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className={`rounded-2xl border bg-[#141414] overflow-hidden transition-all ${selectedDate ? "border-[#ff7a00]/30" : "border-white/10 opacity-80"}`}
            style={{ boxShadow:"0 18px 55px rgba(0,0,0,0.26)" }}
          >
            <div className="flex" style={{ borderLeft:"4px solid #ff7a00" }}>
              <div className="flex-1 px-5 py-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor:"rgba(255,122,0,0.14)", color:"#ff7a00" }}>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                        <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
                      </svg>
                    </span>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[#ff7a00] font-roboto">Paso 1 · Fecha</p>
                      <p className="text-sm font-bold text-white font-poppins capitalize">
                        {selectedDateIso ? fmtDateLong(selectedDateIso).replace(/^./, (c) => c.toUpperCase()) : "Selecciona una fecha en el calendario"}
                      </p>
                      {selectedDateIso && !slotsLoading && availableCount > 0 && (
                        <p className="text-xs text-green-400 font-roboto mt-0.5">{availableCount} horario{availableCount!==1?"s":""} disponibles</p>
                      )}
                      {selectedDateIso && slotsLoading && <p className="text-xs text-white/40 font-roboto mt-0.5">Consultando disponibilidad...</p>}
                    </div>
                  </div>
                  {selectedDate && (
                    <button type="button"
                      onClick={() => { setSelectedDate(null); setSelectedCourse(""); setSelectedTime(null); }}
                      className="text-xs text-white/45 hover:text-white font-roboto underline underline-offset-2 transition-colors shrink-0">
                      Cambiar fecha
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border bg-[#141414] p-5 sm:p-6 transition-all ${selectedDate ? "border-[#ff7a00]/25" : "border-white/10 opacity-55"}`}
            style={{ boxShadow:"0 18px 55px rgba(0,0,0,0.22)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0" style={{ backgroundColor:selectedCourse ? ORANGE : selectedDate ? ORANGE : "rgba(255,255,255,0.12)" }}>
                {selectedCourse ? "✓" : 2}
              </span>
              <div>
                <p className="text-sm font-bold text-white font-poppins">Elegir instrumento</p>
                <p className="text-xs text-white/40 font-roboto">{selectedDate ? "Selecciona la clase que quieres tomar." : "Primero selecciona una fecha."}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {courses.map(c => (
                <button key={c} type="button" disabled={!selectedDate}
                  onClick={() => { setSelectedCourse(c); setSelectedTime(null); setRaceError(null); }}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold transition-all font-roboto disabled:cursor-not-allowed"
                  style={
                    selectedCourse===c
                      ? { backgroundColor:ORANGE, color:"#fff", boxShadow:"0 0 16px rgba(255,122,0,0.28)" }
                      : selectedDate
                        ? { backgroundColor:"rgba(255,255,255,0.05)", color:"rgba(255,255,255,0.76)", border:"1px solid rgba(255,255,255,0.12)" }
                        : { backgroundColor:"rgba(255,255,255,0.035)", color:"rgba(255,255,255,0.32)", border:"1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className={`rounded-2xl border bg-[#141414] p-5 sm:p-6 transition-all ${selectedCourse ? "border-[#ff7a00]/25" : "border-white/10 opacity-55"}`}
            style={{ boxShadow:"0 18px 55px rgba(0,0,0,0.22)" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white shrink-0" style={{ backgroundColor:selectedTime ? ORANGE : selectedCourse ? ORANGE : "rgba(255,255,255,0.12)" }}>
                {selectedTime ? "✓" : 3}
              </span>
              <div>
                <p className="text-sm font-bold text-white font-poppins">
                  Horarios disponibles
                  {slotsLoading && <span className="ml-2 inline-block h-3 w-3 border-2 border-[#ff7a00]/30 border-t-[#ff7a00] rounded-full animate-spin align-middle"/>}
                </p>
                <p className="text-xs text-white/40 font-roboto">{selectedCourse ? "Elige uno de los cupos disponibles." : "Primero selecciona un instrumento."}</p>
              </div>
            </div>

            {raceError && (
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-400/10 border border-amber-300/25 px-3 py-2.5">
                <svg className="h-4 w-4 text-amber-300 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <p className="text-amber-100 text-xs font-roboto">{raceError}</p>
              </div>
            )}

            {!selectedCourse ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-5 text-sm text-white/35 font-roboto">Primero selecciona un instrumento.</div>
            ) : slotsLoading ? (
              <div className="flex flex-wrap gap-3">
                {[...Array(5)].map((_,i) => <div key={i} className="h-12 w-24 rounded-lg bg-white/10 animate-pulse"/>)}
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="rounded-xl bg-white/[0.035] border border-white/10 px-4 py-5 text-center">
                <p className="text-white/45 text-sm font-roboto">No hay horarios disponibles para este día.</p>
                <p className="text-white/25 text-xs mt-1 font-roboto">Prueba con otro día.</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {timeSlots.map(ts => (
                  <button key={ts.time} type="button" disabled={!ts.available}
                    onClick={() => { setSelectedTime(ts.time); setRaceError(null); }}
                    className={`px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 font-roboto ${
                      !ts.available
                        ? "cursor-not-allowed opacity-45"
                        : selectedTime===ts.time
                        ? ""
                        : "hover:border-orange-300 hover:text-white"
                    }`}
                    style={
                      !ts.available
                        ? { backgroundColor:"rgba(255,255,255,0.035)", color:"rgba(255,255,255,0.25)", border:"1px solid rgba(255,255,255,0.08)", textDecoration:"line-through" }
                        : selectedTime===ts.time
                        ? { backgroundColor:ORANGE, color:"#fff", boxShadow:"0 4px 20px rgba(255,122,0,0.4), 0 2px 8px rgba(255,122,0,0.2)" }
                        : { backgroundColor:"rgba(34,197,94,0.12)", color:"#86efac", border:"1px solid rgba(134,239,172,0.22)" }
                    }
                    title={!ts.available ? "Horario no disponible" : ts.label}
                  >
                    {ts.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-[100px]">
          <div className="rounded-2xl border border-[#ff7a00]/45 bg-[linear-gradient(135deg,rgba(255,122,0,0.18),rgba(20,20,20,0.96)_45%)] overflow-hidden"
            style={{ boxShadow:"0 22px 70px rgba(0,0,0,0.34), inset 4px 0 0 #ff7a00" }}>
            <div className="p-6">
              <p className="mb-5 text-sm font-extrabold text-white uppercase tracking-widest font-poppins">Tu reserva</p>
              <div className="space-y-5">
                {[
                  { icon:"calendar", label:"Fecha", value: selectedDateIso ? fmtDateLong(selectedDateIso).replace(/^./, (c:string) => c.toUpperCase()) : "Aún no seleccionado" },
                  { icon:"music", label:"Instrumento", value: selectedCourse || "Aún no seleccionado" },
                  { icon:"clock", label:"Hora", value: selectedTimeLabel || "Aún no seleccionado" },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#ff7a00] bg-white/8">
                      {item.icon === "calendar" && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>}
                      {item.icon === "music" && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>}
                      {item.icon === "clock" && <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
                    </span>
                    <span>
                      <span className="block text-[10px] uppercase tracking-wider text-white/35 font-roboto">{item.label}</span>
                      <span className={`block text-sm font-bold font-roboto ${item.value.includes("Aún") ? "text-white/50" : "text-white"}`}>{item.value}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#141414] p-5"
            style={{ boxShadow:"0 18px 55px rgba(0,0,0,0.24)" }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor:canSubmit ? ORANGE : "rgba(255,255,255,0.12)" }}>4</span>
              <div>
                <p className="text-sm font-bold text-white font-poppins">Confirmar reserva</p>
                <p className="text-xs text-white/40 font-roboto">{canSubmit ? "Todo listo para confirmar." : "Completa los pasos anteriores."}</p>
              </div>
            </div>

            {state.status==="error" && !(state as any).isRaceCondition && (
              <p className="mb-3 text-red-200 text-xs bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2 font-roboto">{state.message}</p>
            )}

            {isLoggedIn ? (
              <button type="submit" disabled={isPending || !canSubmit}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold font-poppins transition-all duration-200 disabled:cursor-not-allowed enabled:hover:brightness-110 enabled:hover:scale-[1.01]"
                style={canSubmit
                  ? { backgroundColor:ORANGE, color:"#fff", boxShadow:"0 4px 24px rgba(255,122,0,0.42), 0 2px 8px rgba(255,122,0,0.2)" }
                  : { backgroundColor:"rgba(255,122,0,0.28)", color:"rgba(255,255,255,0.42)", boxShadow:"none" }}>
                {isPending ? "Confirmando..." : canSubmit ? "Confirmar reserva" : "Completa los pasos anteriores"}
              </button>
            ) : (
              <a href="/mi-cuenta/login?next=/agendar"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-bold text-white font-poppins transition-all duration-200 hover:brightness-110 hover:scale-[1.01]"
                style={{ backgroundColor:ORANGE, boxShadow:"0 4px 24px rgba(255,122,0,0.4), 0 2px 8px rgba(255,122,0,0.2)" }}>
                Iniciar sesión para agendar
              </a>
            )}

            <p className="mt-5 text-center text-xs text-white/35 font-roboto">o también puedes reservar por WhatsApp</p>
            <a href={buildWALink(selectedCourse||"música", selectedDate, selectedTimeLabel)}
              target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-green-400 bg-transparent border border-green-500/35 hover:border-green-400/60 hover:bg-green-500/10 transition-colors font-roboto">
              <WaIcon className="h-4 w-4 shrink-0 text-green-500"/> WhatsApp
            </a>
          </div>
        </aside>
      </div>

      {/* ═══ CLASS INFO ════════════════════════════════════════════ */}
      <div className="mt-4">
        {classInfoSection}
      </div>

      {/* Mobile sticky CTA */}
      {isLoggedIn && canSubmit && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-white via-white/95 to-transparent lg:hidden">
          <button type="submit" disabled={isPending}
            className="w-full rounded-xl py-4 text-base font-bold text-white font-poppins shadow-lg transition-all duration-200 disabled:opacity-60 enabled:hover:brightness-110 enabled:hover:scale-[1.02]"
            style={{ backgroundColor:ORANGE, boxShadow:"0 4px 24px rgba(255,122,0,0.4)" }}>
            {isPending ? "Confirmando…" : `Confirmar — ${fmtDateLong(selectedDateIso!)} ${selectedTimeLabel}`}
          </button>
        </div>
      )}
    </form>
  );
}
