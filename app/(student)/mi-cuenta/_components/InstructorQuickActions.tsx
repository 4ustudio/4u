'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { OPEN_SCHEDULE_EVENT, type ScheduleModalTab } from './scheduleEvents'
import { createInstructorClassAction } from '../../_actions/student'

type Student = { id: string; name: string; phone: string | null }
type Course = { id: string; name: string }
type Classroom = { id: string; name: string }
type Modal = 'classes' | 'students' | null

const cards: Array<{ title: string; text: string; icon: string; tab?: ScheduleModalTab; modal?: Exclude<Modal, null> }> = [
  { title: 'Gestionar horarios', text: 'Configura tu disponibilidad', icon: 'calendar', tab: 'horarios' },
  { title: 'Gestionar clases', text: 'Crea y organiza tus clases', icon: 'briefcase', modal: 'classes' },
  { title: 'Bloquear fechas', text: 'Indica fechas no disponibles', icon: 'lock', tab: 'bloqueos' },
  { title: 'Mis alumnos', text: 'Ver y asignar clases', icon: 'users', modal: 'students' },
]

function Icon({ name }: { name: string }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, className: 'h-5 w-5' }
  if (name === 'calendar') return <svg {...common}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
  if (name === 'briefcase') return <svg {...common}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
  if (name === 'lock') return <svg {...common}><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
  return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}

export default function InstructorQuickActions({ initialData }: { initialData?: { students?: Student[]; courses?: Course[]; classrooms?: Classroom[] } }) {
  const [modal, setModal] = useState<Modal>(null)
  const students = initialData?.students ?? []
  const courses = initialData?.courses ?? []
  const classrooms = initialData?.classrooms ?? []
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setLoaded(true) }, [])
  function open(card: typeof cards[number]) {
    if (card.tab) window.dispatchEvent(new CustomEvent(OPEN_SCHEDULE_EVENT, { detail: { tab: card.tab } }))
    if (card.modal) setModal(card.modal)
  }
  function close() { setModal(null); setSelectedStudent(null) }

  return <>
    <div>
      <h2 className="mb-3 font-poppins text-base font-extrabold text-gray-950">Acciones rápidas</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => <button key={card.title} type="button" onClick={() => open(card)} className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm hover:border-[#ff7a00]/30 hover:shadow-md transition-all">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-100 text-[#ff7a00]"><Icon name={card.icon}/></span>
          <span><span className="block font-poppins font-extrabold text-gray-950">{card.title}</span><span className="block text-sm text-gray-600">{card.text}</span></span>
        </button>)}
      </div>
    </div>
    {loaded && modal && createPortal(<Dialog onClose={close}>
      {modal === 'students' && <StudentsModal students={students} onClose={close} onAssign={student => { setSelectedStudent(student); setModal('classes') }}/>} 
      {modal === 'classes' && <ClassModal students={students} courses={courses} classrooms={classrooms} selectedStudent={selectedStudent} onClose={close}/>} 
    </Dialog>, document.body)}
  </>
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>{children}</div></div>
}

function Header({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return <div className="flex items-start justify-between border-b border-gray-100 px-6 py-4"><div><h2 className="font-poppins text-xl font-extrabold text-gray-950">{title}</h2><p className="mt-0.5 text-sm text-gray-500">{subtitle}</p></div><button type="button" aria-label="Cerrar" onClick={onClose} className="text-2xl leading-none text-gray-400 hover:text-gray-700">×</button></div>
}

function StudentsModal({ students, onClose, onAssign }: { students: Student[]; onClose: () => void; onAssign: (student: Student) => void }) {
  const [query, setQuery] = useState('')
  const visible = useMemo(() => students.filter(student => student.name.toLowerCase().includes(query.toLowerCase())), [students, query])
  return <><Header title="Alumnos inscritos" subtitle="Selecciona un alumno para asignarle una clase." onClose={onClose}/><div className="p-6"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar alumno" className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#ff7a00]" autoFocus/>
    <div className="mt-3 space-y-2">{visible.map(student => <div key={student.id} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-xs font-bold text-[#ff7a00]">{student.name[0]?.toUpperCase()}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold text-gray-900">{student.name}</span></span><button type="button" onClick={() => onAssign(student)} className="rounded-lg bg-[#ff7a00] px-3 py-2 text-xs font-bold text-white hover:bg-orange-600">Asignar clase</button></div>)}{!visible.length && <p className="py-6 text-center text-sm text-gray-400">No hay alumnos inscritos.</p>}</div></div></>
}

function ClassModal({ students, courses, classrooms, selectedStudent, onClose }: { students: Student[]; courses: Course[]; classrooms: Classroom[]; selectedStudent: Student | null; onClose: () => void }) {
  const [student, setStudent] = useState<Student | null>(selectedStudent)
  const [course, setCourse] = useState<Course | null>(null)
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState<{ id: string; name: string } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const times = Array.from({ length: 14 }, (_, hour) => ({ id: `${String(hour + 8).padStart(2, '0')}:00`, name: `${String(hour + 8).padStart(2, '0')}:00` }))
  function submit() { if (!student || !course || !classroom || !date || !time) { setError('Completa alumno, curso, salón, fecha y hora.'); return }; setError(null); startTransition(async () => { const result = await createInstructorClassAction({ studentId: student.id, courseId: course.id, classroomId: classroom.id, date, time: time.id }); if (result.error) { setError(result.error); return }; onClose() }) }
  return <><Header title="Gestionar clases" subtitle="Crea una clase para uno de los alumnos inscritos." onClose={onClose}/><div className="space-y-4 p-6"><Picker<Student> label="Alumno" value={student?.name ?? 'Selecciona un alumno'} options={students} onPick={setStudent}/><Picker<Course> label="Curso" value={course?.name ?? 'Selecciona un curso'} options={courses} onPick={setCourse}/><Picker<Classroom> label="Salón" value={classroom?.name ?? 'Selecciona un salón'} options={classrooms} onPick={setClassroom}/><div className="grid grid-cols-2 gap-3"><label className="text-sm font-semibold text-gray-700">Fecha<input type="date" min={new Date().toISOString().slice(0, 10)} value={date} onChange={e => setDate(e.target.value)} className="mt-1 block w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#ff7a00]"/></label><Picker label="Hora" value={time?.name ?? 'Selecciona una hora'} options={times} onPick={setTime}/></div>{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}<button type="button" disabled={pending} onClick={submit} className="w-full rounded-xl bg-[#ff7a00] py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-50">{pending ? 'Creando…' : 'Crear clase'}</button></div></>
}

function Picker<T extends { id: string; name: string }>({ label, value, options, onPick }: { label: string; value: string; options: T[]; onPick: (value: T) => void }) {
  const [open, setOpen] = useState(false)
  return <div className="relative"><p className="mb-1 text-sm font-semibold text-gray-700">{label}</p><button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-700"><span>{value}</span><span>⌄</span></button>{open && <div className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-lg">{options.map(option => <button key={option.id} type="button" onClick={() => { onPick(option); setOpen(false) }} className="block w-full rounded-lg bg-white px-3 py-2 text-left text-sm text-gray-900 hover:bg-orange-50">{option.name}</button>)}</div>}</div>
}
