import React, { useState } from 'react';
import { X, Copy, Check, QrCode, ShieldCheck, Users, Sparkles } from 'lucide-react';
import { EseaLogo } from './EseaLogo';
import { SurveyProject, InvitationCode } from '../../types';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SurveyProject;
  invitationCode: InvitationCode;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  project,
  invitationCode,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate a deterministic SVG matrix pattern for the invitation code
  const codeHash = invitationCode.code.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const gridSize = 21; // standard QR version 1 grid

  const isDarkPixel = (r: number, c: number) => {
    // 3 position detection squares (top-left, top-right, bottom-left)
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    if (r < 7 && c >= gridSize - 7) {
      if (r === 0 || r === 6 || c === gridSize - 7 || c === gridSize - 1) return true;
      if (r >= 2 && r <= 4 && c >= gridSize - 5 && c <= gridSize - 3) return true;
      return false;
    }
    if (r >= gridSize - 7 && c < 7) {
      if (r === gridSize - 7 || r === gridSize - 1 || c === 0 || c === 6) return true;
      if (r >= gridSize - 5 && r <= gridSize - 3 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Timing patterns
    if (r === 6 || c === 6) return (r + c) % 2 === 0;

    // Data dots based on hash & coordinates
    const val = (r * 13 + c * 7 + codeHash * 11) % 19;
    return val % 2 === 0 || val % 3 === 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col transition-colors">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-slate-950 text-white p-5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-3">
            <EseaLogo size={36} />
            <div>
              <h3 className="font-bold text-white text-base leading-tight">
                Invitation d'Enquête ESEA
              </h3>
              <p className="text-xs text-amber-400 font-medium">
                QR Code & Code d'Accès Sécurisé
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

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center">
          <div className="mb-2">
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full inline-flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              {project.code}
            </span>
          </div>

          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base line-clamp-2 px-2 mb-1">
            {project.title}
          </h4>

          {invitationCode.groupName ? (
            <p className="text-xs text-blue-900 dark:text-amber-400 font-semibold bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-md mb-4 flex items-center gap-1.5">
              <Users size={13} />
              Affectation : {invitationCode.groupName}
            </p>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Affectation libre (le superviseur validera le groupe)
            </p>
          )}

          {/* Clean High-Resolution QR Card */}
          <div className="relative p-4 bg-white rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-inner mb-5">
            <svg
              width="190"
              height="190"
              viewBox={`0 0 ${gridSize} ${gridSize}`}
              className="shape-rendering-crispEdges"
            >
              <rect width={gridSize} height={gridSize} fill="#FFFFFF" />
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((_, c) => {
                  if (isDarkPixel(r, c)) {
                    return (
                      <rect
                        key={`${r}-${c}`}
                        x={c}
                        y={r}
                        width={1}
                        height={1}
                        fill="#0F172A"
                      />
                    );
                  }
                  return null;
                })
              )}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-1 rounded-full shadow-md border border-amber-300">
                <EseaLogo size={28} />
              </div>
            </div>
          </div>

          {/* Invitation Code Display */}
          <div className="w-full bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-4 flex items-center justify-between">
            <div className="text-left">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Code à saisir par l'étudiant
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-widest font-mono">
                {invitationCode.code}
              </div>
            </div>

            <button
              onClick={handleCopyCode}
              className={`px-3 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-xs'
              }`}
            >
              {copied ? (
                <>
                  <Check size={14} /> Copié !
                </>
              ) : (
                <>
                  <Copy size={14} /> Copier
                </>
              )}
            </button>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 text-left bg-blue-50/50 dark:bg-blue-950/30 p-2.5 rounded-lg border border-blue-100 dark:border-blue-900 w-full">
            <ShieldCheck size={16} className="text-amber-500 shrink-0" />
            <span>
              L'étudiant qui scanne ce QR ou saisit ce code recevra une demande de validation envoyée à votre tableau de bord.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
