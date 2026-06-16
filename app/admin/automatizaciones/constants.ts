import type { AutomationJobType, AutomationCategory } from '@/app/admin/_actions/automations'

export const JOB_CATEGORY: Record<AutomationJobType, AutomationCategory> = {
  class_reminder_24h:   'clases',
  class_reminder_2h:    'clases',
  payment_due_tomorrow: 'pagos',
  payment_overdue_3d:   'pagos',
  payment_overdue_7d:   'pagos',
  attendance_risk:      'retencion',
  low_attendance_risk:  'retencion',
  high_risk_student:    'retencion',
}
