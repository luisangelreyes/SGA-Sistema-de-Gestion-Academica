import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import {
  LayoutDashboard, Users, UserSquare2, CreditCard, LogOut, Settings,
  BookOpen, Layers, Shield, ClipboardList, GraduationCap, Award, UserCheck,
} from 'lucide-react';

// ─── Mapa legible de roles ────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  ADMIN:           'Administrador',
  GESTOR:          'Gestión Administrativa',
  CONTROL_ESCOLAR: 'Control Escolar',
};

// ─── Ítems de navegación por sección ─────────────────────────────────────────
const NAV_PRINCIPAL = [
  { to: '/', icon: LayoutDashboard, label: 'Panel Principal', modulo: null },
];

const NAV_ADMINISTRACION = [
  { to: '/alumnos',  icon: Users,        label: 'Alumnos',             modulo: 'Alumnos' },
  { to: '/tutores',  icon: UserSquare2,  label: 'Tutores',             modulo: 'Tutores' },
  { to: '/pagos',    icon: CreditCard,   label: 'Cobro Rápido',        modulo: 'Pagos' },
  { to: '/becas',    icon: Award,        label: 'Becas y Promociones', modulo: 'Becas' },
];

const NAV_CONTROL_ESCOLAR = [
  { to: '/alumnos',        icon: Users,          label: 'Expedientes',    modulo: 'Alumnos' },
  { to: '/docentes',       icon: UserCheck,      label: 'Docentes',       modulo: 'Grupos' },
  { to: '/grupos',         icon: Layers,         label: 'Grupos',         modulo: 'Grupos' },
  { to: '/materias',       icon: BookOpen,       label: 'Materias',       modulo: 'Materias' },
  { to: '/calificaciones', icon: GraduationCap,  label: 'Calificaciones', modulo: 'Calificaciones' },
  { to: '/boletas',        icon: ClipboardList,  label: 'Boletas',        modulo: 'Boletas' },
];

const NAV_SISTEMA = [
  { to: '/configuracion', icon: Settings, label: 'Ajustes Generales',   modulo: 'Configuracion' },
  { to: '/usuarios',      icon: Shield,   label: 'Usuarios y Permisos', modulo: 'Usuarios' },
];

// ─────────────────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
  };

  const roleCode = user?.role || user?.roles?.[0] || '';
  const roleLabel = ROLE_LABELS[roleCode] ?? roleCode;

  const hasPermiso = (modulo: string | null) => {
    if (modulo === null) return true;
    if (roleCode === 'ADMIN') return true;
    if (!user?.permisosModulos) return false;
    const p = user.permisosModulos.find((m: any) => m.modulo === modulo);
    return p && p.nivel !== 'DENEGADO';
  };

  const showAdminSection   = (roleCode === 'ADMIN' || roleCode === 'GESTOR') && NAV_ADMINISTRACION.some(i => hasPermiso(i.modulo));
  const showEscolarSection = (roleCode === 'ADMIN' || roleCode === 'CONTROL_ESCOLAR') && NAV_CONTROL_ESCOLAR.some(i => hasPermiso(i.modulo));
  const showSistemaSection = (roleCode === 'ADMIN' || roleCode === 'GESTOR') && NAV_SISTEMA.some(i => hasPermiso(i.modulo));

  const NavItem = ({ item }: { item: { to: string; icon: React.ElementType; label: string; modulo: string | null } }) => (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
          isActive ? 'bg-blue-600/10 text-blue-400' : 'hover:bg-slate-800/50 hover:text-white'
        }`
      }
    >
      <item.icon size={20} strokeWidth={2.5} />
      {item.label}
    </NavLink>
  );

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 mt-6 px-2">
      {label}
    </div>
  );

  return (
    <aside className="w-64 bg-[#001429] text-slate-300 flex flex-col transition-all duration-300 relative z-20 shadow-xl h-full">
      {/* Logo */}
      <div className="p-6 pb-2 border-b border-slate-700/50 flex items-center gap-5">
        <div className="w-16 h-16 shrink-0 bg-white rounded-2xl p-2 shadow-sm flex items-center justify-center overflow-hidden">
          <img src="/logo.png" alt="SGA Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col justify-center">
          <h1 className="text-white font-bold text-lg tracking-wide">SGA</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">Colegio San Diego</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1 custom-scrollbar">

        {/* Siempre visible */}
        {NAV_PRINCIPAL.map(item => <NavItem key={item.to} item={item} />)}

        {/* Sección: Administración (GESTOR / ADMIN) */}
        {showAdminSection && (
          <>
            <SectionLabel label="Administración" />
            {NAV_ADMINISTRACION.filter(i => hasPermiso(i.modulo)).map(item => (
              <NavItem key={item.to + item.label} item={item} />
            ))}
          </>
        )}

        {/* Sección: Control Escolar (CONTROL_ESCOLAR / ADMIN) */}
        {showEscolarSection && (
          <>
            <SectionLabel label="Control Escolar" />
            {NAV_CONTROL_ESCOLAR.filter(i => hasPermiso(i.modulo)).map(item => (
              <NavItem key={item.to + item.label} item={item} />
            ))}
          </>
        )}

        {/* Sección: Sistema (ADMIN y GESTOR) */}
        {showSistemaSection && (
          <>
            <SectionLabel label="Sistema" />
            {NAV_SISTEMA.filter(i => hasPermiso(i.modulo) && (i.modulo !== 'Usuarios' || roleCode === 'ADMIN')).map(item => (
              <NavItem key={item.to} item={item} />
            ))}
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-[#000f20]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-inner">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-bold text-white truncate w-32">{user?.name || 'Usuario'}</span>
              <span className="text-xs font-medium text-slate-400">{roleLabel}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut size={18} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </aside>
  );
}
