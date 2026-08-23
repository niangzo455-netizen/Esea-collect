import React, { useState } from 'react';
import {
  X,
  QrCode,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Send,
  Building,
  GraduationCap,
  Sparkles,
  Camera,
} from 'lucide-react';
import { EseaLogo } from './EseaLogo';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';
import { SurveyProject, InvitationCode, UserProfile } from '../../types';

interface JoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onJoinedSuccess: () => void;
}

export const JoinModal: React.FC<JoinModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onJoinedSuccess,
}) => {
  const [inputCode, setInputCode] = useState('');
  const [matchedProject, setMatchedProject] = useState<{
    project: SurveyProject;
    invitation: InvitationCode;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [scannerMode, setScannerMode] = useState(false);

  if (!isOpen) return null;

  const handleSearchCode = (codeToSearch?: string) => {
    const rawCode = (codeToSearch || inputCode).trim().toUpperCase();
    if (!rawCode) {
      setErrorMsg('Veuillez saisir un code d\'invitation valide.');
      return;
    }

    const projects = eseaStorage.getProjects();
    let found: { project: SurveyProject; invitation: InvitationCode } | null = null;

    for (const p of projects) {
      const inv = p.invitationCodes?.find(
        (i) => i.code.toUpperCase() === rawCode && i.active
      );
      if (inv) {
        found = { project: p, invitation: inv };
        break;
      }
    }

    if (found) {
      setMatchedProject(found);
      setErrorMsg(null);
    } else {
      setMatchedProject(null);
      setErrorMsg(`Aucune enquête active trouvée pour le code "${rawCode}".`);
    }
  };

  const handleSendJoinRequest = async () => {
    if (!matchedProject) return;

    // Check if request or mission already exists
    const existingMissions = eseaStorage.getMissions(currentUser.id);
    const alreadyInMission = existingMissions.some(
      (m) => m.projectId === matchedProject.project.id
    );

    if (alreadyInMission) {
      setErrorMsg('Vous participez déjà à cette mission de collecte.');
      return;
    }

    const existingRequests = eseaStorage.getJoinRequests(matchedProject.project.id);
    const existingReq = existingRequests.find(
      (r) => r.studentId === currentUser.id && r.status === 'pending'
    );

    if (existingReq) {
      setErrorMsg('Une demande pour cette enquête est déjà en attente d\'approbation par le superviseur.');
      return;
    }

    const newReq = {
      projectId: matchedProject.project.id,
      projectTitle: matchedProject.project.title,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      studentMatricule: currentUser.matricule || 'ETU-NON-SPECIFIE',
      requestedGroupId: matchedProject.invitation.groupId,
      requestedGroupName: matchedProject.invitation.groupName,
      invitationCode: matchedProject.invitation.code,
    };

    const saved = eseaStorage.createJoinRequest(newReq);
    if (eseaStorage.isOnline()) {
      await firestoreService.createJoinRequest(saved).catch(console.error);
    }

    setIsSubmitted(true);
    setTimeout(() => {
      onJoinedSuccess();
      onClose();
      setIsSubmitted(false);
      setMatchedProject(null);
      setInputCode('');
    }, 1800);
  };

  const availableSampleCodes = [
    { code: 'THIAK-7K4P', label: 'Enquête Thiakh-Thiakh (Guédiawaye)' },
    { code: 'THIAK-A82F', label: 'Enquête Thiakh-Thiakh (Pikine)' },
    { code: 'SOUMB-2025', label: 'Mareyeuses Soumbédioune' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-slate-950 text-white p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <EseaLogo size={36} />
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Rejoindre une Enquête de Terrain
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                Saisie de code ou scan QR ESEA Collect
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isSubmitted ? (
            <div className="py-8 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
                <CheckCircle2 size={32} />
              </div>
              <h4 className="font-bold text-slate-900 dark:text-slate-100 text-lg">
                Demande transmise avec succès !
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm">
                Le superviseur (<span className="font-semibold text-slate-800 dark:text-slate-200">{matchedProject?.project.supervisorName}</span>) a reçu votre demande de participation. Dès validation, la mission apparaîtra dans votre tableau de bord.
              </p>
            </div>
          ) : (
            <>
              {/* Code entry form */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Code d'invitation fourni par l'enseignant
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.toUpperCase());
                        setErrorMsg(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchCode();
                      }}
                      placeholder="Ex: THIAK-7K4P"
                      className="w-full pl-3 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-base font-bold tracking-widest text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 outline-none uppercase placeholder:font-sans placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => setScannerMode(!scannerMode)}
                      title="Simulateur Scanner QR"
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <QrCode size={18} />
                    </button>
                  </div>

                  <button
                    onClick={() => handleSearchCode()}
                    className="px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-semibold text-sm rounded-xl flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                  >
                    <Search size={16} />
                    Vérifier
                  </button>
                </div>

                {/* Quick suggestions */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-slate-400">Codes actifs :</span>
                  {availableSampleCodes.map((s) => (
                    <button
                      key={s.code}
                      onClick={() => {
                        setInputCode(s.code);
                        handleSearchCode(s.code);
                      }}
                      className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/60 hover:text-amber-800 dark:hover:text-amber-300 hover:border-amber-200 dark:hover:border-amber-800 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      {s.code}
                    </button>
                  ))}
                </div>
              </div>

              {/* QR Scanner Simulator */}
              {scannerMode && (
                <div className="p-4 bg-slate-900 rounded-xl text-white flex flex-col items-center text-center space-y-2 border border-slate-700 animate-in fade-in">
                  <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-400 flex items-center justify-center text-blue-300">
                    <Camera size={20} className="animate-pulse" />
                  </div>
                  <div className="font-semibold text-xs text-slate-200">
                    Scanner optique de QR Code ESEA
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs">
                    Visez le QR Code affiché par votre enseignant ou sélectionnez un code d'invitation ci-dessus.
                  </p>
                  <button
                    onClick={() => {
                      setInputCode('THIAK-7K4P');
                      handleSearchCode('THIAK-7K4P');
                      setScannerMode(false);
                    }}
                    className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Simuler détection QR (THIAK-7K4P)
                  </button>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
                  <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Matched Project Card */}
              {matchedProject && (
                <div className="bg-slate-50 dark:bg-slate-800/70 border-2 border-amber-500/40 rounded-2xl p-4 space-y-3.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 rounded-full">
                      Code : {matchedProject.invitation.code}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Enquête Active
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                      {matchedProject.project.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">
                      {matchedProject.project.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <GraduationCap size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{matchedProject.project.supervisorName}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Building size={14} className="text-slate-500 shrink-0" />
                      <span className="truncate">ESEA - UCAD</span>
                    </div>
                  </div>

                  {matchedProject.invitation.groupName ? (
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2 text-xs text-amber-900 dark:text-amber-300 font-medium">
                      <Users size={15} className="text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Affectation suggérée : <strong>{matchedProject.invitation.groupName}</strong></span>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 rounded-xl flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
                      <Users size={15} className="text-amber-500 shrink-0" />
                      <span>Affectation de zone gérée par l'enseignant</span>
                    </div>
                  )}

                  {/* Student profile reminder */}
                  <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                      Votre profil de collecteur :
                    </div>
                    <div className="flex justify-between text-slate-600 dark:text-slate-400">
                      <span>{currentUser.name}</span>
                      <span className="font-mono">{currentUser.matricule || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between transition-colors">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            {matchedProject && (
              <button
                onClick={handleSendJoinRequest}
                className="px-5 py-2.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-sm rounded-xl flex items-center gap-2 transition-colors shadow-md cursor-pointer"
              >
                <Send size={15} />
                Demander à rejoindre
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
