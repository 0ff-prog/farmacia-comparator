import {
  LayoutDashboard,
  Table,
  BarChart3,
  Sparkles,
  Bookmark,
  Radio,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { DEFAULT_PROVIDERS } from '../../utils/analyticsMath';

export default function Sidebar({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse,
  connectionsStatus,
  savedScenariosCount = 0,
  providers: providersProp
}) {
  const PROVIDERS = providersProp || DEFAULT_PROVIDERS;
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Ejecutivo',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'matrix',
      label: 'Matriz Comparativa',
      icon: Table,
      badge: '4 Farmacias'
    },
    {
      id: 'providers',
      label: 'Análisis por Proveedor',
      icon: BarChart3,
      badge: null
    },
    {
      id: 'ims',
      label: 'Segmento IMS (Top 800)',
      icon: Sparkles,
      badge: 'Alta Rotación'
    },
    {
      id: 'scenarios',
      label: 'Gestor de Escenarios',
      icon: Bookmark,
      badge: savedScenariosCount > 0 ? String(savedScenariosCount) : null
    },
    {
      id: 'connections',
      label: 'Conexión de Farmacias',
      icon: Radio,
      badge: '1 API + 3 Users'
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 select-none z-30 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Cabecera del Sidebar */}
      <div>
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-10 min-w-[2.5rem] rounded-xl bg-gradient-to-tr from-blue-700 to-cyan-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-blue-500/20">
              P
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-sm font-black text-white truncate tracking-tight">PharmaCompare</h1>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-400">
                    B2B
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">4 Farmacias Conectadas</p>
              </div>
            )}
          </div>

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expandir barra lateral' : 'Colapsar barra lateral'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="p-3 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group text-left ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-4 h-4 min-w-[1rem] transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                  }`}
                />

                {!isCollapsed && (
                  <div className="flex-1 flex items-center justify-between overflow-hidden">
                    <span className="truncate">{item.label}</span>
                    {item.badge && (
                      <span
                        className={`ml-1 text-[10px] px-1.5 py-0.2 rounded font-mono ${
                          isActive
                            ? 'bg-blue-700 text-blue-100'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Estado Rápido de las 4 Farmacias (Inferior) */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-1">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Red de 4 Farmacias
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">En Línea</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {PROVIDERS.map((prov) => {
                const status = connectionsStatus?.[prov.id] || { status: 'simulated', label: 'Simulado' };
                const isConnected = status.status === 'connected';

                return (
                  <div
                    key={prov.id}
                    className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5"
                    title={`${prov.name}: ${status.label}`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-amber-400 animate-pulse'
                      }`}
                    />
                    <span className="text-slate-300 font-medium truncate">{prov.shortName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5" title="4 Farmacias Conectadas">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />
            <span className="text-[9px] font-mono text-slate-400 font-bold">4/4</span>
          </div>
        )}
      </div>
    </aside>
  );
}
