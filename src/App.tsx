import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Menu, Plus, Undo2, X } from 'lucide-react';
import { AddProgramModal } from './components/AddProgramModal';
import { DataAuditView } from './components/DataAuditView';
import { DeadlinesView } from './components/DeadlinesView';
import { FundingView } from './components/FundingView';
import { MasterTable } from './components/MasterTable';
import { MaterialsMatrix } from './components/MaterialsMatrix';
import { OutreachView } from './components/OutreachView';
import { ProgramDrawer } from './components/ProgramDrawer';
import { Sidebar } from './components/Sidebar';
import { SummaryStrip } from './components/SummaryStrip';
import { PhdApplication, WorkspaceView } from './types/application';
import {
  ORIGINAL_CSV_URL,
  cleanTemplatePlaceholders,
  computeDaysLeft,
  exportPhdCsv,
  getApplicationIssues,
  parsePhdCsv,
} from './utils/csv';

const STORAGE_KEY = 'gradtrack_phd_applications_v1';

const VIEW_TITLES: Record<WorkspaceView, string> = {
  master: 'Master Sheet',
  audit: 'Fill Missing Info',
  deadlines: 'Deadlines',
  materials: 'Materials & LORs',
  outreach: 'Faculty Outreach',
  funding: 'Funding & Fees',
};

interface NoticeBanner {
  message: string;
  canUndo?: boolean;
}

