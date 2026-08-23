import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Settings2,
  Check,
  Sparkles,
  Layers,
  HelpCircle,
  Hash,
  Type,
  Calendar,
  CheckSquare,
  List,
  Sliders,
  MapPin,
  Camera,
  ToggleLeft,
  X,
  FileText,
} from 'lucide-react';
import { SurveyProject, Question, QuestionType } from '../../types';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';

interface QuestionnaireBuilderProps {
  project: SurveyProject;
  onProjectUpdated: (updatedProject: SurveyProject) => void;
}

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ComponentType<{ size: number; className?: string }> }[] = [
  { type: 'text_short', label: 'Texte Court', icon: Type },
  { type: 'text_long', label: 'Texte Long / Paragraphe', icon: FileText },
  { type: 'number', label: 'Nombre / Montant (FCFA / Âge)', icon: Hash },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'time', label: 'Heure', icon: Calendar },
  { type: 'boolean', label: 'Oui / Non (Binaire)', icon: ToggleLeft },
  { type: 'choice_single', label: 'Choix Unique (Radio)', icon: List },
  { type: 'choice_multiple', label: 'Choix Multiple (Cases)', icon: CheckSquare },
  { type: 'dropdown', label: 'Liste Déroulante', icon: List },
  { type: 'scale', label: 'Échelle d\'évaluation (1-5)', icon: Sliders },
  { type: 'gps', label: 'Localisation GPS', icon: MapPin },
  { type: 'photo', label: 'Prise de Photo Terrain', icon: Camera },
];

