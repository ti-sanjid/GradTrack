import React from 'react';
import {
  CalendarClock,
  ClipboardCheck,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileWarning,
  RotateCcw,
  Table2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { WorkspaceView } from '../types/application';

interface SidebarProps {
  activeView: WorkspaceView;
  onSelectView: (view: WorkspaceView) => void;
  totalPrograms: number;
  urgentDeadlines: number;
  incompletePrograms: number;
  outreachActiveCount: number;
  onImportCsv: (file: File) => void;
  onExportCsv: () => void;
  onResetOriginal: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onSelectView,
  totalPrograms,
  urgentDeadlines,
  incompletePrograms,
  outreachActiveCount,
  onImportCsv,
  onExportCsv,
  onResetOriginal,
  mobileOpen,
  onCloseMobile,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const navItems: {
    id: WorkspaceView;
    label: string;
    icon: React.ReactNode;
    count?: string;
    emphasis?: boolean;
  }[] = [
    {
      id: 'master',
      label: 'Master Sheet',
      icon: <Table2 className="h-4 w-4 shrink-0" />,
      count: String(totalPrograms),
    },
    {
      id: 'audit',
      label: 'Fill Missing Info',
      icon: <FileWarning className="h-4 w-4 shrink-0" />,
      count: incompletePrograms > 0 ? String(incompletePrograms) : 'Done',
      emphasis: incompletePrograms > 0,
    },
    {
      id: 'deadlines',
      label: 'Deadlines',
      icon: <CalendarClock className="h-4 w-4 shrink-0" />,
      count: urgentDeadlines > 0 ? `${urgentDeadlines} soon` : undefined,
    },
    {
      id: 'materials',
      label: 'Materials & LORs',
      icon: <ClipboardCheck className="h-4 w-4 shrink-0" />,
    },
    {
      id: 'outreach',
      label: 'Faculty Outreach',
      icon: <Users className="h-4 w-4 shrink-0" />,
      count: String(outreachActiveCount),
    },
    {
      id: 'funding',
      label: 'Funding & Fees',
      icon: <DollarSign className="h-4 w-4 shrink-0" />,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportCsv(file);
      e.target.value = '';
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-[#F3F5F8] border-r border-[#E2E6EC]">
      {/* Brand Zone: clean single-element wordmark */}
      <div className="flex h-14 items-center justify-between px-5 border-b border-[#E2E6EC]">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileSpreadsheet className="h-4 w-4 text-[#1D4ED8] shrink-0" />
          <span className="font-display text-[15px] font-bold tracking-tight text-[#0F172A] whitespace-nowrap">
            GradTrack
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="lg:hidden p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-md"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Primary Workspace Views */}
      <nav aria-label="Workspace views" className="flex-1 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-2 text-[11px] font-medium text-[#64748B]">
          2026–2027 Admissions Cycle
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 text-[13.5px] rounded-md transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8] ${
                    isActive
                      ? 'bg-white text-[#0F172A] font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                      : 'text-[#475569] hover:bg-white/60 hover:text-[#0F172A] font-medium'
                  }`}
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className={isActive ? 'text-[#1D4ED8]' : 'text-[#64748B]'}>
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.count && (
                    <span
                      className={`font-mono text-[11.5px] tabular-nums shrink-0 ${
                        item.emphasis
                          ? 'text-[#B45309] font-medium'
                          : isActive
                          ? 'text-[#1D4ED8]'
                          : 'text-[#64748B]'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spreadsheet File Actions */}
      <div className="border-t border-[#E2E6EC] px-3 py-3 space-y-1">
        <p className="px-2.5 pb-1 text-[11px] font-medium text-[#64748B]">Spreadsheet File</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-[#334155] hover:bg-white/70 hover:text-[#0F172A] rounded-md transition-colors whitespace-nowrap"
        >
          <Upload className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
          <span>Import CSV</span>
        </button>
        <button
          type="button"
          onClick={onExportCsv}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-[#334155] hover:bg-white/70 hover:text-[#0F172A] rounded-md transition-colors whitespace-nowrap"
        >
          <Download className="h-3.5 w-3.5 text-[#64748B] shrink-0" />
          <span>Export CSV</span>
        </button>
        <button
          type="button"
          onClick={onResetOriginal}
          className="w-full flex items-center gap-2.5 px-2.5 py-2 text-[13px] font-medium text-[#64748B] hover:bg-white/70 hover:text-[#B91C1C] rounded-md transition-colors whitespace-nowrap"
        >
          <RotateCcw className="h-3.5 w-3.5 shrink-0" />
          <span>Reload Original Sheet</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[248px] shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#0F172A]/35 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-[264px] max-w-[82vw] h-full">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
};
