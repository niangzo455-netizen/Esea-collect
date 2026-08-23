import React, { useState } from 'react';
import {
  Users,
  Plus,
  QrCode,
  Copy,
  Check,
  UserCheck,
  UserX,
  Target,
  MapPin,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { SurveyProject, Group, InvitationCode, JoinRequest } from '../../types';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';
import { QrCodeModal } from '../common/QrCodeModal';

interface TeamManagerProps {
  project: SurveyProject;
  onProjectUpdated: (updatedProject: SurveyProject) => void;
}

export const TeamManager: React.FC<TeamManagerProps> = ({
  project,
  onProjectUpdated,
}) => {
  const [selectedInvitationForQR, setSelectedInvitationForQR] =
    useState<InvitationCode | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Group State
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupZone, setNewGroupZone] = useState('');
  const [newGroupTarget, setNewGroupTarget] = useState(50);

  // New Code State
  const [showAddCode, setShowAddCode] = useState(false);
  const [newCodeCustom, setNewCodeCustom] = useState('');
  const [newCodeGroupId, setNewCodeGroupId] = useState('');

  const joinRequests = eseaStorage.getJoinRequests(project.id);
  const pendingRequests = joinRequests.filter((r) => r.status === 'pending');
  const missions = eseaStorage.getMissions().filter((m) => m.projectId === project.id);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    const newGrp: Group = {
      id: `grp-${Date.now()}`,
      name: newGroupName.trim(),
      zone: newGroupZone.trim() || 'Zone d\'enquête non précisée',
      targetCount: Number(newGroupTarget) || 50,
      assignedCollectorIds: [],
    };

    const updatedGroups = [...project.groups, newGrp];
    const updatedProj = { ...project, groups: updatedGroups, updatedAt: new Date().toISOString() };
    eseaStorage.saveProject(updatedProj);
    if (eseaStorage.isOnline()) {
      firestoreService.saveProject(updatedProj).catch(console.error);
    }
    onProjectUpdated(updatedProj);

    setNewGroupName('');
    setNewGroupZone('');
    setShowAddGroup(false);
  };

  const handleCreateInvitationCode = () => {
    const raw = (
      newCodeCustom ||
      `${project.code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    )
      .trim()
      .toUpperCase();

    const group = project.groups.find((g) => g.id === newCodeGroupId);

    const newInv: InvitationCode = {
      id: `inv-${Date.now()}`,
      code: raw,
      groupId: group?.id,
      groupName: group?.name,
      createdAt: new Date().toISOString(),
      usedCount: 0,
      active: true,
    };

    const updatedCodes = [...project.invitationCodes, newInv];
    const updatedProj = { ...project, invitationCodes: updatedCodes, updatedAt: new Date().toISOString() };
    eseaStorage.saveProject(updatedProj);
    if (eseaStorage.isOnline()) {
      firestoreService.saveProject(updatedProj).catch(console.error);
    }
    onProjectUpdated(updatedProj);

    setNewCodeCustom('');
    setNewCodeGroupId('');
    setShowAddCode(false);
  };

  const handleAcceptRequest = async (request: JoinRequest) => {
    eseaStorage.updateJoinRequestStatus(request.id, 'accepted');
    if (eseaStorage.isOnline()) {
      await firestoreService.updateJoinRequestStatus(request.id, 'accepted').catch(console.error);
    }
    const updated = eseaStorage.getProjectById(project.id);
    if (updated) onProjectUpdated(updated);
  };

  const handleRejectRequest = async (request: JoinRequest) => {
    eseaStorage.updateJoinRequestStatus(request.id, 'rejected');
    if (eseaStorage.isOnline()) {
      await firestoreService.updateJoinRequestStatus(request.id, 'rejected').catch(console.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. Pending Join Requests Queue */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 flex items-center justify-center font-bold">
              {pendingRequests.length}
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Demandes d'Adhésion Étudiants en Attente
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Validez les candidatures des étudiants ayant scanné un code d'invitation.
              </p>
            </div>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
            Aucune demande d'adhésion en attente.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {req.studentName}
                    </span>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                      {req.studentMatricule}
                    </span>
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-2">
                    <span>{req.studentEmail}</span>
                    <span>•</span>
                    <span className="text-blue-900 dark:text-amber-400 font-semibold">
                      Code utilisé : {req.invitationCode}
                    </span>
                    {req.requestedGroupName && (
                      <span className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                        Groupe suggéré : {req.requestedGroupName}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRejectRequest(req)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <UserX size={14} />
                    Refuser
                  </button>

                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <UserCheck size={14} />
                    Accepter & Assigner
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Invitation Codes & QR Generator */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <QrCode size={18} className="text-amber-500" />
              Codes d'Invitation & QR Codes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Chaque code permet à un étudiant de postuler à l'enquête ou à un groupe spécifique.
            </p>
          </div>

          <button
            onClick={() => setShowAddCode(true)}
            className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus size={14} />
            Générer un code d'invitation
          </button>
        </div>

        {/* Create Code Form Drawer */}
        {showAddCode && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Nouveau Code d'Invitation
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Code personnalisé (laisser vide pour générer automatiquement)
                </span>
                <input
                  type="text"
                  value={newCodeCustom}
                  onChange={(e) => setNewCodeCustom(e.target.value.toUpperCase())}
                  placeholder="Ex: THIAK-2025-PIKINE"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono uppercase font-bold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  Groupe / Zone assigné (Facultatif)
                </span>
                <select
                  value={newCodeGroupId}
                  onChange={(e) => setNewCodeGroupId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-900 dark:text-slate-100"
                >
                  <option value="">Aucun groupe précis (Attribution libre)</option>
                  {project.groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCode(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateInvitationCode}
                className="px-4 py-1.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Créer le code
              </button>
            </div>
          </div>
        )}

        {/* List of active invitation codes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {project.invitationCodes.map((inv) => (
            <div
              key={inv.id}
              className="p-4 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-black font-mono tracking-widest text-slate-900 dark:text-slate-100">
                    {inv.code}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded">
                    Actif
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {inv.groupName ? (
                    <span className="font-semibold text-blue-900 dark:text-amber-400">{inv.groupName}</span>
                  ) : (
                    <span>Affectation globale</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setSelectedInvitationForQR(inv)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-950 dark:text-amber-400 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <QrCode size={13} />
                  QR Code
                </button>

                <button
                  onClick={() => handleCopy(inv.code)}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                >
                  {copiedCode === inv.code ? (
                    <>
                      <Check size={13} className="text-emerald-600 dark:text-emerald-400" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copier
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Groups & Zones Management */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
              <Users size={18} className="text-amber-500" />
              Groupes d'Enquête & Zones Géographiques ({project.groups.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Répartissez les objectifs de collecte par zone ou quartier de Dakar.
            </p>
          </div>

          <button
            onClick={() => setShowAddGroup(true)}
            className="px-3.5 py-2 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus size={14} />
            Ajouter un groupe
          </button>
        </div>

        {/* Add Group Drawer */}
        {showAddGroup && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-blue-200 dark:border-blue-900 space-y-3 animate-in fade-in">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Nouveau Groupe / Zone d'enquête
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Nom du groupe</span>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Ex: Groupe A — Guédiawaye"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Zone / Quartiers</span>
                <input
                  type="text"
                  value={newGroupZone}
                  onChange={(e) => setNewGroupZone(e.target.value)}
                  placeholder="Ex: Hamo, Notaire, Golf"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400">Objectif (questionnaires)</span>
                <input
                  type="number"
                  value={newGroupTarget}
                  onChange={(e) => setNewGroupTarget(Number(e.target.value))}
                  placeholder="50"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddGroup(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-1.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
              >
                Créer le groupe
              </button>
            </div>
          </div>
        )}

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {project.groups.map((grp) => (
            <div
              key={grp.id}
              className="p-5 bg-slate-50/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    {grp.name}
                  </h4>
                  <span className="text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-2 py-0.5 rounded">
                    Obj : {grp.targetCount}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  <span>{grp.zone}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400 font-medium">
                  {grp.assignedCollectorIds.length} enquêteur(s) affecté(s)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Active Collectors & Missions Progress */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-5 sm:p-6 space-y-4 transition-colors">
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
          Suivi des Enquêteurs Terrain ({missions.length})
        </h3>

        {missions.length === 0 ? (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
            Aucun collecteur n'a encore été assigné.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="py-3 px-4">Étudiant (Enquêteur)</th>
                  <th className="py-3 px-4">Groupe / Zone</th>
                  <th className="py-3 px-4 text-center">Objectif</th>
                  <th className="py-3 px-4 text-center">Réalisé</th>
                  <th className="py-3 px-4 text-center">Avancement</th>
                  <th className="py-3 px-4 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {missions.map((m) => {
                  const percent =
                    m.targetCount > 0
                      ? Math.min(100, Math.round((m.completedCount / m.targetCount) * 100))
                      : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                        {m.studentName}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {m.groupName || 'Général'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {m.targetCount}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-blue-900 dark:text-amber-400">
                        {m.completedCount}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
                            {percent}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
                          Actif
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Code Modal Display */}
      {selectedInvitationForQR && (
        <QrCodeModal
          isOpen={true}
          onClose={() => setSelectedInvitationForQR(null)}
          project={project}
          invitationCode={selectedInvitationForQR}
        />
      )}
    </div>
  );
};