export const QuestionnaireBuilder: React.FC<QuestionnaireBuilderProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [questions, setQuestions] = useState<Question[]>(project.questions || []);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    project.questions?.[0]?.id || null
  );
  const [newOptionInput, setNewOptionInput] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  const saveQuestions = (updated: Question[]) => {
    setQuestions(updated);
    const updatedProj: SurveyProject = {
      ...project,
      questions: updated,
      questionnaireVersion: (project.questionnaireVersion || 1) + 1,
      updatedAt: new Date().toISOString(),
    };
    eseaStorage.saveProject(updatedProj);
    if (eseaStorage.isOnline()) {
      firestoreService.saveProject(updatedProj).catch(console.error);
    }
    onProjectUpdated(updatedProj);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddQuestion = (type: QuestionType = 'text_short') => {
    const newId = `q-${Date.now()}`;
    const newKey = `var_${questions.length + 1}`;
    const newQ: Question = {
      id: newId,
      key: newKey,
      label: 'Nouvelle question',
      type,
      required: true,
      options: ['choice_single', 'choice_multiple', 'dropdown'].includes(type)
        ? ['Option 1', 'Option 2']
        : undefined,
      order: questions.length + 1,
      unit: type === 'number' ? 'FCFA' : undefined,
    };

    const nextList = [...questions, newQ];
    saveQuestions(nextList);
    setActiveQuestionId(newId);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Un questionnaire doit comporter au moins une question.');
      return;
    }
    const nextList = questions.filter((q) => q.id !== id);
    saveQuestions(nextList);
    if (activeQuestionId === id) {
      setActiveQuestionId(nextList[0]?.id || null);
    }
  };

  const handleMoveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const nextList = [...questions];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    saveQuestions(nextList);
  };

  const handleUpdateActiveQuestion = (field: Partial<Question>) => {
    if (!activeQuestionId) return;
    const nextList = questions.map((q) =>
      q.id === activeQuestionId ? { ...q, ...field } : q
    );
    saveQuestions(nextList);
  };

  const handleAddOption = () => {
    if (!newOptionInput.trim() || !activeQuestion) return;
    const existing = activeQuestion.options || [];
    handleUpdateActiveQuestion({ options: [...existing, newOptionInput.trim()] });
    setNewOptionInput('');
  };

  const handleRemoveOption = (index: number) => {
    if (!activeQuestion || !activeQuestion.options) return;
    const nextOpts = activeQuestion.options.filter((_, i) => i !== index);
    handleUpdateActiveQuestion({ options: nextOpts });
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
            Concepteur de Questionnaire ESEA
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configurez les variables, types, contraintes de validation et logique de saut conditionnelle.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
              <Check size={14} /> Enregistré
            </span>
          )}

          <button
            onClick={() => setPreviewMode(!previewMode)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
              previewMode
                ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 border-blue-900 dark:border-blue-700'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-700'
            }`}
          >
            <Eye size={14} />
            {previewMode ? 'Mode Édition' : 'Aperçu Formulaire'}
          </button>

          <button
            onClick={() => handleAddQuestion('text_short')}
            className="px-4 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Plus size={15} />
            Ajouter une question
          </button>
        </div>
      </div>

      {/* Main Builder Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Questions List (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Structure ({questions.length} questions)
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
              Ordre de passation
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {questions.map((q, idx) => {
              const isSelected = q.id === activeQuestionId;
              const IconComponent =
                QUESTION_TYPES.find((t) => t.type === q.type)?.icon || Type;

              return (
                <div
                  key={q.id}
                  onClick={() => setActiveQuestionId(q.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/60 border-amber-500 shadow-xs text-slate-900 dark:text-slate-100'
                      : 'bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500 shrink-0">
                      {idx + 1}.
                    </span>
                    <IconComponent
                      size={15}
                      className={isSelected ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate leading-tight">
                        {q.label || 'Question sans titre'}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                        {q.key} • {q.type}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleMoveQuestion(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                      title="Monter"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      onClick={() => handleMoveQuestion(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded text-slate-400 disabled:opacity-20 cursor-pointer"
                      title="Descendre"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 w-full mb-1">
              Ajout rapide par type :
            </span>
            {QUESTION_TYPES.slice(0, 6).map((t) => (
              <button
                key={t.type}
                onClick={() => handleAddQuestion(t.type)}
                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-md transition-colors cursor-pointer"
              >
                + {t.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Question Editor (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 space-y-6 transition-colors">
          {activeQuestion ? (
            <>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded-lg">
                    {activeQuestion.key}
                  </span>
                  <span className="text-xs text-slate-400">|</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Propriétés & Règles Métier
                  </span>
                </div>

                <button
                  onClick={() => handleDeleteQuestion(activeQuestion.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Supprimer cette question
                </button>
              </div>

              {/* Basic Fields */}
              <div className="space-y-4">
                {/* Question Label */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Libellé de la Question (Texte affiché à l'enquêteur)
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.label}
                    onChange={(e) => handleUpdateActiveQuestion({ label: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Variable Key & Question Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Identifiant Variable (Export CSV / SPSS / R)
                    </label>
                    <input
                      type="text"
                      value={activeQuestion.key}
                      onChange={(e) =>
                        handleUpdateActiveQuestion({
                          key: e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase(),
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-800 dark:text-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Type de Question
                    </label>
                    <select
                      value={activeQuestion.type}
                      onChange={(e) =>
                        handleUpdateActiveQuestion({
                          type: e.target.value as QuestionType,
                          options: ['choice_single', 'choice_multiple', 'dropdown'].includes(e.target.value)
                            ? activeQuestion.options || ['Option A', 'Option B']
                            : undefined,
                        })
                      }
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-amber-500 outline-none"
                    >
                      {QUESTION_TYPES.map((t) => (
                        <option key={t.type} value={t.type}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Question Description / Instructions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Consigne / Note explicative pour l'étudiant enquêteur (Facultatif)
                  </label>
                  <input
                    type="text"
                    value={activeQuestion.description || ''}
                    onChange={(e) => handleUpdateActiveQuestion({ description: e.target.value })}
                    placeholder="Ex: Renseigner le montant exact sans les centimes."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 focus:border-amber-500 outline-none"
                  />
                </div>

                {/* Required toggle and Unit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <input
                      type="checkbox"
                      id="req-checkbox"
                      checked={activeQuestion.required}
                      onChange={(e) => handleUpdateActiveQuestion({ required: e.target.checked })}
                      className="w-4 h-4 text-amber-500 rounded border-slate-300 dark:border-slate-600 focus:ring-amber-400"
                    />
                    <label htmlFor="req-checkbox" className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
                      Question Obligatoire (Requis)
                    </label>
                  </div>

                  {activeQuestion.type === 'number' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Unité de mesure
                      </label>
                      <input
                        type="text"
                        value={activeQuestion.unit || ''}
                        onChange={(e) => handleUpdateActiveQuestion({ unit: e.target.value })}
                        placeholder="Ex: FCFA, ans, kg, heures"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Options Manager */}
                {['choice_single', 'choice_multiple', 'dropdown'].includes(activeQuestion.type) && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Modalités de réponses / Options
                    </label>

                    <div className="space-y-2">
                      {activeQuestion.options?.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-5">
                            {oIdx + 1}.
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const nextOpts = [...(activeQuestion.options || [])];
                              nextOpts[oIdx] = e.target.value;
                              handleUpdateActiveQuestion({ options: nextOpts });
                            }}
                            className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:border-amber-500 outline-none"
                          />
                          <button
                            onClick={() => handleRemoveOption(oIdx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newOptionInput}
                        onChange={(e) => setNewOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddOption();
                        }}
                        placeholder="Ajouter une modalité..."
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl text-xs text-slate-800 dark:text-slate-200 outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={handleAddOption}
                        className="px-3 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}

                {/* Validation Constraints */}
                {activeQuestion.type === 'number' && (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Règles de validation locales (Contrôle de cohérence)
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Valeur Min</span>
                        <input
                          type="number"
                          value={activeQuestion.validation?.min ?? ''}
                          onChange={(e) =>
                            handleUpdateActiveQuestion({
                              validation: {
                                ...activeQuestion.validation,
                                min: e.target.value === '' ? undefined : Number(e.target.value),
                              },
                            })
                          }
                          placeholder="Min"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Valeur Max</span>
                        <input
                          type="number"
                          value={activeQuestion.validation?.max ?? ''}
                          onChange={(e) =>
                            handleUpdateActiveQuestion({
                              validation: {
                                ...activeQuestion.validation,
                                max: e.target.value === '' ? undefined : Number(e.target.value),
                              },
                            })
                          }
                          placeholder="Max"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Conditional skip logic */}
                <div className="p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 dark:text-amber-400 uppercase tracking-wider">
                      Logique Conditionnelle (Afficher uniquement si...)
                    </label>
                    {activeQuestion.condition && (
                      <button
                        onClick={() => handleUpdateActiveQuestion({ condition: undefined })}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                      >
                        Désactiver la condition
                      </button>
                    )}
                  </div>

                  {activeQuestion.condition ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Question parente</span>
                        <select
                          value={activeQuestion.condition.dependentQuestionId}
                          onChange={(e) =>
                            handleUpdateActiveQuestion({
                              condition: {
                                ...activeQuestion.condition!,
                                dependentQuestionId: e.target.value,
                              },
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg"
                        >
                          {questions
                            .filter((q) => q.id !== activeQuestion.id)
                            .map((q) => (
                              <option key={q.id} value={q.id}>
                                {q.label.substring(0, 35)}... ({q.key})
                              </option>
                            ))}
                        </select>
                      </div>

                      <div>
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Valeur requise pour afficher</span>
                        <input
                          type="text"
                          value={String(activeQuestion.condition.value)}
                          onChange={(e) =>
                            handleUpdateActiveQuestion({
                              condition: {
                                ...activeQuestion.condition!,
                                value: e.target.value === 'true' ? true : e.target.value === 'false' ? false : e.target.value,
                              },
                            })
                          }
                          placeholder="Ex: true ou Oui"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-semibold"
                        />
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        handleUpdateActiveQuestion({
                          condition: {
                            dependentQuestionId: questions.find((q) => q.id !== activeQuestion.id)?.id || '',
                            operator: 'equals',
                            value: true,
                          },
                        })
                      }
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-slate-700 text-blue-950 dark:text-amber-400 border border-blue-300 dark:border-slate-600 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      + Ajouter une condition d'affichage
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Sélectionnez une question dans la colonne de gauche pour la modifier.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
