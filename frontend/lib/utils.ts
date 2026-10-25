import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Doctors are always displayed as "Dr. <name>" (without doubling an existing prefix)
export function formatDoctorName(name?: string | null) {
  if (!name) return ""
  const bare = name.trim().replace(/^dr\.?\s+/i, "")
  return `Dr. ${bare}`
}
