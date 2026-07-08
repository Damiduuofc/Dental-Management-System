// lib/adminSession.ts
export const getAdminToken = () => {
  // Always check if window is defined to prevent SSR crashes
  if (typeof window !== 'undefined') {
    return localStorage.getItem('adminToken') || localStorage.getItem('token');
  }
  return null;
};


export const getPatientToken = () => {
  // Always check if window is defined to prevent SSR crashes
  if (typeof window !== 'undefined') {
    return localStorage.getItem('PatientToken') || localStorage.getItem('token');
  }
  return null;
}