import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  Activity,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Building,
  Clock,
  Lock,
  FileText,
  UserPlus,
  MessageSquare,
  Boxes,
  ClipboardList,
  CalendarDays
} from "lucide-react";

export const menuItems = [
  { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, roles: ["system_admin", "assistant"] },
  { title: "Appointments", href: "/admin/appointments", icon: CalendarDays, roles: ["system_admin", "assistant"] },
  { title: "Patients Check In", href: "/admin/check-in", icon: UserCheck, roles: ["system_admin", "assistant"] },
  { title: "Staff Directory", href: "/admin/account-creation", icon: Users, roles: ["system_admin", "assistant"] },
  { title: "Inventory", href: "/admin/inventory", icon: Boxes, roles: ["system_admin", "assistant"] },
  { title: "Billing", href: "/admin/billing", icon: CreditCard, roles: ["system_admin", "assistant"] },
  { title: "Reports", href: "/admin/reports", icon: FileText, roles: ["system_admin", "assistant"] },
  { title: "Messages", href: "/admin/messages", icon: MessageSquare, roles: ["system_admin", "assistant"] },
  { title: "Supply Request", href: "/admin/supply", icon: ClipboardList, roles: ["system_admin", "assistant"] }
];