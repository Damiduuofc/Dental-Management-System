// Shared clinic appointment slots — must stay identical across patient, staff and dentist booking flows.
export const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:30 PM', '02:30 PM', '03:30 PM'];

export const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// "01:30 PM" -> minutes since midnight, for correct chronological sorting
export const timeToMinutes = (slotStr: string): number => {
  const parts = (slotStr || '').trim().split(' ');
  if (parts.length < 2) return 0;
  let [hours, minutes] = parts[0].split(':').map(Number);
  const modifier = parts[1].toUpperCase();
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + (minutes || 0);
};

export const isSlotInPast = (selectedDateStr: string, slotStr: string): boolean => {
  if (!selectedDateStr) return false;
  const todayStr = getTodayString();
  if (selectedDateStr < todayStr) return true;
  if (selectedDateStr > todayStr) return false;

  const now = new Date();
  return timeToMinutes(slotStr) <= now.getHours() * 60 + now.getMinutes();
};

// Appointment dates are stored as UTC midnight of the booked day
export const toDateInputValue = (dateStr: string) => {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().substring(0, 10);
};
