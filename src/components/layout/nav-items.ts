// Icon names are strings so this data can safely cross the server→client boundary.
// The Sidebar client component resolves names to actual Lucide components.

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Invitations", href: "/admin/invitations", icon: "Mail" },
  { label: "Courses", href: "/admin/courses", icon: "BookOpen" },
  { label: "Enrollments", href: "/admin/enrollments", icon: "GraduationCap" },
  { label: "Audit Log", href: "/admin/audit", icon: "ClipboardList" },
  { label: "Profile", href: "/profile", icon: "UserCircle" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const instructorNav: NavItem[] = [
  { label: "Dashboard", href: "/instructor", icon: "LayoutDashboard" },
  { label: "My Courses", href: "/instructor/courses", icon: "BookOpen" },
  { label: "Analytics", href: "/instructor/analytics", icon: "BarChart3" },
  { label: "Profile", href: "/profile", icon: "UserCircle" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: "LayoutDashboard" },
  { label: "My Courses", href: "/student/courses", icon: "BookOpen" },
  { label: "Certificates", href: "/student/certificates", icon: "Award" },
  { label: "Profile", href: "/profile", icon: "UserCircle" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];
