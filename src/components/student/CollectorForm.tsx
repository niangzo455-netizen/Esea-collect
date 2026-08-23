import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Camera,
  Navigation,
  Send,
  RotateCcw,
  Sparkles,
  WifiOff,
  Clock,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EseaLogo } from '../common/EseaLogo';
import { eseaStorage } from '../../lib/storage';
import { firestoreService } from '../../lib/firestoreService';
import {
  SurveyProject,
  Mission,
  UserProfile,
  Question,
  SubmissionGps,
  GpsAcquisitionStatus,
} from '../../types';

interface CollectorFormProps {
  project: SurveyProject;
  mission?: Mission;
  currentUser: UserProfile;
  onBack: () => void;
  onSubmitted: () => void;
}

export const CollectorForm: React.FC<CollectorFormProps> = ({
  project,
  mission,
  currentUser,
  onBack,
  onSubmitted,
}) => {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [gpsLocation, setGpsLocation] = useState<SubmissionGps | null>(null);
  const [gpsStatus, setGpsStatus] = useState<GpsAcquisitionStatus>('not_requested');
  const [gpsErrorReason, setGpsErrorReason] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [startTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [submittedQuality, setSubmittedQuality] = useState<string>('valid');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter visible questions based on conditional logic
  const isQuestionVisible = (q: Question): boolean => {
    if (!q.condition) return true;
    const parentVal = answers[q.condition.dependentQuestionId];

    const dependentQ = project.questions.find(
      (item) => item.id === q.condition?.dependentQuestionId || item.key === q.condition?.dependentQuestionId
    );
    const parentAnswer = dependentQ ? answers[dependentQ.key] : parentVal;

    switch (q.condition.operator) {
      case 'equals':
        return parentAnswer === q.condition.value;
      case 'not_equals':
        return parentAnswer !== q.condition.value;
      case 'greater_than':
        return Number(parentAnswer) > Number(q.condition.value);
      case 'less_than':
        return Number(parentAnswer) < Number(q.condition.value);
      case 'in':
        return Array.isArray(q.condition.value) && q.condition.value.includes(parentAnswer);
      default:
        return true;
    }
  };

  const visibleQuestions = project.questions.filter(isQuestionVisible);

  // Validate a specific field
  const validateField = (q: Question, value: any): string | null => {
    if (!isQuestionVisible(q)) return null;

    if (q.required) {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return 'Ce champ est obligatoire pour valider le questionnaire.';
      }
    }

    if (value !== undefined && value !== null && value !== '') {
      if (q.type === 'number') {
        const num = Number(value);
        if (isNaN(num)) return 'Veuillez saisir un nombre valide.';
        if (q.validation?.min !== undefined && num < q.validation.min) {
          return q.validation.errorMessage || `La valeur minimale autorisée est ${q.validation.min} ${q.unit || ''}.`;
        }
        if (q.validation?.max !== undefined && num > q.validation.max) {
          return q.validation.errorMessage || `La valeur maximale autorisée est ${q.validation.max} ${q.unit || ''}.`;
        }
      }

      if (q.type === 'text_short' || q.type === 'text_long') {
        if (q.validation?.minLength && String(value).length < q.validation.minLength) {
          return `Minimum ${q.validation.minLength} caractères requis.`;
        }
      }
    }

    return null;
  };

  const handleInputChange = (questionKey: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionKey]: value }));

    const question = project.questions.find((q) => q.key === questionKey);
    if (question) {
      const err = validateField(question, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) {
          next[questionKey] = err;
        } else {
          delete next[questionKey];
        }
        return next;
      });
    }
  };

  // True GPS capture: No fake fallback coordinates are ever generated!
  const handleCaptureGPS = () => {
    setIsLocating(true);
    setGpsErrorReason(null);

    if (!('geolocation' in navigator)) {
      setGpsLocation(null);
      setGpsStatus('unavailable');
      setGpsErrorReason('La géolocalisation n\'est pas supportée par ce navigateur.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc: SubmissionGps = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          altitude: pos.coords.altitude || undefined,
          timestamp: new Date().toISOString(),
          status: 'acquired',
        };
        setGpsLocation(loc);
        setGpsStatus('acquired');
        setGpsErrorReason(null);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation acquisition failed:', err);
        setGpsLocation(null);
        const statusType: GpsAcquisitionStatus =
          err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable';
        setGpsStatus(statusType);
        setGpsErrorReason(
          err.code === 1
            ? 'Autorisation d\'accès GPS refusée par l\'utilisateur ou le terminal.'
            : err.code === 3
            ? 'Délai d\'attente GPS dépassé. Signal satellite trop faible.'
            : 'Position GPS indisponible sur ce terminal.'
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setPhotoPreview(result);
        handleInputChange('photo_terrain', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    visibleQuestions.forEach((q) => {
      const err = validateField(q, answers[q.key]);
      if (err) {
        newErrors[q.key] = err;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    const durationSeconds = Math.max(25, Math.round((Date.now() - startTime) / 1000));

    // Quality check algorithm
    let qualityStatus: 'valid' | 'warning' | 'incomplete' = 'valid';
    const qualityNotes: string[] = [];

    // Quality heuristics:
    if (durationSeconds < 40 && visibleQuestions.length > 5) {
      qualityStatus = 'warning';
      qualityNotes.push(`Saisie très rapide (${durationSeconds}s pour ${visibleQuestions.length} questions), risque de négligence.`);
    }

    if (answers['recette_brute_journaliere'] && Number(answers['recette_brute_journaliere']) > 60000) {
      qualityStatus = 'warning';
      qualityNotes.push('Recette brute déclarée très élevée (> 60 000 FCFA), vérification conseillée.');
    }
    if (answers['age'] && Number(answers['age']) < 18) {
      qualityStatus = 'warning';
      qualityNotes.push('Conducteur mineur (< 18 ans).');
    }

    const isOnline = eseaStorage.isOnline();

    const payload = {
      projectId: project.id,
      projectTitle: project.title,
      missionId: mission?.id,
      studentId: currentUser.id,
      studentName: currentUser.name,
      groupId: mission?.groupId,
      groupName: mission?.groupName,
      questionnaireVersion: project.questionnaireVersion || 1,
      answers,
      qualityStatus,
      qualityNotes,
      gps: gpsLocation,
      gpsStatus,
      gpsErrorReason: gpsErrorReason || undefined,
      durationSeconds,
      photoLocalUrl: photoPreview || undefined,
      deviceInfo: navigator.userAgent.substring(0, 100),
    };

    try {
      await firestoreService.submitQuestionnaire(payload, isOnline);

      try {
        confetti({
          particleCount: 75,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#FFCC00', '#005696', '#059669'],
        });
      } catch (e) {
        // ignore
      }

      setSubmittedQuality(qualityStatus);
      setIsCompleted(true);
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOnline = eseaStorage.isOnline();

  // Completion view
  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 animate-in fade-in zoom-in-95">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-5 transition-colors">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 size={44} />
          </div>

          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
              Questionnaire Enregistré !
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              La fiche de collecte pour l'enquête <span className="font-semibold text-slate-800 dark:text-slate-200">« {project.title} »</span> a été validée avec succès.
            </p>
          </div>

          {/* Sync Status Banner */}
          <div
            className={`p-4 rounded-2xl border text-sm text-left ${
              isOnline
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300'
            }`}
          >
            <div className="font-bold flex items-center gap-2 mb-1">
              {isOnline ? (
                <>
                  <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                  Synchronisation Instantanée Réussie (Firestore Cloud)
                </>
              ) : (
                <>
                  <WifiOff size={18} className="text-amber-700 dark:text-amber-400" />
                  Enregistré Localement (Buffer Hors Ligne)
                </>
              )}
            </div>
            <p className="text-xs opacity-90">
              {isOnline
                ? 'La fiche a été enregistrée en base de données cloud Firestore avec son identifiant unique.'
                : 'Votre questionnaire est sécurisé localement dans le cache persistant de votre appareil. Dès retour du réseau, cliquez sur "Synchroniser" dans l\'en-tête.'}
            </p>
          </div>

          {/* GPS feedback summary */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-left flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-400">Statut GPS de la fiche :</span>
            {gpsLocation ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-mono">
                <MapPin size={13} /> {gpsLocation.latitude.toFixed(4)}, {gpsLocation.longitude.toFixed(4)}
              </span>
            ) : (
              <span className="font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <AlertCircle size={13} /> Absent ({gpsStatus})
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setAnswers({});
                setErrors({});
                setGpsLocation(null);
                setGpsStatus('not_requested');
                setGpsErrorReason(null);
                setPhotoPreview(null);
                setIsCompleted(false);
              }}
              className="px-6 py-3 bg-blue-950 hover:bg-blue-900 text-amber-400 font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              Enquêter une nouvelle personne
            </button>

            <button
              onClick={onSubmitted}
              className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm rounded-xl transition-colors flex items-center justify-center cursor-pointer"
            >
              Retour à mes missions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-6">
      {/* Top Bar / Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          Retour aux missions
        </button>

        <div className="flex items-center gap-2">
          {mission?.groupName && (
            <span className="text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2.5 py-1 rounded-lg hidden sm:inline">
              {mission.groupName}
            </span>
          )}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg font-mono">
            {project.code}
          </span>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-lg overflow-hidden transition-colors">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-5 sm:p-7 border-b border-blue-900/60">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-slate-950 rounded">
                  Collecte ESEA
                </span>
                <span className="text-xs text-slate-300 font-medium">
                  {visibleQuestions.length} questions • v{project.questionnaireVersion || 1}
                </span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white leading-tight">
                {project.title}
              </h1>
              {project.description && (
                <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            <div className="shrink-0 hidden sm:block">
              <EseaLogo size={48} />
            </div>
          </div>

          {/* Offline notice inside banner if offline */}
          {!isOnline && (
            <div className="mt-4 p-2.5 bg-amber-500/20 border border-amber-400/40 rounded-xl flex items-center gap-2 text-xs text-amber-200">
              <WifiOff size={15} className="text-amber-400 shrink-0" />
              <span>
                Mode hors-ligne actif. Vos données seront stockées localement sur ce terminal.
              </span>
            </div>
          )}
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-7 space-y-6 sm:space-y-8">
          {/* Strict Real GPS Capture Bar */}
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Point GPS de l'enquête
                  {gpsLocation && (
                    <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-semibold">
                      Acquis
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {gpsLocation ? (
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                      Lat: {gpsLocation.latitude.toFixed(5)}, Lon: {gpsLocation.longitude.toFixed(5)} (±{gpsLocation.accuracy?.toFixed(1)}m)
                    </span>
                  ) : gpsErrorReason ? (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle size={12} /> {gpsErrorReason}
                    </span>
                  ) : (
                    'Coordonnées recommandées pour fiabiliser la localisation de l\'enquête'
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={isLocating}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                gpsLocation
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs'
              }`}
            >
              <Navigation size={14} className={isLocating ? 'animate-spin' : ''} />
              {isLocating
                ? 'Recherche satellite...'
                : gpsLocation
                ? 'Actualiser position'
                : 'Relever point GPS'}
            </button>
          </div>

          {/* List of Form Questions */}
          <div className="space-y-5">
            {visibleQuestions.map((q, idx) => {
              const val = answers[q.key];
              const err = errors[q.key];

              return (
                <div
                  key={q.id}
                  id={`q-${q.key}`}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    err
                      ? 'bg-red-50/50 dark:bg-red-950/30 border-red-300 dark:border-red-800 shadow-xs'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <label className="block text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 leading-snug">
                      <span className="text-blue-900 dark:text-amber-400 font-mono mr-1.5">{idx + 1}.</span>
                      {q.label}
                      {q.required && (
                        <span className="text-red-500 ml-1 font-bold" title="Requis">*</span>
                      )}
                    </label>

                    {q.unit && (
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded shrink-0">
                        {q.unit}
                      </span>
                    )}
                  </div>

                  {q.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                      {q.description}
                    </p>
                  )}

                  {/* Field Inputs by Type */}
                  <div className="mt-2">
                    {/* Text Short */}
                    {q.type === 'text_short' && (
                      <input
                        type="text"
                        value={val || ''}
                        onChange={(e) => handleInputChange(q.key, e.target.value)}
                        placeholder="Votre réponse ici..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                    )}

                    {/* Text Long */}
                    {q.type === 'text_long' && (
                      <textarea
                        rows={3}
                        value={val || ''}
                        onChange={(e) => handleInputChange(q.key, e.target.value)}
                        placeholder="Observations, détails complémentaires..."
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-y"
                      />
                    )}

                    {/* Number */}
                    {q.type === 'number' && (
                      <div className="relative max-w-xs">
                        <input
                          type="number"
                          value={val !== undefined ? val : ''}
                          onChange={(e) =>
                            handleInputChange(
                              q.key,
                              e.target.value === '' ? '' : Number(e.target.value)
                            )
                          }
                          min={q.validation?.min}
                          max={q.validation?.max}
                          placeholder={q.unit ? `Ex: 15000` : '0'}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                        />
                        {q.unit && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none">
                            {q.unit}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date */}
                    {q.type === 'date' && (
                      <input
                        type="date"
                        value={val || ''}
                        onChange={(e) => handleInputChange(q.key, e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                    )}

                    {/* Time */}
                    {q.type === 'time' && (
                      <input
                        type="time"
                        value={val || ''}
                        onChange={(e) => handleInputChange(q.key, e.target.value)}
                        className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      />
                    )}

                    {/* Boolean (Oui / Non) */}
                    {q.type === 'boolean' && (
                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <button
                          type="button"
                          onClick={() => handleInputChange(q.key, true)}
                          className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            val === true
                              ? 'bg-blue-950 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-blue-950 dark:border-amber-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          Oui
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange(q.key, false)}
                          className={`py-2.5 px-4 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            val === false
                              ? 'bg-blue-950 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-blue-950 dark:border-amber-500 shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          Non
                        </button>
                      </div>
                    )}

                    {/* Choice Single (Radio Tiles) */}
                    {q.type === 'choice_single' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isSelected = val === opt;
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleInputChange(q.key, opt)}
                              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 border-blue-600 dark:border-blue-500 font-semibold shadow-xs'
                                  : 'bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                                  isSelected
                                    ? 'border-blue-600 dark:border-amber-400 bg-blue-600 dark:bg-amber-400'
                                    : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                              >
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-950" />
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Choice Multiple (Checkbox Tiles) */}
                    {q.type === 'choice_multiple' && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const list: string[] = Array.isArray(val) ? val : [];
                          const isChecked = list.includes(opt);
                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const nextList = isChecked
                                  ? list.filter((item) => item !== opt)
                                  : [...list, opt];
                                handleInputChange(q.key, nextList);
                              }}
                              className={`w-full p-3 rounded-xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between transition-all cursor-pointer ${
                                isChecked
                                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 border-blue-600 dark:border-blue-500 font-semibold shadow-xs'
                                  : 'bg-slate-50/70 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700/80'
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ml-2 ${
                                  isChecked
                                    ? 'border-blue-600 dark:border-amber-400 bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-950'
                                    : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-800'
                                }`}
                              >
                                {isChecked && <CheckCircle2 size={12} />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Dropdown */}
                    {q.type === 'dropdown' && q.options && (
                      <select
                        value={val || ''}
                        onChange={(e) => handleInputChange(q.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                      >
                        <option value="">Sélectionner une option...</option>
                        {q.options.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Scale (1-5) */}
                    {q.type === 'scale' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                          {[1, 2, 3, 4, 5].map((num) => {
                            const isSelected = val === num;
                            return (
                              <button
                                key={num}
                                type="button"
                                onClick={() => handleInputChange(q.key, num)}
                                className={`flex-1 py-3 rounded-xl border font-bold text-sm sm:text-base flex flex-col items-center justify-center transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-950 dark:bg-amber-500 text-amber-400 dark:text-slate-950 border-blue-950 dark:border-amber-500 shadow-md scale-105'
                                    : 'bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                                }`}
                              >
                                {num}
                              </button>
                            );
                          })}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium px-1">
                          <span>1 = Faible / Insatisfait</span>
                          <span>5 = Élevé / Très satisfait</span>
                        </div>
                      </div>
                    )}

                    {/* GPS embedded */}
                    {q.type === 'gps' && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
                        <span>Coordonnées relevées par le bouton GPS en haut de page.</span>
                        <span className={`font-mono font-bold ${
                          gpsLocation ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                        }`}>
                          {gpsLocation ? '✓ GPS Capturé' : 'Non capturé'}
                        </span>
                      </div>
                    )}

                    {/* Photo */}
                    {q.type === 'photo' && (
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={fileInputRef}
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />

                        {photoPreview ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 max-w-xs">
                            <img
                              src={photoPreview}
                              alt="Aperçu terrain"
                              className="w-full h-40 object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setPhotoPreview(null);
                                handleInputChange(q.key, null);
                              }}
                              className="absolute top-2 right-2 px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg shadow-md cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-3 bg-slate-50 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors cursor-pointer"
                          >
                            <Camera size={16} className="text-amber-500" />
                            Prendre une photo / Justificatif terrain
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Field Error Message */}
                  {err && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400 font-semibold animate-in fade-in">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>{err}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Submission Bar */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 text-center sm:text-left">
              Enquêteur : <span className="font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</span> ({currentUser.matricule || 'ESEA'})
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 py-3.5 bg-blue-950 hover:bg-blue-900 text-amber-400 font-extrabold text-sm rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>Enregistrement en cours...</>
              ) : (
                <>
                  <Send size={16} />
                  Valider et Enregistrer la Fiche
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
