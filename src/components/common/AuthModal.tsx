import React, { useState } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Hash,
} from 'lucide-react';
import { useAuth } from '../../lib/authContext';
import { UserRole, EseaDepartmentCode } from '../../types';
import { ESEA_DEPARTMENTS } from '../../data/mockData';
import { EseaLogo } from './EseaLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'signin',
}) => {
  const { signIn, signUp, signInWithGoogle, loginDemo, loading } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState<string>('ATEGU');
  const [matricule, setMatricule] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    try {
      if (mode === 'signin') {
        if (!email || !password) {
          setError('Veuillez remplir tous les champs.');
          return;
        }
        await signIn(email, password);
        onClose();
      } else {
        if (!email || !password || !firstName || !lastName) {
          setError('Veuillez renseigner toutes les informations obligatoires.');
          return;
        }
        if (password.length < 6) {
          setError('Le mot de passe doit contenir au moins 6 caractères.');
          return;
        }
        await signUp({
          email,
          password,
          firstName,
          lastName,
          role,
          department,
          matricule: matricule || undefined,
        });
        setSuccessMsg('Compte créé avec succès !');
        setTimeout(() => {
          onClose();
        }, 800);
      }
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError(
          "Le mode d'authentification par Adresse e-mail / Mot de passe n'est pas encore activé dans Firebase Console (Authentication > Sign-in method > Email/Password)."
        );
      } else if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        setError('Identifiants incorrects. Vérifiez votre email et mot de passe.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà associé à un compte existant.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresse email invalide.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe doit comporter au moins 6 caractères.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Problème de connexion réseau. Vérifiez votre accès Internet.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Trop de tentatives infructueuses. Veuillez réessayer plus tard.');
      } else {
        setError(err.message || 'Une erreur est survenue lors de l\'authentification.');
      }
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setError(null);
    try {
      await loginDemo(demoRole);
      onClose();
    } catch (err: any) {
      setError('Erreur lors du chargement du profil démo.');
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithGoogle(role, department);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Connexion Google annulée par l\'utilisateur.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Le fournisseur Google Sign-In n\'est pas encore activé dans Firebase Console (Authentication > Sign-in method > Google).');
      } else {
        setError(err.message || 'Erreur lors de la connexion avec Google.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 transition-colors">
        {/* Header decoration */}
        <div className="bg-linear-to-r from-blue-950 via-slate-900 to-blue-900 dark:from-slate-950 dark:via-blue-950 dark:to-slate-900 px-6 py-6 text-white border-b border-blue-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EseaLogo className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  ESEA Collect <span className="text-xs px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">v1.1 Cloud</span>
                </h2>
                <p className="text-xs text-blue-200">Authentification & Sécurité Institutionnelle</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl mt-5 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Se Connecter
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Créer un Compte
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/80 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-300 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center gap-3 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Prénom *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Mamadou"
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Nom *
                    </label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Diallo"
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rôle Institutionnel *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole('student')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        role === 'student'
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-slate-900 dark:text-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <GraduationCap className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Étudiant Enquêteur</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Collecte de terrain & missions</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole('supervisor')}
                      className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                        role === 'supervisor'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/30 text-slate-900 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                      <div>
                        <div className="font-semibold text-xs text-slate-900 dark:text-slate-100">Superviseur / Pr.</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">Création, contrôle & export</div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Département de rattachement ESEA
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-amber-500"
                    >
                      {ESEA_DEPARTMENTS.map((dept) => (
                        <option key={dept.code} value={dept.code}>
                          {dept.code} — {dept.shortName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {role === 'student' ? 'Matricule Étudiant' : 'Code Enseignant'}
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={matricule}
                        onChange={(e) => setMatricule(e.target.value)}
                        placeholder={role === 'student' ? 'ESEA-2024-042' : 'ENS-884'}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse Email *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@esea.sn ou votre email"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Mot de Passe *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-950 hover:bg-blue-900 text-amber-400 font-semibold rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Ouvrir la session' : 'Finaliser l\'inscription'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Alternative Google Sign In */}
          <div className="mt-4">
            <div className="relative flex items-center justify-center mb-3">
              <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
              <span className="bg-white dark:bg-slate-900 px-3 text-xs text-slate-400 font-medium absolute">
                ou
              </span>
            </div>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continuer avec Google</span>
            </button>
          </div>

          {/* Quick Demo Selector for seamless testing */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Comptes Pilotes de Démonstration (ESEA)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDemoLogin('supervisor')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-950 text-amber-400 flex items-center justify-center text-xs font-bold shrink-0">
                    BD
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-amber-400">
                      Pr. Babacar Diagne
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Superviseur Enquête</div>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('student')}
                className="p-3 text-left rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-xs font-bold shrink-0">
                    AN
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-amber-400">
                      Aïssatou Ndiaye
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">Enquêtrice Dakar</div>
                  </div>
                </div>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
              Permet de tester instantanément les deux parcours sans ressaisir d'email.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
