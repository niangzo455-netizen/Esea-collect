import React, { useState, useEffect } from 'react';
import {
  ClipboardList,
  Target,
  CheckCircle2,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Plus,
  Play,
  Layers,
  MapPin,
  Users,
  ChevronRight,
  Sparkles,
  BookOpen,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';
import { UserProfile, Mission, SurveyProject, Submission, EseaDepartmentCode, ESEA_DEPARTMENTS_CONFIG } from '../../types';
import { StudentProjects } from './StudentProjects';

interface StudentDashboardProps {
  currentUser: UserProfile;
  onStartCollection: (project: SurveyProject, mission?: Mission) => void;
  onOpenJoinModal: () => void;
  onOpenProjectDetail: (project: SurveyProject) => void;
  onCreatePersonalProject: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  currentUser,
  onStartCollection,
  onOpenJoinModal,
  onOpenProjectDetail,
  onCreatePersonalProject,
}) => {
  const [, setStorageVersion] = useState(0);

  // Subscribe to storage changes to ensure missions and state refresh immediately
  useEffect(() => {
    const unsub = eseaStorage.subscribe(() => {
      setStorageVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  const [activeTab, setActiveTab] = useState<'missions' | 'projects' | 'history'>('missions');
  const [isSyncing, setIsSyncing] = useState(false);

  const missions = eseaStorage.getMissions(currentUser.id);
  const submissions = eseaStorage.getSubmissions().filter((s) => s.studentId === currentUser.id);
  const pendingSubmissions = eseaStorage.getPendingSubmissions(currentUser.id);
  const isOnline = eseaStorage.isOnline();
  const isDemo = eseaStorage.isDemoMode();

  const handleClearToCleanState = () => {
    try {
      eseaStorage.resetToCleanState();
    } catch (e) {
      console.error('Failed to reset clean state:', e);
    }
  };

  const handleLoadDemoData = () => {
    try {
      eseaStorage.loadDemoData();
    } catch (e) {
      console.error('Failed to load demo data:', e);
    }
  };

  const deptCode = currentUser.department as EseaDepartmentCode;
  const deptInfo = ESEA_DEPARTMENTS_CONFIG[deptCode];
  const deptLabel = deptInfo ? `${deptInfo.code} — ${deptInfo.name}` : currentUser.department;

  // Aggregate metrics
  const totalCompleted = missions.reduce((acc, m) => acc + m.completedCount, 0);
  const totalTarget = missions.reduce((acc, m) => acc + m.targetCount, 0);
  const totalPending = pendingSubmissions.length;
  const totalSynced = totalCompleted - totalPending;
  const progressPercent = totalTarget > 0 ? Math.min(100, Math.round((totalCompleted / totalTarget) * 100)) : 0;

  const handleSyncNow = async () => {
    if (!isOnline) return;
    setIsSyncing(true);
    try {
      await firestoreService.syncPendingSubmissions(currentUser.id);
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Student Welcome & Top Overview */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/60 relative overflow-hidden">
        {/* Subtle decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded">
                Espace Enquêteur Terrain
              </span>
              <span className="text-xs text-amber-300 font-semibold">
                {deptLabel}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Bonjour, {currentUser.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Matricule ESEA : <span className="font-mono text-amber-300 font-semibold">{currentUser.matricule || 'ETU-2023-4418'}</span> • Prêt pour vos collectes de terrain en ligne ou hors ligne.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenJoinModal}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} />
              Rejoindre une enquête (Code / QR)
            </button>
          </div>
        </div>
      </div>

      {/* Environment & Data State Control Bar */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
          isDemo
            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60'
            : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`p-2.5 rounded-xl shrink-0 ${
              isDemo
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {isDemo ? <Sparkles size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Mode Actif :
              </span>
              <span
                className={`text-xs font-extrabold px-2.5 py-0.5 rounded-md ${
                  isDemo
                    ? 'bg-amber-200 text-amber-950 dark:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-200 text-emerald-950 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                }`}
              >
                {isDemo ? 'Mode Démo Actif' : 'Environnement Vierge (Prêt pour de vraies enquêtes)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isDemo
                ? 'Données d\'exemples ESEA chargées pour simulation.'
                : 'Environnement propre (0 mission résiduelle). Rejoignez une enquête avec un code ou QR.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto shrink-0">
          {isDemo ? (
            <>
              <button
                onClick={handleClearToCleanState}
                title="Effacer toutes les données locales et basculer en environnement vierge"
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 hover:border-red-300 dark:hover:border-red-800 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Revenir au mode Pilote (Vider démo)</span>
              </button>
              <button
                onClick={handleLoadDemoData}
                title="Réinitialiser les données de démonstration initiales ESEA"
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Réinitialiser Démo</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLoadDemoData}
              title="Charger les projets et missions de démonstration ESEA"
              className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Charger les données de démonstration</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {/* Total Collected */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collectes Réalisées</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-400 flex items-center justify-center">
              <ClipboardList size={17} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {totalCompleted}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              / {totalTarget} obj.
            </span>
          </div>
          <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-blue-950 dark:bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Global Progress */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Taux d'Avancement</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Target size={17} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {progressPercent} %
            </span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
            {missions.length} mission(s) active(s)
          </span>
        </div>

        {/* Synced */}
        <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Synchronisées (Cloud)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
              {totalSynced}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-2">
            Transmises au serveur
          </span>
        </div>

        {/* Pending Sync */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
            totalPending > 0
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              En attente (Hors-Ligne)
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                totalPending > 0
                  ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}
            >
              <Clock size={17} />
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span
              className={`text-2xl sm:text-3xl font-black ${
                totalPending > 0 ? 'text-amber-900 dark:text-amber-300' : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {totalPending}
            </span>

            {totalPending > 0 && isOnline && (
              <button
                onClick={handleSyncNow}
                disabled={isSyncing}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
                Sync Cloud
              </button>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-2">
            {totalPending > 0
              ? isOnline
                ? 'Connexion active disponible'
                : 'Stocké localement sans risque'
              : 'Toutes les fiches sont synchronisées'}
          </span>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('missions')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'missions'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ClipboardList size={16} />
          Mes Missions de Collecte ({missions.length})
        </button>

        <button
          onClick={() => setActiveTab('projects')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'projects'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen size={16} />
          Mes Projets Personnels
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-2 cursor-pointer ${
            activeTab === 'history'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers size={16} />
          Historique des Saisies ({submissions.length})
        </button>
      </div>

      {/* Tab 1: Active Missions */}
      {activeTab === 'missions' && (
        <div className="space-y-4">
          {missions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 p-8 sm:p-12 text-center space-y-4 transition-colors">
              <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-amber-400 flex items-center justify-center mx-auto">
                <ClipboardList size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Vous n'avez pas encore de mission active assignée
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Rejoignez une enquête de votre enseignant en entrant le code d'invitation (ex: <code className="font-mono font-bold text-slate-800 dark:text-amber-300">THIAK-7K4P</code>) ou en scannant le QR code.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                <button
                  onClick={onOpenJoinModal}
                  className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs cursor-pointer"
                >
                  Rejoindre une enquête maintenant
                </button>
                <button
                  onClick={handleLoadDemoData}
                  className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Sparkles size={15} />
                  <span>Charger les données démo</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {missions.map((mission) => {
                const project = eseaStorage.getProjectById(mission.projectId);
                const percent =
                  mission.targetCount > 0
                    ? Math.min(100, Math.round((mission.completedCount / mission.targetCount) * 100))
                    : 0;

                return (
                  <div
                    key={mission.id}
                    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-400/80 transition-all p-5 sm:p-6 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-md">
                          {project?.code || 'ENQUETE'}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded">
                          En cours
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {mission.projectTitle}
                      </h3>

                      {mission.groupName && (
                        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-900 dark:text-amber-400 font-semibold bg-blue-50/80 dark:bg-blue-950/50 px-2.5 py-1 rounded-lg">
                          <Users size={14} className="text-blue-700 dark:text-amber-500" />
                          <span>{mission.groupName}</span>
                        </div>
                      )}

                      {mission.zone && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{mission.zone}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress details */}
                    <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <span>Progression terrain</span>
                        <span className="font-mono">
                          {mission.completedCount} / {mission.targetCount} ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                        <span>{mission.syncedCount} synchronisées</span>
                        {mission.pendingCount > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400">
                            {mission.pendingCount} en attente
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => {
                          if (project) onStartCollection(project, mission);
                        }}
                        className="flex-1 py-3 px-4 bg-blue-950 hover:bg-blue-900 text-amber-400 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Play size={16} className="fill-amber-400" />
                        Remplir un questionnaire
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Student Personal Projects */}
      {activeTab === 'projects' && (
        <StudentProjects
          currentUser={currentUser}
          onOpenProject={onOpenProjectDetail}
          onCreateNew={onCreatePersonalProject}
        />
      )}

      {/* Tab 3: History */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Historique de vos soumissions de terrain ({submissions.length})
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Enregistrements locaux & synchronisés
            </span>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Aucune saisie réalisée pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-x-auto">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {sub.projectTitle}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.syncStatus === 'synced'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {sub.syncStatus === 'synced' ? 'Synchronisé' : 'En attente'}
                      </span>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>{new Date(sub.submittedAt).toLocaleString('fr-FR')}</span>
                      {sub.groupName && <span>• {sub.groupName}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                    {sub.gps && (
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <MapPin size={12} /> {sub.gps.latitude.toFixed(4)}, {sub.gps.longitude.toFixed(4)}
                      </span>
                    )}
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {sub.id.substring(0, 10)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
