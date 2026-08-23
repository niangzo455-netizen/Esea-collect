import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  Users,
  Database,
  ShieldAlert,
  ChevronRight,
  Sparkles,
  Play,
  Calendar,
  Building,
  GraduationCap,
  FileSpreadsheet,
  Trash2,
  Share2,
  CheckCircle2,
  X,
  Filter,
  Building2,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  SurveyProject,
  UserProfile,
  EseaDepartmentCode,
  InstitutionalScopeType,
  InstitutionalScope,
  ESEA_DEPARTMENTS_CONFIG,
} from '../../types';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';
import { ESEA_DEPARTMENTS } from '../../data/mockData';

interface SupervisorDashboardProps {
  currentUser: UserProfile;
  onOpenProject: (project: SurveyProject) => void;
  onStartCollectionTest: (project: SurveyProject) => void;
}

export const SupervisorDashboard: React.FC<SupervisorDashboardProps> = ({
  currentUser,
  onOpenProject,
  onStartCollectionTest,
}) => {
  const [, setStorageVersion] = useState(0);

  // Subscribe to storage changes to ensure projects and KPIs refresh immediately on demo load/clear
  useEffect(() => {
    const unsub = eseaStorage.subscribe(() => {
      setStorageVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [scopeType, setScopeType] = useState<InstitutionalScopeType>('department');
  const [selectedSingleDept, setSelectedSingleDept] = useState<EseaDepartmentCode>('ATEGU');
  const [selectedMultiDepts, setSelectedMultiDepts] = useState<EseaDepartmentCode[]>(['ATEGU', 'DECOF']);
  const [newTarget, setNewTarget] = useState(150);
  const [scopeFilter, setScopeFilter] = useState<'ALL' | EseaDepartmentCode | 'TRANSVERSAL'>('ALL');

  const isDemo = eseaStorage.isDemoMode();
  const projects = eseaStorage.getProjects();
  const allSubmissions = eseaStorage.getSubmissions();
  const allJoinRequests = eseaStorage.getJoinRequests();
  const pendingRequests = allJoinRequests.filter((r) => r.status === 'pending');

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

  // Aggregates
  const totalSubmissions = allSubmissions.length;
  const totalTarget = projects.reduce((acc, p) => acc + p.targetSubmissions, 0);
  const totalAnomalies = allSubmissions.filter((s) => s.qualityStatus === 'warning').length;

  const toggleMultiDept = (code: EseaDepartmentCode) => {
    if (selectedMultiDepts.includes(code)) {
      if (selectedMultiDepts.length > 1) {
        setSelectedMultiDepts(selectedMultiDepts.filter((c) => c !== code));
      }
    } else {
      setSelectedMultiDepts([...selectedMultiDepts, code]);
    }
  };

  const handleCreateProject = async () => {
    if (!newTitle.trim()) return;

    const code =
      newCode.trim().toUpperCase() ||
      `ESEA-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Compute scope and department description
    let finalScope: InstitutionalScope;
    let formattedDept = '';

    if (scopeType === 'department') {
      finalScope = {
        type: 'department',
        departments: [selectedSingleDept],
      };
      const info = ESEA_DEPARTMENTS_CONFIG[selectedSingleDept];
      formattedDept = `${info.code} — ${info.name}`;
    } else if (scopeType === 'multi_department') {
      finalScope = {
        type: 'multi_department',
        departments: selectedMultiDepts,
      };
      formattedDept = `Pluridépartemental (${selectedMultiDepts.join(' & ')})`;
    } else {
      finalScope = {
        type: 'transversal',
        departments: ['ATEGU', 'DECOF', 'PEGO'],
      };
      formattedDept = 'Transversal ESEA (Toute l\'institution)';
    }

    const newProj: SurveyProject = {
      id: `proj-${Date.now()}`,
      title: newTitle.trim(),
      code,
      description:
        newDescription.trim() ||
        'Enquête académique et de terrain menée par les étudiants de l\'ESEA.',
      department: formattedDept,
      institutionalScope: finalScope,
      supervisorId: currentUser.id,
      supervisorName: currentUser.name,
      supervisorEmail: currentUser.email,
      status: 'active',
      targetSubmissions: Number(newTarget) || 100,
      currentSubmissions: 0,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2025-06-30',
      questionnaireVersion: 1,
      groups: [
        {
          id: `grp-1-${Date.now()}`,
          name: 'Groupe 1 — Zone Principale',
          zone: 'Dakar & Banlieue',
          targetCount: Number(newTarget) || 100,
          assignedCollectorIds: [],
        },
      ],
      invitationCodes: [
        {
          id: `inv-${Date.now()}`,
          code: `${code}-JOIN`,
          createdAt: new Date().toISOString(),
          usedCount: 0,
          active: true,
        },
      ],
      questions: [
        {
          id: `q-1-${Date.now()}`,
          key: 'nom_repondant',
          label: 'Nom ou identifiant de l\'enquêté',
          type: 'text_short',
          required: true,
          order: 1,
        },
        {
          id: `q-2-${Date.now()}`,
          key: 'age',
          label: 'Âge de l\'enquêté',
          type: 'number',
          required: true,
          unit: 'ans',
          validation: { min: 18, max: 99 },
          order: 2,
        },
        {
          id: `q-3-${Date.now()}`,
          key: 'commune',
          label: 'Commune de résidence',
          type: 'dropdown',
          required: true,
          options: ['Dakar Plateau', 'Médina', 'Pikine', 'Guédiawaye', 'Rufisque'],
          order: 3,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    eseaStorage.saveProject(newProj);
    // Cloud sync in background
    if (eseaStorage.isOnline()) {
      firestoreService.saveProject(newProj).catch(console.error);
    }

    setShowCreateModal(false);
    setNewTitle('');
    setNewCode('');
    setNewDescription('');
    onOpenProject(newProj);
  };

  // Filter projects by institutional scope
  const filteredProjects = projects.filter((p) => {
    if (scopeFilter === 'ALL') return true;
    if (scopeFilter === 'TRANSVERSAL') {
      return p.institutionalScope?.type === 'transversal' || p.department?.toLowerCase().includes('transversal');
    }
    // Specific department filter
    if (p.institutionalScope) {
      if (p.institutionalScope.type === 'transversal') return true;
      return p.institutionalScope.departments?.includes(scopeFilter);
    }
    return p.department?.includes(scopeFilter);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded">
              Supervision Enquêtes ESEA
            </span>
            <span className="text-xs text-slate-300 font-medium">
              ATEGU • DECOF • PEGO
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Tableau de Bord Superviseur
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Gestion globale des projets d'enquêtes, conception des questionnaires, validation des équipes et contrôle qualité des données de terrain.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <Plus size={17} />
          Créer un nouveau projet d'enquête
        </button>
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
                {isDemo ? 'Jeu de Démonstration Chargé' : 'Environnement Vierge (Prêt pour de vraies enquêtes)'}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isDemo
                ? 'Des données simulées sont actuellement visibles pour tests. Cliquez sur « Vider données démo » pour repartir de zéro.'
                : 'Toutes les données sont réinitialisées (0 projet, 0 fiche). Vous pouvez créer vos propres enquêtes réelles.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-end sm:self-auto shrink-0">
          {isDemo ? (
            <>
              <button
                onClick={handleClearToCleanState}
                title="Quitter le mode démo et effacer les données de test pour revenir à l'environnement vierge"
                className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/50 text-red-700 dark:text-red-300 hover:border-red-300 dark:hover:border-red-800 border border-slate-300 dark:border-slate-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Revenir au mode Pilote (Vider démo)</span>
              </button>
              <button
                onClick={handleLoadDemoData}
                title="Réinitialiser les données de démonstration initiales ESEA"
                className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Réinitialiser Démo</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleLoadDemoData}
              title="Charger les projets et fiches de démonstration ESEA"
              className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} />
              <span>Charger les données de démonstration</span>
            </button>
          )}
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Projets d'Enquêtes</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {projects.length}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Enquêtes actives à l'ESEA
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Fiches Collectées</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-blue-900 dark:text-amber-400">
            {totalSubmissions} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {totalTarget}</span>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
            Saisies terrain consolidées
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Demandes Étudiants</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {pendingRequests.length}
          </div>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
            {pendingRequests.length > 0 ? 'À valider dans les équipes' : 'Toutes validées'}
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Alertes Qualité</span>
          <div className="mt-1 text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {totalAnomalies}
          </div>
          <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 block">
            Données atypiques signalées
          </span>
        </div>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Vos Enquêtes en Cours & Enseignement ({projects.length})
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Cadre institutionnel ESEA : ATEGU, DECOF, PEGO et projets transversaux.
            </p>
          </div>

          {/* Scope Filter Pills */}
          {projects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
              <button
                onClick={() => setScopeFilter('ALL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  scopeFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Tous ({projects.length})
              </button>
              {ESEA_DEPARTMENTS.map((d) => (
                <button
                  key={d.code}
                  onClick={() => setScopeFilter(d.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    scopeFilter === d.code
                      ? 'bg-amber-400 text-slate-950 shadow-2xs font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {d.code}
                </button>
              ))}
              <button
                onClick={() => setScopeFilter('TRANSVERSAL')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  scopeFilter === 'TRANSVERSAL'
                    ? 'bg-blue-950 text-amber-400 shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Transversal
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {projects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-950 dark:text-amber-400 mx-auto flex items-center justify-center">
              <Database className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Aucune Enquête dans l'Environnement Pilote
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Le système est dans un état vierge et prêt pour des tests réels. Vous pouvez créer votre première enquête ou charger le jeu de données de démonstration ESEA.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} />
                <span>Créer une première enquête</span>
              </button>
              <button
                onClick={() => eseaStorage.loadDemoData()}
                className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Sparkles size={16} />
                <span>Charger les données de démo ESEA</span>
              </button>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 text-center border border-slate-200/80 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aucune enquête ne correspond au filtre institutionnel sélectionné ({scopeFilter}).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredProjects.map((proj) => {
              const projectSubmissions = eseaStorage.getSubmissions(proj.id);
              const percent =
                proj.targetSubmissions > 0
                  ? Math.min(100, Math.round((projectSubmissions.length / proj.targetSubmissions) * 100))
                  : 0;

              // Compute scope badge
              let scopeBadge = (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {proj.department}
                </span>
              );

              if (proj.institutionalScope) {
                if (proj.institutionalScope.type === 'department') {
                  const dCode = proj.institutionalScope.departments?.[0] || 'ATEGU';
                  scopeBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      {dCode}
                    </span>
                  );
                } else if (proj.institutionalScope.type === 'multi_department') {
                  const depts = proj.institutionalScope.departments?.join(' + ') || 'Multi';
                  scopeBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Pluridépartemental ({depts})
                    </span>
                  );
                } else if (proj.institutionalScope.type === 'transversal') {
                  scopeBadge = (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Transversal ESEA
                    </span>
                  );
                }
              }

              return (
                <div
                  key={proj.id}
                  onClick={() => onOpenProject(proj)}
                  className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-400/80 transition-all p-6 cursor-pointer flex flex-col justify-between space-y-5"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg">
                          {proj.code}
                        </span>
                        {scopeBadge}
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded">
                        {proj.status === 'active' ? 'Active' : 'Brouillon'}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      {proj.title}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2">
                      {proj.description}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Layers size={13} className="text-slate-400" />
                        {proj.questions.length} questions
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users size={13} className="text-slate-400" />
                        {proj.groups.length} groupes
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>Collecte de terrain</span>
                      <span className="font-mono">
                        {projectSubmissions.length} / {proj.targetSubmissions} ({percent}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-950 dark:bg-amber-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  {/* Action buttons inside card */}
                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onStartCollectionTest(proj)}
                      className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Play size={13} /> Tester la saisie
                    </button>

                    <button
                      onClick={() => onOpenProject(proj)}
                      className="px-3.5 py-1.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                    >
                      Gérer l'enquête <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col my-8">
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <h3 className="font-bold text-white text-base">
                Créer une Nouvelle Enquête ESEA
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Titre de l'Enquête *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Enquête sur la résilience urbaine et l'assainissement"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Code Enquête
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="Ex: RESIL-2025"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Objectif Global (Fiches)
                  </label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Institutional Scope Configuration */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-1">
                    Périmètre Institutionnel de l'Enquête
                  </label>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    Définit le rattachement académique de l'étude (la participation des étudiants reste ouverte à toute l'école).
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setScopeType('department')}
                      className={`p-2 rounded-xl text-center border font-semibold text-xs transition-all cursor-pointer ${
                        scopeType === 'department'
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Monodépartemental
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeType('multi_department')}
                      className={`p-2 rounded-xl text-center border font-semibold text-xs transition-all cursor-pointer ${
                        scopeType === 'multi_department'
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Pluridépartemental
                    </button>
                    <button
                      type="button"
                      onClick={() => setScopeType('transversal')}
                      className={`p-2 rounded-xl text-center border font-semibold text-xs transition-all cursor-pointer ${
                        scopeType === 'transversal'
                          ? 'bg-amber-400 text-slate-950 border-amber-500 font-bold shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Transversal ESEA
                    </button>
                  </div>
                </div>

                {scopeType === 'department' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Département Porteur :
                    </label>
                    <select
                      value={selectedSingleDept}
                      onChange={(e) => setSelectedSingleDept(e.target.value as EseaDepartmentCode)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                    >
                      {ESEA_DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.code} — {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {scopeType === 'multi_department' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Départements Associés (sélectionner 2 ou plus) :
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {ESEA_DEPARTMENTS.map((dept) => {
                        const isChecked = selectedMultiDepts.includes(dept.code);
                        return (
                          <button
                            key={dept.code}
                            type="button"
                            onClick={() => toggleMultiDept(dept.code)}
                            className={`p-2 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              isChecked
                                ? 'bg-blue-950 text-amber-400 border-blue-900 font-bold'
                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <CheckCircle2 size={13} className={isChecked ? 'text-amber-400' : 'text-slate-300'} />
                            <span>{dept.code}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {scopeType === 'transversal' && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50">
                    Cette étude implique la totalité des départements de l'ESEA (ATEGU, DECOF, PEGO) dans le cadre d'un grand projet d'établissement.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Description / Objectifs de recherche
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Contexte méthodologique, public cible, zone d'étude..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl resize-none outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newTitle.trim()}
                className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Créer et Configurer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
