import { getStudentsDashboard } from '../_actions/students'
import StudentsClient from './StudentsClient'
import type { StudentListRow, StudentsKpis } from '../_actions/students'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  let students: StudentListRow[] = []
  let kpis: StudentsKpis = {
    total: 0, active: 0, activePct: 0, newThisMonth: 0, newThisMonthPct: 0,
    classesThisWeek: 0, classesToday: 0, upcoming7d: 0, activeInstructors: 0, avgAttendance30d: null,
  }
  try {
    const data = await getStudentsDashboard()
    students = data.students
    kpis = data.kpis
  } catch { /* deja los valores por defecto */ }

  return <StudentsClient initialStudents={students} kpis={kpis} />
}
