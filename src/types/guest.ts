export interface GuestHydrationData {
  consumedMl: number
  goalMl: number
  remainingMl: number
  date: string
}

export interface GuestProfile {
  weightKg: number
  activityLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  climate: 'NORMAL' | 'HOT'
}

export interface GuestIntake {
  volumeMl: number
  source: 'SIP' | 'DOUBLE_SIP' | 'GLASS'
  timestamp: string
  timeAgo?: string
}

export interface GuestDataExport {
  hydration: GuestHydrationData | null
  profile: GuestProfile | null
  history: GuestIntake[]
  exportedAt: string
}
