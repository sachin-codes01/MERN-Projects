// "2025-10-16" → "16 Oct 2025" (notification messages ke liye)
export const formatDate = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
