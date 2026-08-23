import React, { useState, useEffect } from 'react';
import { Header } from './components/common/Header';
import { JoinModal } from './components/common/JoinModal';
import { SupervisorDashboard } from './components/supervisor/SupervisorDashboard';
import { ProjectDetail } from './components/supervisor/ProjectDetail';
import { StudentDashboard } from './components/student/StudentDashboard';
import { CollectorForm } from './components/student/CollectorForm';
import { eseaStorage } from './lib/storage';
import { SurveyProject, Mission, UserProfile } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(() =>
    eseaStorage.getActiveUser()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() => eseaStorage.isOnline());
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() =>
    eseaStorage.getPendingSubmissions().length
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState<boolean>(false);

  // Navigation State
  const [activeView, setActiveView] = useState<
    | 'dashboard'
    | 'project_detail'
    | 'collector_form'
  >('dashboard');
  const [selectedProject, setSelectedProject] = useState<SurveyProject | null>(null);
  const [selectedMission, setSelectedMission] = useState<Mission | undefined>(undefined);

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = eseaStorage.subscribe(() => {
      setCurrentUser(eseaStorage.getActiveUser());
      setIsOnline(eseaStorage.isOnline());
      setPendingSyncCount(eseaStorage.getPendingSubmissions().length);

      // If storage was cleaned, make sure active project falls back safely
      const projects = eseaStorage.getProjects();
      if (selectedProject && !projects.some((p) => p.id === selectedProject.id)) {
        setSelectedProject(null);
        setSelectedMission(undefined);
        setActiveView('dashboard');
      }
    });
    return () => unsubscribe();
  }, [selectedProject]);

  const handleRoleSwitch = (role: 'supervisor' | 'student') => {
    eseaStorage.switchRole(role);
    setActiveView('dashboard');
    setSelectedProject(null);
    setSelectedMission(undefined);
  };

  const handleSyncTrigger = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await eseaStorage.syncPendingSubmissions();
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleOpenProject = (project: SurveyProject) => {
    setSelectedProject(project);
    setActiveView('project_detail');
  };

  const handleStartCollection = (project: SurveyProject, mission?: Mission) => {
    setSelectedProject(project);
    setSelectedMission(mission);
    setActiveView('collector_form');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950 transition-colors">
      {/* Top Application Header */}
      <Header
        currentUser={currentUser}
        isOnline={isOnline}
        pendingSyncCount={pendingSyncCount}
        onRoleSwitch={handleRoleSwitch}
        onSyncTrigger={handleSyncTrigger}
        isSyncing={isSyncing}
        onOpenJoinModal={() => setIsJoinModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {/* Supervisor View */}
        {currentUser.role === 'supervisor' && (
          <>
            {activeView === 'dashboard' && (
              <SupervisorDashboard
                currentUser={currentUser}
                onOpenProject={handleOpenProject}
                onStartCollectionTest={(p) => handleStartCollection(p)}
              />
            )}

            {activeView === 'project_detail' && selectedProject && (
              <ProjectDetail
                project={selectedProject}
                currentUser={currentUser}
                onBack={() => {
                  setActiveView('dashboard');
                  setSelectedProject(null);
                }}
                onTestSurvey={(p) => handleStartCollection(p)}
              />
            )}

            {activeView === 'collector_form' && selectedProject && (
              <CollectorForm
                project={selectedProject}
                mission={selectedMission}
                currentUser={currentUser}
                onBack={() => {
                  setActiveView('project_detail');
                }}
                onSubmitted={() => {
                  setActiveView('project_detail');
                }}
              />
            )}
          </>
        )}

        {/* Student View */}
        {currentUser.role === 'student' && (
          <>
            {activeView === 'dashboard' && (
              <StudentDashboard
                currentUser={currentUser}
                onStartCollection={(p, m) => handleStartCollection(p, m)}
                onOpenJoinModal={() => setIsJoinModalOpen(true)}
                onOpenProjectDetail={handleOpenProject}
                onCreatePersonalProject={() => {
                  // Switch to supervisor project creation modal or quick create
                  const personalProj: SurveyProject = {
                    id: `proj-std-${Date.now()}`,
                    title: 'Projet de Recherche Étudiant — Mémoire ESEA',
                    code: `MEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                    description: 'Guide d\'enquête de terrain pour travail académique et mémoire de fin d\'études.',
                    department: currentUser.department,
                    supervisorId: currentUser.id,
                    supervisorName: currentUser.name,
                    supervisorEmail: currentUser.email,
                    isPersonalStudentProject: true,
                    status: 'active',
                    targetSubmissions: 50,
                    currentSubmissions: 0,
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '2025-06-30',
                    groups: [
                      {
                        id: `grp-std-${Date.now()}`,
                        name: 'Groupe d\'Échantillonnage 1',
                        zone: 'Dakar & Région',
                        targetCount: 50,
                        assignedCollectorIds: [currentUser.id],
                      },
                    ],
                    invitationCodes: [
                      {
                        id: `inv-std-${Date.now()}`,
                        code: `MEM-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
                        createdAt: new Date().toISOString(),
                        usedCount: 0,
                        active: true,
                      },
                    ],
                    questions: [
                      {
                        id: `qs-1-${Date.now()}`,
                        key: 'profil_repondant',
                        label: 'Profil / Catégorie socioprofessionnelle de l\'enquêté',
                        type: 'text_short',
                        required: true,
                        order: 1,
                      },
                      {
                        id: `qs-2-${Date.now()}`,
                        key: 'consommation_mensuelle',
                        label: 'Consommation mensuelle moyenne estimée',
                        type: 'number',
                        required: true,
                        unit: 'FCFA',
                        validation: { min: 1000, max: 2000000 },
                        order: 2,
                      },
                    ],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  eseaStorage.saveProject(personalProj);
                  setSelectedProject(personalProj);
                  setActiveView('project_detail');
                }}
              />
            )}

            {activeView === 'project_detail' && selectedProject && (
              <ProjectDetail
                project={selectedProject}
                currentUser={currentUser}
                onBack={() => {
                  setActiveView('dashboard');
                  setSelectedProject(null);
                }}
                onTestSurvey={(p) => handleStartCollection(p)}
              />
            )}

            {activeView === 'collector_form' && selectedProject && (
              <CollectorForm
                project={selectedProject}
                mission={selectedMission}
                currentUser={currentUser}
                onBack={() => {
                  setActiveView('dashboard');
                  setSelectedMission(undefined);
                }}
                onSubmitted={() => {
                  setActiveView('dashboard');
                  setSelectedMission(undefined);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">ESEA Collect</span>
            <span>•</span>
            <span>École Supérieure d'Économie Appliquée</span>
            <span>•</span>
            <span>UCAD Dakar</span>
          </div>

          <div className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
            Plateforme Institutionnelle d'Enquêtes de Terrain
          </div>
        </div>
      </footer>

      {/* Join Project by Code / QR Modal */}
      <JoinModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        currentUser={currentUser}
        onJoinedSuccess={() => {
          // Trigger re-render of missions
          setCurrentUser(eseaStorage.getActiveUser());
        }}
      />
    </div>
  );
}
