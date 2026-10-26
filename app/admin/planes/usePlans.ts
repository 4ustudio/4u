'use client'

import { useEffect, useState } from 'react'
import { getPlans } from './_actions'
import type { PlanOption } from '@/lib/students/plans'

export function usePlans(): PlanOption[] {
  const [plans, setPlans] = useState<PlanOption[]>([])
  useEffect(() => { getPlans().then(setPlans) }, [])
  return plans
}
