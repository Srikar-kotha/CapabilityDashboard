import { Database, ChevronLeft, ChevronRight, LogOut, User, LayoutGrid } from 'lucide-react';

type Page = 'dashboard' | 'add' | 'details' | 'trigger' | 'metrics';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
}

export default function Sidebar({ currentPage, onNavigate, collapsed, onCollapsedChange }: SidebarProps) {

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-slate-900 text-white flex flex-col transition-all duration-300 z-50 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo + Name */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700">
        <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <Database size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest leading-none">
              Enterprise
            </p>
            <p className="text-sm font-bold text-white truncate leading-tight mt-0.5">
              ETMO Capability Portal
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto">
        <div className="mb-2">
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">
              Navigation
            </p>
          )}
          <button
            onClick={() => onNavigate('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              currentPage === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutGrid size={18} className="flex-shrink-0" />
            {!collapsed && <span>ETMO Capability Portal</span>}
          </button>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-slate-700 p-3">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 cursor-pointer">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
              <User size={14} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">Operations Admin</p>
              <p className="text-xs text-slate-400 truncate">admin@company.com</p>
            </div>
            <button
              onClick={() => {}}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
              <User size={14} />
            </div>
            <button className="text-slate-400 hover:text-white transition-colors" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => onCollapsedChange(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
