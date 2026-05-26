

export type WorkingHourInput = {
  dayOfWeek: string
  startTime: string
  endTime: string
  isOpen: boolean
}

// lib/working-hours.ts
export type WeekDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'

export const WEEK_DAYS_ORDER: WeekDay[] = [
  'MONDAY',
  'TUESDAY', 
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
  MONDAY: 'Segunda-feira',
  TUESDAY: 'Terça-feira',
  WEDNESDAY: 'Quarta-feira',
  THURSDAY: 'Quinta-feira',
  FRIDAY: 'Sexta-feira',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

export const DEFAULT_WORKING_HOURS: WorkingHourInput[] = WEEK_DAYS_ORDER.map(
  (day) => ({
    dayOfWeek: day as string,
    startTime: '09:00',
    endTime: '22:00',
    isOpen: day !== 'SUNDAY',
  })
)

export function normalizeWorkingHours(
  hours: WorkingHourInput[]
): WorkingHourInput[] {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]))

  return WEEK_DAYS_ORDER.map((day) => {
    const row = byDay.get(day)
    return {
      dayOfWeek: day as string,
      startTime: row?.startTime?.trim() || '09:00',
      endTime: row?.endTime?.trim() || '22:00',
      isOpen: row?.isOpen ?? true,
    }
  })
}

export function mergeWithDefaults(
  existing: {
    dayOfWeek: string
    startTime: string
    endTime: string
    isOpen: boolean
  }[]
): WorkingHourInput[] {
  if (existing.length === 0) return DEFAULT_WORKING_HOURS
  return normalizeWorkingHours(existing)
}

export async function seedDefaultWorkingHours(
  restaurantId: string
) {
  // Use API to create default working hours
  const fetcher = (await import('./api/api_server_backend')).fetcher
  
  const workingHoursData = DEFAULT_WORKING_HOURS.map(h => ({
    restaurantId,
    dayOfWeek: h.dayOfWeek,
    startTime: h.startTime,
    endTime: h.endTime,
    isOpen: h.isOpen,
  }))

  // Since we don't have a bulk create endpoint, we'll create each individually
  // In a real implementation, you'd want to add a bulk endpoint
  for (const hourData of workingHoursData) {
    try {
      await fetcher('/api/restaurants/working-hours', {
        method: 'POST',
        body: JSON.stringify(hourData),
      })
    } catch (error) {
      console.error('Error creating working hour:', error)
      // Continue with other hours even if one fails
    }
  }
}

export function canManageRestaurant(
  user: { role: string; restaurantId?: string | null },
  restaurantId: string
): boolean {
  if (user.role === 'ADMIN') return true
  if (user.role === 'RESTAURANT' && user.restaurantId === restaurantId) {
    return true
  }
  return false
}
