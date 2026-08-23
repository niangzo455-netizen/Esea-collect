import React, { useState } from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  GraduationCap,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Laptop,
  LogIn,
  LogOut,
  ShieldCheck,
  Cloud,
  CheckCircle2,
  AlertCircle,
  User,
  Building2,
} from 'lucide-react';
import { EseaLogo } from './EseaLogo';
import { eseaStorage } from '../../lib/storage';
import { UserProfile, EseaDepartmentCode, ESEA_DEPARTMENTS_CONFIG } from '../../types';
import { useTheme } from '../../lib/themeContext';
import { useAuth } from '../../lib/authContext';
import { AuthModal } from './AuthModal';

interface HeaderProps {
  currentUser: UserProfile;
  isOnline: boolean;
  pendingSyncCount: number;
  onRoleSwitch: (role: 'supervisor' | 'student') => void;
  onSyncTrigger: () => void;
  isSyncing: boolean;
  onOpenJoinModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  isOnline,
  pendingSyncCount,
  onRoleSwitch,
  onSyncTrigger,
  isSyncing,
  onOpenJoinModal,
}) => {
  const { theme, setTheme, isDark } = useTheme();
  const { user, profile, isDemoMode: authIsDemo, signOut } = useAuth();
  const [, setStorageVersion] = useState(0);

  // Subscribe to storage changes to ensure badge and status update reactively
  React.useEffect(() => {
    const unsub = eseaStorage.subscribe(() => {
      setStorageVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  const isStorageDemo = eseaStorage.isDemoMode();
  const isDemo = authIsDemo || isStorageDemo;

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  const handleToggleOnline = () => {
    eseaStorage.toggleOnlineStatus();
  };

  const handleLoadDemo = () => {
    try {
      eseaStorage.loadDemoData();
      setShowRoleMenu(false);
    } catch (e) {
      console.error('Failed to load demo data:', e);
    }
  };

  const handleClearDemo = () => {
    try {
      eseaStorage.resetToCleanState();
      setShowRoleMenu(false);
    } catch (e) {
      console.error('Failed to reset clean state:', e);
    }
  };

  const handleOpenAuth = (mode: 'signin' | 'signup') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
    setShowRoleMenu(false);
  };

  const deptCode = currentUser.department as EseaDepartmentCode;
  const deptInfo = ESEA_DEPARTMENTS_CONFIG[deptCode];
  const deptDisplayName = deptInfo ? `${deptInfo.code} (${deptInfo.shortName})` : currentUser.department;

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-18">
            {/* Logo & Institution Brand */}
            <div className="flex items-center gap-3">
              <EseaLogo size={42} showText={true} />
              <div className="hidden lg:flex items-center gap-1.5 ml-2 pl-3 border-l border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Université Cheikh Anta Diop de Dakar
                </span>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                  ATEGU • DECOF • PEGO
                </span>
              </div>
            </div>

            {/* Controls & Right section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Direct Environment Switcher Button in Header Bar */}
              {isStorageDemo ? (
                <button
                  onClick={handleClearDemo}
                  title="Cliquer pour effacer toutes les données démo et activer l'environnement vierge"
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/80 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 transition-all shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 shrink-0" />
                  <span className="hidden md:inline">Vider données démo (Activer vierge)</span>
                  <span className="md:hidden">Vider démo</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Environnement Vierge</span>
                  </span>
                  <button
                    onClick={handleLoadDemo}
                    title="Charger les projets et missions de démonstration ESEA pour tester"
                    className="flex items-center gap-1 px-2 sm:px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Charger Démo</span>
                  </button>
                </div>
              )}
              {/* Theme Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowThemeMenu(!showThemeMenu)}
                  title={`Thème actuel : ${theme}`}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60 transition-colors cursor-pointer"
                >
                  {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-600" />}
                </button>

                {showThemeMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
                    <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Apparence
                      </div>
                      <button
                        onClick={() => {
                          setTheme('light');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Sun className="w-3.5 h-3.5" />
                        <span>Clair (Light)</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme('dark');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Moon className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sombre (Dark)</span>
                      </button>
                      <button
                        onClick={() => {
                          setTheme('system');
                          setShowThemeMenu(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          theme === 'system'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Laptop className="w-3.5 h-3.5" />
                        <span>Système Auto</span>
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Online / Offline Simulator Toggle */}
              <button
                onClick={handleToggleOnline}
                title="Cliquer pour simuler une coupure de réseau terrain ou basculer en mode connecté"
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isOnline
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                    : 'bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 border-amber-300 dark:border-amber-800/80 animate-pulse'
                }`}
              >
                {isOnline ? (
                  <>
                    <Wifi size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="hidden sm:inline">En Ligne</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={14} className="text-amber-700 dark:text-amber-400 shrink-0" />
                    <span>Hors Ligne</span>
                  </>
                )}
              </button>

              {/* Pending Sync Badge & Trigger */}
              {pendingSyncCount > 0 && (
                <button
                  onClick={onSyncTrigger}
                  disabled={!isOnline || isSyncing}
                  title={
                    isOnline
                      ? 'Synchroniser les fiches locales avec Firestore'
                      : 'Passez en mode En Ligne pour synchroniser'
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                    isOnline
                      ? 'bg-blue-950 dark:bg-blue-900 text-amber-400 hover:bg-blue-900 dark:hover:bg-blue-800 hover:shadow'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <RefreshCw
                    size={13}
                    className={`shrink-0 ${isSyncing ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {pendingSyncCount} {pendingSyncCount > 1 ? 'fiches' : 'fiche'} en attente
                  </span>
                </button>
              )}

              {/* User Account / Role Switcher Pill */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700/80 rounded-xl transition-colors text-left cursor-pointer"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                      currentUser.role === 'supervisor'
                        ? 'bg-blue-950 text-amber-400'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {currentUser.role === 'supervisor' ? (
                      <GraduationCap size={16} />
                    ) : (
                      <UserCheck size={16} />
                    )}
                  </div>

                  <div className="hidden md:flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 leading-none">
                        {currentUser.name}
                      </span>
                      {isDemo ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 rounded font-medium">
                          Démo
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-medium flex items-center gap-0.5">
                          <ShieldCheck size={10} /> Cloud
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {currentUser.role === 'supervisor'
                        ? 'Superviseur (Enseignant)'
                        : 'Étudiant (Collecteur)'}
                    </span>
                  </div>
                </button>

                {/* Account & Role Dropdown */}
                {showRoleMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowRoleMenu(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-2.5 z-50 animate-in fade-in zoom-in-95">
                      {/* Current Session Summary */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl mb-2.5 border border-slate-100 dark:border-slate-700/60">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                            Session Active
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isStorageDemo
                              ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                          }`}>
                            {isStorageDemo ? 'Jeu de Démo Actif' : (user ? 'Firebase Connecté' : 'Pilote (Vierge)')}
                          </span>
                        </div>
                        <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                          {currentUser.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {currentUser.email}
                        </div>
                        <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1">
                          <Building2 size={12} className="shrink-0" />
                          <span>{deptDisplayName}</span>
                        </div>
                      </div>

                      {/* Real Firebase Auth Actions */}
                      <div className="mb-2.5 space-y-1">
                        {user ? (
                          <button
                            onClick={() => {
                              signOut();
                              setShowRoleMenu(false);
                            }}
                            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            <LogOut size={14} />
                            <span>Se Déconnecter de Firebase</span>
                          </button>
                        ) : (
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              onClick={() => handleOpenAuth('signin')}
                              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-blue-950 hover:bg-blue-900 text-amber-400 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              <LogIn size={13} />
                              <span>Connexion</span>
                            </button>
                            <button
                              onClick={() => handleOpenAuth('signup')}
                              className="flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <User size={13} />
                              <span>S'inscrire</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Demo & Pilot Environment Switcher */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-1">
                          Environnement & Données ESEA
                        </div>

                        <button
                          onClick={handleClearDemo}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-300 rounded-xl text-xs font-semibold border border-red-200 dark:border-red-800/60 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={13} />
                          <span>Vider données démo (Activer vierge)</span>
                        </button>

                        <button
                          onClick={handleLoadDemo}
                          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-900 dark:text-blue-300 rounded-xl text-xs font-semibold border border-blue-200 dark:border-blue-800/60 transition-colors cursor-pointer"
                        >
                          <Sparkles size={13} className="text-amber-500" />
                          <span>Charger les données démo ESEA</span>
                        </button>

                        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-1.5 px-1">
                          Rôles rapides
                        </div>

                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            onClick={() => {
                              onRoleSwitch('supervisor');
                              setShowRoleMenu(false);
                            }}
                            className={`flex items-center gap-1.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                              currentUser.role === 'supervisor'
                                ? 'bg-blue-950 text-amber-400 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <GraduationCap size={14} className="shrink-0" />
                            <span className="text-xs truncate">Superviseur</span>
                          </button>

                          <button
                            onClick={() => {
                              onRoleSwitch('student');
                              setShowRoleMenu(false);
                            }}
                            className={`flex items-center gap-1.5 p-2 rounded-xl text-left transition-colors cursor-pointer ${
                              currentUser.role === 'student'
                                ? 'bg-amber-500 text-slate-950 font-bold'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                          >
                            <UserCheck size={14} className="shrink-0" />
                            <span className="text-xs truncate">Étudiant</span>
                          </button>
                        </div>
                      </div>

                      {/* Footer info & Reset */}
                      <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center px-1">
                        <button
                          onClick={handleClearDemo}
                          title="Réinitialiser l'application à l'état vierge"
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw size={11} />
                          État propre
                        </button>

                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          v1.1.1 • ESEA Normalisé
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authModalMode}
      />
    </>
  );
};
