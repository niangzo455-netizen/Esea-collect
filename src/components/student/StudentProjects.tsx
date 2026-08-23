import React from 'react';
import {
  Plus,
  FolderPlus,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  ClipboardList,
  Sparkles,
  Trash2,
  Share2,
} from 'lucide-react';
import { eseaStorage } from '../../lib/storage';
import { SurveyProject, UserProfile } from '../../types';

interface StudentProjectsProps {
  currentUser: UserProfile;
  onOpenProject: (project: SurveyProject) => void;
  onCreateNew: () => void;
}

export const StudentProjects: React.FC<StudentProjectsProps> = ({
  currentUser,
  onOpenProject,
  onCreateNew,
}) => {
  const allProjects = eseaStorage.getProjects();
  // Filter student's own projects
  const studentProjects = allProjects.filter(
    (p) => p.supervisorId === currentUser.id || p.isPersonalStudentProject
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BookOpen size={20} className="text-amber-500" />
            Mes Projets Personnels & Académiques
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Créez et gérez vos propres guides de collecte pour vos mémoires, travaux d'études et stages ESEA.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 transition-colors shadow-xs shrink-0 cursor-pointer"
        >
          <Plus size={16} />
          Créer un nouveau projet
        </button>
      </div>

      {studentProjects.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center space-y-3 transition-colors">
          <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-500 flex items-center justify-center mx-auto">
            <FolderPlus size={24} />
          </div>
          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
            Aucun projet académique personnel pour le moment
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            En tant qu'étudiant de l'ESEA, vous pouvez concevoir vos propres questionnaires d'enquête pour votre mémoire ou projet de recherche.
          </p>
          <button
            onClick={onCreateNew}
            className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Commencer un projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentProjects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => onOpenProject(proj)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-amber-400 dark:hover:border-amber-400/80 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded">
                    {proj.code}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {proj.currentSubmissions} collectes
                  </span>
                </div>

                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                  {proj.title}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {proj.description}
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Layers size={13} className="text-slate-400" />
                  <span>{proj.questions.length} questions</span>
                </div>
                <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  Ouvrir <ChevronRight size={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
