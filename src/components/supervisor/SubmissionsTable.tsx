import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  XCircle,
  MapPin,
  Clock,
  User,
  X,
  FileText,
  Save,
  Image as ImageIcon,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { SurveyProject, Submission, QualityStatus } from '../../types';
import { exportProjectDataToCSV, exportProjectDataToExcel } from '../../lib/export';
import { eseaStorage } from '../../lib/storage';

interface SubmissionsTableProps {
  project: SurveyProject;
  submissions: Submission[];
  onSubmissionsUpdated?: () => void;
}

export const SubmissionsTable: React.FC<SubmissionsTableProps> = ({
  project,
  submissions,
  onSubmissionsUpdated,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [selectedQuality, setSelectedQuality] = useState<string>('ALL');
  const [inspectingSub, setInspectingSub] = useState<Submission | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null);

  // Filtering
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedGroup !== 'ALL' && sub.groupId !== selectedGroup) return false;
    if (selectedQuality !== 'ALL' && sub.qualityStatus !== selectedQuality) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchStudent = sub.studentName.toLowerCase().includes(term);
      const matchGroup = sub.groupName?.toLowerCase().includes(term);
      const matchAnswers = Object.values(sub.answers).some((val) =>
        String(val).toLowerCase().includes(term)
      );
      return matchStudent || matchGroup || matchAnswers;
    }
    return true;
  });

  const handleExportCSV = () => {
    exportProjectDataToCSV(project, filteredSubmissions);
  };

  const handleExportExcel = () => {
    exportProjectDataToExcel(project, filteredSubmissions);
  };

  const handleSaveQualityReview = (newStatus: QualityStatus) => {
    if (!inspectingSub) return;
    eseaStorage.updateSubmissionQuality(
      inspectingSub.id,
      newStatus,
      reviewNote.trim() || undefined
    );
    setInspectingSub((prev) =>
      prev
        ? {
            ...prev,
            qualityStatus: newStatus,
            qualityNotes: reviewNote.trim()
              ? [...(prev.qualityNotes || []), reviewNote.trim()]
              : prev.qualityNotes,
          }
        : null
    );
    setReviewNote('');
    if (onSubmissionsUpdated) onSubmissionsUpdated();
  };

  return (
    <div className="space-y-6">
      {/* Top Export and Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Données de Collecte & Réponses ({filteredSubmissions.length} / {submissions.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Consultation des fiches remplies sur le terrain, contrôle de cohérence et exports statistiques.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <Download size={14} />
              Export CSV (SPSS/R)
            </button>

            <button
              onClick={handleExportExcel}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              <FileSpreadsheet size={15} />
              Export Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par enquêteur ou réponse..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 font-medium text-slate-800 dark:text-slate-200 transition-colors"
            />
          </div>

          <div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 font-medium text-slate-800 dark:text-slate-200 transition-colors"
            >
              <option value="ALL">Tous les groupes d'enquête</option>
              {project.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 font-medium text-slate-800 dark:text-slate-200 transition-colors"
            >
              <option value="ALL">Tous les statuts de qualité</option>
              <option value="valid">Valide uniquement</option>
              <option value="warning">À vérifier (Anomalie possible)</option>
              <option value="incomplete">Incomplète</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {filteredSubmissions.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
            Aucune soumission ne correspond aux filtres sélectionnés.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Enquêteur</th>
                  <th className="py-3 px-4">Groupe</th>
                  <th className="py-3 px-4">Échantillon Réponses</th>
                  <th className="py-3 px-4 text-center">GPS</th>
                  <th className="py-3 px-4 text-center">Qualité</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSubmissions.map((sub) => {
                  const firstAnswers = Object.entries(sub.answers)
                    .slice(0, 2)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' | ');

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(sub.submittedAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {sub.studentName}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {sub.groupName || 'Général'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {firstAnswers || 'Aucune réponse'}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {sub.gps ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold text-[11px] bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded flex items-center justify-center gap-1">
                            <MapPin size={11} /> {sub.gps.latitude.toFixed(3)}
                          </span>
                        ) : sub.gpsStatus ? (
                          <span className="text-amber-600 dark:text-amber-400 text-[10px] font-medium bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                            {sub.gpsStatus === 'denied' ? 'Refusé' : sub.gpsStatus === 'timeout' ? 'Délai' : 'Non requis'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {sub.qualityStatus === 'valid' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
                            Valide
                          </span>
                        )}
                        {sub.qualityStatus === 'warning' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded flex items-center gap-1 mx-auto justify-center w-fit">
                            <AlertTriangle size={11} /> À vérifier
                          </span>
                        )}
                        {sub.qualityStatus === 'incomplete' && (
                          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded">
                            Incomplète
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => setInspectingSub(sub)}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-900 dark:text-amber-400 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <Eye size={13} />
                          Détails
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submission Inspector Modal */}
      {inspectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 flex items-center justify-between border-b border-slate-800">
              <div>
                <h4 className="font-bold text-white text-base">
                  Fiche de Collecte Terrain #{inspectingSub.id.substring(0, 10)}
                </h4>
                <p className="text-xs text-slate-400">
                  Enquêteur : <strong className="text-white">{inspectingSub.studentName}</strong> • {new Date(inspectingSub.submittedAt).toLocaleString('fr-FR')}
                </p>
              </div>
              <button
                onClick={() => setInspectingSub(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Metadata row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Groupe</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{inspectingSub.groupName || 'Général'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Synchronisation</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {inspectingSub.syncStatus === 'synced' ? 'Synchronisé (Cloud)' : 'Local (Attente)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Durée Saisie</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {inspectingSub.durationSeconds ? `${Math.round(inspectingSub.durationSeconds / 60)} min (${inspectingSub.durationSeconds}s)` : 'Non mesurée'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Coordonnées GPS</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {inspectingSub.gps
                      ? `${inspectingSub.gps.latitude.toFixed(4)}, ${inspectingSub.gps.longitude.toFixed(4)}`
                      : inspectingSub.gpsStatus
                      ? `Non acquis (${inspectingSub.gpsStatus})`
                      : 'Aucun point'}
                  </span>
                </div>
              </div>

              {/* Photo preview if attached */}
              {(inspectingSub.photoLocalUrl || inspectingSub.photoStorageUrl || inspectingSub.answers['photo_terrain']) && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-amber-500" />
                      Justificatif Photo de Terrain
                    </span>
                  </div>
                  <img
                    src={inspectingSub.photoStorageUrl || inspectingSub.photoLocalUrl || inspectingSub.answers['photo_terrain']}
                    alt="Photo terrain"
                    className="max-h-48 rounded-xl object-contain border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90"
                    onClick={() => setSelectedImageModal(inspectingSub.photoStorageUrl || inspectingSub.photoLocalUrl || inspectingSub.answers['photo_terrain'])}
                  />
                </div>
              )}

              {/* Answers Breakdown */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
                  Réponses aux Variables du Questionnaire
                </h5>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                  {project.questions.map((q) => {
                    const rawVal = inspectingSub.answers[q.key];
                    let displayVal: any = rawVal;
                    if (rawVal === undefined || rawVal === null) displayVal = <span className="text-slate-400 italic">Non renseigné</span>;
                    else if (typeof rawVal === 'boolean') displayVal = rawVal ? 'Oui' : 'Non';
                    else if (Array.isArray(rawVal)) displayVal = rawVal.join(', ');
                    else if (q.type === 'photo' && rawVal) displayVal = <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Photo capturée</span>;

                    return (
                      <div key={q.id} className="p-3 bg-white dark:bg-slate-800/60 hover:bg-slate-50/50 dark:hover:bg-slate-800 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                        <div className="sm:w-1/2">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{q.label}</div>
                          <div className="text-[10px] font-mono text-slate-400">{q.key}</div>
                        </div>
                        <div className="sm:w-1/2 font-bold text-blue-950 dark:text-amber-400 sm:text-right">
                          {displayVal}
                          {q.unit && rawVal !== undefined && <span className="ml-1 text-slate-500 dark:text-slate-400 font-normal text-[11px]">{q.unit}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quality & Supervisor Review Section */}
              <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950 dark:text-amber-300 text-xs uppercase tracking-wider">
                    Contrôle de Qualité Superviseur
                  </span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Statut actuel : <strong className="uppercase font-mono text-slate-900 dark:text-slate-200">{inspectingSub.qualityStatus}</strong>
                  </span>
                </div>

                {inspectingSub.qualityNotes && inspectingSub.qualityNotes.length > 0 && (
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-300 space-y-1">
                    <span className="font-bold">Alertes détectées :</span>
                    <ul className="list-disc pl-4 space-y-0.5">
                      {inspectingSub.qualityNotes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                    Ajouter une note de validation ou observation :
                  </span>
                  <input
                    type="text"
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Ex: Réponse confirmée après appel téléphonique de l'enquêteur."
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:border-amber-500 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={() => handleSaveQualityReview('valid')}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 size={13} /> Valider la fiche
                  </button>

                  <button
                    onClick={() => handleSaveQualityReview('warning')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <AlertTriangle size={13} /> Marquer à vérifier
                  </button>

                  <button
                    onClick={() => handleSaveQualityReview('incomplete')}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Incomplète
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setInspectingSub(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal Preview */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setSelectedImageModal(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={selectedImageModal}
              alt="Photo grand format"
              className="max-h-[85vh] rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-3 right-3 p-2 bg-slate-950/80 text-white rounded-full hover:bg-slate-900"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
