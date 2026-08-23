import React, { useState } from 'react';
import {
  ArrowLeft,
  LayoutDashboard,
  FileEdit,
  Users,
  Database,
  ShieldCheck,
  Download,
  Calendar,
  Sparkles,
  Layers,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Play,
  FileSpreadsheet,
} from 'lucide-react';
import { SurveyProject, UserProfile } from '../../types';
import { eseaStorage } from '../../lib/storage';
import { QuestionnaireBuilder } from './QuestionnaireBuilder';
import { TeamManager } from './TeamManager';
import { SubmissionsTable } from './SubmissionsTable';
import { exportProjectDataToCSV, exportProjectDataToExcel } from '../../lib/export';

interface ProjectDetailProps {
  project: SurveyProject;
  currentUser: UserProfile;
  onBack: () => void;
  onTestSurvey: (project: SurveyProject) => void;
}

export const ProjectDetail: React.FC<ProjectDetailProps> = ({
  project: initialProject,
  currentUser,
  onBack,
  onTestSurvey,
}) => {
  const [project, setProject] = useState<SurveyProject>(initialProject);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'questionnaire' | 'team' | 'data' | 'quality'
  >('overview');

  const submissions = eseaStorage.getSubmissions(project.id);
  const validCount = submissions.filter((s) => s.qualityStatus === 'valid').length;
  const warningCount = submissions.filter((s) => s.qualityStatus === 'warning').length;
  const percentComplete =
    project.targetSubmissions > 0
      ? Math.min(100, Math.round((submissions.length / project.targetSubmissions) * 100))
      : 0;

  const handleProjectUpdated = (updated: SurveyProject) => {
    setProject(updated);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in">
      {/* Back and Top Banner */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Retour aux enquêtes
        </button>

        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-900/60 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 text-xs font-black font-mono bg-amber-400 text-slate-950 rounded">
                {project.code}
              </span>
              <span className="text-xs text-slate-300 font-medium">
                {project.department}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded">
                {project.status === 'active' ? 'Enquête Active' : 'Brouillon'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
              {project.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              {project.description}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onTestSurvey(project)}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Play size={15} className="fill-slate-950" />
              Tester la saisie terrain
            </button>

            <button
              onClick={() => exportProjectDataToExcel(project, submissions)}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors border border-white/20 flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              Exporter Excel
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutDashboard size={16} />
          Vue d'ensemble
        </button>

        <button
          onClick={() => setActiveTab('questionnaire')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'questionnaire'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileEdit size={16} />
          Questionnaire ({project.questions.length})
        </button>

        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'team'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users size={16} />
          Équipes & Invitations ({project.groups.length} groupes)
        </button>

        <button
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 cursor-pointer ${
            activeTab === 'data'
              ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database size={16} />
          Données & Soumissions ({submissions.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Collectes Réalisées</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {submissions.length} <span className="text-xs text-slate-400 dark:text-slate-500 font-normal">/ {project.targetSubmissions}</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-950 dark:bg-amber-500 h-full rounded-full"
                  style={{ width: `${percentComplete}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Progression Globale</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                {percentComplete} %
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                Objectif en bonne voie
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Données Qualifiées</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400">
                {validCount}
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                Validées conformes
              </span>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Alertes / À Vérifier</span>
              <div className="mt-1 text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                {warningCount}
              </div>
              <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1 block">
                Nécessite vérification
              </span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Résumé de l'Échantillonnage par Groupe
              </h3>
              <div className="space-y-3">
                {project.groups.map((g) => (
                  <div
                    key={g.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">{g.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">{g.zone}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-blue-900 dark:text-amber-400">
                        {submissions.filter((s) => s.groupId === g.id).length} / {g.targetCount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Informations Pédagogiques & Responsable
              </h3>
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Enseignant Superviseur</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{project.supervisorName}</span>
                  <div className="text-slate-500 dark:text-slate-400">{project.supervisorEmail}</div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Période de Terrain</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Du {project.startDate} au {project.endDate}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'questionnaire' && (
        <QuestionnaireBuilder
          project={project}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {activeTab === 'team' && (
        <TeamManager
          project={project}
          onProjectUpdated={handleProjectUpdated}
        />
      )}

      {activeTab === 'data' && (
        <SubmissionsTable
          project={project}
          submissions={submissions}
          onSubmissionsUpdated={() => {
            setProject({ ...project });
          }}
        />
      )}
    </div>
  );
};
