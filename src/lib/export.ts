import * as XLSX from 'xlsx';
import { SurveyProject, Submission } from '../types';

export function exportProjectDataToCSV(project: SurveyProject, submissions: Submission[]): void {
  const headers = [
    'ID_Soumission',
    'Date_Collecte',
    'Date_Synchronisation',
    'Statut_Synchro',
    'Qualite_Donnee',
    'Matricule_Enqueteur',
    'Nom_Enqueteur',
    'Groupe_Enquete',
    'Latitude_GPS',
    'Longitude_GPS',
    'Duree_Secondes',
    ...project.questions.map((q) => `${q.key}__${q.label.substring(0, 40).replace(/[^a-zA-Z0-9_]/g, '_')}`),
    'Notes_Qualite',
  ];

  const rows = submissions.map((sub) => {
    const questionValues = project.questions.map((q) => {
      const val = sub.answers[q.key];
      if (val === undefined || val === null) return '';
      if (typeof val === 'boolean') return val ? 'OUI' : 'NON';
      if (Array.isArray(val)) return val.join('; ');
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    });

    return [
      sub.id,
      sub.submittedAt,
      sub.syncedAt || '',
      sub.syncStatus,
      sub.qualityStatus,
      sub.studentId,
      sub.studentName,
      sub.groupName || 'Non assigné',
      sub.gps?.latitude ? sub.gps.latitude.toFixed(6) : '',
      sub.gps?.longitude ? sub.gps.longitude.toFixed(6) : '',
      sub.durationSeconds ? String(sub.durationSeconds) : '',
      ...questionValues,
      sub.qualityNotes ? sub.qualityNotes.join(' | ') : '',
    ];
  });

  // Convert to CSV with UTF-8 BOM
  const csvContent =
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join(
      '\r\n'
    );

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
  link.setAttribute('download', `ESEA_Collect_${project.code}_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportProjectDataToExcel(project: SurveyProject, submissions: Submission[]): void {
  // Sheet 1: Raw Data
  const rawData = submissions.map((sub, index) => {
    const rowObj: Record<string, any> = {
      'N°': index + 1,
      'ID Soumission': sub.id,
      'Date & Heure': new Date(sub.submittedAt).toLocaleString('fr-FR'),
      'Statut Sync': sub.syncStatus === 'synced' ? 'Synchronisé' : 'En attente',
      'Contrôle Qualité':
        sub.qualityStatus === 'valid'
          ? 'Valide'
          : sub.qualityStatus === 'warning'
          ? 'À vérifier'
          : sub.qualityStatus === 'incomplete'
          ? 'Incomplète'
          : 'Erreur',
      'Enquêteur (Étudiant)': sub.studentName,
      Groupe: sub.groupName || 'Général',
      'Latitude GPS': sub.gps?.latitude || '',
      'Longitude GPS': sub.gps?.longitude || '',
      'Durée (sec)': sub.durationSeconds || '',
    };

    project.questions.forEach((q) => {
      const val = sub.answers[q.key];
      let formattedVal = val;
      if (val === undefined || val === null) {
        formattedVal = '';
      } else if (typeof val === 'boolean') {
        formattedVal = val ? 'Oui' : 'Non';
      } else if (Array.isArray(val)) {
        formattedVal = val.join(', ');
      }
      rowObj[q.label] = formattedVal;
    });

    if (sub.qualityNotes && sub.qualityNotes.length > 0) {
      rowObj['Remarques Contrôle'] = sub.qualityNotes.join('; ');
    }

    return rowObj;
  });

  // Sheet 2: Project Metadata & Dictionary
  const dictionaryData = project.questions.map((q, idx) => ({
    'N° Ordre': idx + 1,
    'Variable (Key)': q.key,
    'Libellé Question': q.label,
    Type: q.type,
    Obligatoire: q.required ? 'Oui' : 'Non',
    Unité: q.unit || '-',
    'Options / Modalités': q.options ? q.options.join(' | ') : '-',
    'Règle Validation': q.validation
      ? `Min: ${q.validation.min ?? '-'}, Max: ${q.validation.max ?? '-'}`
      : 'Aucune',
    'Condition d\'affichage': q.condition
      ? `Si [${q.condition.dependentQuestionId}] = ${q.condition.value}`
      : 'Toujours visible',
  }));

  // Sheet 3: Groups and collectors
  const groupsSummary = project.groups.map((g) => ({
    Groupe: g.name,
    Zone: g.zone,
    'Objectif Collectes': g.targetCount,
    'Nombre Enquêteurs': g.assignedCollectorIds.length,
  }));

  const wb = XLSX.utils.book_new();

  const wsRaw = XLSX.utils.json_to_sheet(rawData);
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Données_Brutes');

  const wsDict = XLSX.utils.json_to_sheet(dictionaryData);
  XLSX.utils.book_append_sheet(wb, wsDict, 'Dictionnaire_Variables');

  if (groupsSummary.length > 0) {
    const wsGroups = XLSX.utils.json_to_sheet(groupsSummary);
    XLSX.utils.book_append_sheet(wb, wsGroups, 'Groupes_Zones');
  }

  const sanitizedTitle = project.title.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 30);
  XLSX.writeFile(wb, `ESEA_Collect_${project.code}_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