export default function App() {
  const [applications, setApplications] = useState<PhdApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<WorkspaceView>('master');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<PhdApplication[] | null>(null);
  const [notice, setNotice] = useState<NoticeBanner | null>(null);

  const loadOriginalSpreadsheet = useCallback(async (saveUndo = false) => {
    setLoading(true);
    setLoadError(null);
    try {
      const response = await fetch(ORIGINAL_CSV_URL);
      if (!response.ok) {
        throw new Error(`Could not load spreadsheet file (${response.status})`);
      }
      const csvText = await response.text();
      const parsed = parsePhdCsv(csvText);
      if (saveUndo) {
        setApplications((prev) => {
          setUndoSnapshot(prev);
          return parsed;
        });
        setNotice({ message: `Reloaded original spreadsheet (${parsed.length} universities).`, canUndo: true });
      } else {
        setApplications(parsed);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : 'Unable to read the attached spreadsheet file.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load: restore saved edits from localStorage, or parse the user's attached CSV
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PhdApplication[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setApplications(parsed);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall back to loading original CSV
    }
    loadOriginalSpreadsheet(false);
  }, [loadOriginalSpreadsheet]);

  // Persist changes locally whenever applications update (after initial load)
  useEffect(() => {
    if (!loading && !loadError) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(applications));
      } catch {
        // Ignore storage quota errors
      }
    }
  }, [applications, loading, loadError]);

  const handleUpdate = useCallback((id: string, patch: Partial<PhdApplication>) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, ...patch } : app))
    );
  }, []);

  const handleAddProgram = useCallback((newProgram: PhdApplication) => {
    setApplications((prev) => [newProgram, ...prev]);
    setSelectedId(newProgram.id);
    setNotice({ message: `Added ${newProgram.university} to your tracker.` });
  }, []);

  const handleDeleteProgram = useCallback((id: string) => {
    setApplications((prev) => {
      const target = prev.find((p) => p.id === id);
      setUndoSnapshot(prev);
      if (target) {
        setNotice({ message: `Removed ${target.university}.`, canUndo: true });
      }
      return prev.filter((p) => p.id !== id);
    });
    setSelectedId(null);
  }, []);

  const handleCleanAllTemplates = useCallback(() => {
    setApplications((prev) => {
      setUndoSnapshot(prev);
      return cleanTemplatePlaceholders(prev);
    });
    setNotice({
      message:
        'Cleared template placeholders (a, TBA, 0, and mismatched template portals/links). Real entries were preserved.',
      canUndo: true,
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (!undoSnapshot) return;
    setApplications(undoSnapshot);
    setUndoSnapshot(null);
    setNotice({ message: 'Previous state restored.' });
  }, [undoSnapshot]);

  const handleExportCsv = useCallback(() => {
    const csvContent = exportPhdCsv(applications);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phd_application_tracker_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setNotice({ message: `Exported ${applications.length} universities to CSV.` });
  }, [applications]);

  const handleImportCsv = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parsePhdCsv(text);
      if (parsed.length === 0) {
        setNotice({
          message: 'No universities found in that CSV. Make sure it has a "University" header column.',
        });
        return;
      }
      setApplications((prev) => {
        setUndoSnapshot(prev);
        return parsed;
      });
      setSelectedId(null);
      setNotice({
        message: `Imported ${parsed.length} universities from ${file.name}.`,
        canUndo: true,
      });
    };
    reader.readAsText(file);
  }, []);

  const selectedIndex = useMemo(
    () => (selectedId ? applications.findIndex((a) => a.id === selectedId) : -1),
    [applications, selectedId]
  );

  const selectedProgram = selectedIndex >= 0 ? applications[selectedIndex] : null;

  const handleNavigateDrawer = useCallback(
    (direction: 'prev' | 'next') => {
      if (applications.length === 0 || selectedIndex < 0) return;
      const nextIdx =
        direction === 'next'
          ? (selectedIndex + 1) % applications.length
          : (selectedIndex - 1 + applications.length) % applications.length;
      setSelectedId(applications[nextIdx].id);
    },
    [applications, selectedIndex]
  );

  const sidebarMetrics = useMemo(() => {
    const urgentDeadlines = applications.filter((a) => {
      const d = computeDaysLeft(a.appDeadline);
      return (
        d !== null &&
        d >= 0 &&
        d <= 14 &&
        a.applicationStatus !== 'Submitted' &&
        a.applicationStatus !== 'Admitted'
      );
    }).length;

    const incompletePrograms = applications.filter(
      (a) => getApplicationIssues(a).length > 0
    ).length;

    const outreachActiveCount = applications.filter(
      (a) => a.facultyOutreach !== 'Not Contacted'
    ).length;

    return { urgentDeadlines, incompletePrograms, outreachActiveCount };
  }, [applications]);

  return (
    <div className="min-h-screen flex bg-[#F8F9FB] text-[#0F172A]">
      <Sidebar
        activeView={activeView}
        onSelectView={setActiveView}
        totalPrograms={applications.length}
        urgentDeadlines={sidebarMetrics.urgentDeadlines}
        incompletePrograms={sidebarMetrics.incompletePrograms}
        outreachActiveCount={sidebarMetrics.outreachActiveCount}
        onImportCsv={handleImportCsv}
        onExportCsv={handleExportCsv}
        onResetOriginal={() => loadOriginalSpreadsheet(true)}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract: Breadcrumb left, 2 clean single-line actions right */}
        <header className="sticky top-0 z-30 h-14 bg-white border-b border-[#E2E6EC] px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-1.5 -ml-1.5 text-[#475569] hover:text-[#0F172A] rounded-md"
            >
              <Menu className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[13.5px] min-w-0">
              <span className="text-[#64748B] truncate hidden sm:inline">
                PhD Applications 2026–27
              </span>
              <span className="text-[#CBD5E1] hidden sm:inline" aria-hidden="true">
                /
              </span>
              <h1 className="font-display font-semibold text-[#0F172A] truncate">
                {VIEW_TITLES[activeView]}
              </h1>
            </nav>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium text-[#334155] bg-white border border-[#CBD5E1] hover:bg-[#F8F9FB] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="h-3.5 w-3.5 text-[#64748B]" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[12.5px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add University</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Viewport */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1520px] w-full mx-auto space-y-5">
          {/* Action Notification / Undo Bar */}
          {notice && (
            <div
              role="status"
              className="px-4 py-2.5 bg-white border border-[#CBD5E1] rounded-md flex items-center justify-between gap-4 text-[13px] text-[#0F172A]"
            >
              <span>{notice.message}</span>
              <div className="flex items-center gap-3 shrink-0">
                {notice.canUndo && undoSnapshot && (
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#1D4ED8] hover:underline whitespace-nowrap"
                  >
                    <Undo2 className="h-3.5 w-3.5" />
                    <span>Undo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss notification"
                  className="text-[#64748B] hover:text-[#0F172A]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-5" aria-busy="true">
              <div className="h-24 bg-white border border-[#E2E6EC] rounded-lg animate-pulse" />
              <div className="h-[460px] bg-white border border-[#E2E6EC] rounded-lg animate-pulse" />
            </div>
          ) : loadError ? (
            <div className="bg-white border border-[#FECACA] rounded-lg p-8 text-center max-w-lg mx-auto my-8">
              <h2 className="font-display text-base font-semibold text-[#991B1B]">
                Unable to Load Spreadsheet
              </h2>
              <p className="mt-1.5 text-[13.5px] text-[#475569]">{loadError}</p>
              <button
                type="button"
                onClick={() => loadOriginalSpreadsheet(false)}
                className="mt-4 px-4 py-2 text-[13px] font-medium text-white bg-[#1D4ED8] hover:bg-[#1E40AF] rounded-md"
              >
                Retry Loading File
              </button>
            </div>
          ) : (
            <>
              <SummaryStrip
                applications={applications}
                onOpenAudit={() => setActiveView('audit')}
                onOpenDeadlines={() => setActiveView('deadlines')}
              />

              {activeView === 'master' && (
                <MasterTable
                  applications={applications}
                  onUpdate={handleUpdate}
                  onSelectProgram={setSelectedId}
                  onOpenAddModal={() => setAddModalOpen(true)}
                />
              )}

              {activeView === 'audit' && (
                <DataAuditView
                  applications={applications}
                  onUpdate={handleUpdate}
                  onCleanAllTemplates={handleCleanAllTemplates}
                  onSelectProgram={setSelectedId}
                />
              )}

              {activeView === 'deadlines' && (
                <DeadlinesView
                  applications={applications}
                  onUpdate={handleUpdate}
                  onSelectProgram={setSelectedId}
                />
              )}

              {activeView === 'materials' && (
                <MaterialsMatrix
                  applications={applications}
                  onUpdate={handleUpdate}
                  onSelectProgram={setSelectedId}
                />
              )}

              {activeView === 'outreach' && (
                <OutreachView
                  applications={applications}
                  onUpdate={handleUpdate}
                  onSelectProgram={setSelectedId}
                />
              )}

              {activeView === 'funding' && (
                <FundingView
                  applications={applications}
                  onUpdate={handleUpdate}
                  onSelectProgram={setSelectedId}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Full Slide-Over Program Editor Drawer */}
      <ProgramDrawer
        program={selectedProgram}
        currentIndex={selectedIndex}
        totalCount={applications.length}
        onClose={() => setSelectedId(null)}
        onNavigate={handleNavigateDrawer}
        onUpdate={handleUpdate}
        onDelete={handleDeleteProgram}
      />

      {/* Add New University Modal */}
      <AddProgramModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAddProgram}
      />
    </div>
  );
}
