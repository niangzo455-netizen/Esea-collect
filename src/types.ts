export type UserRole = 'supervisor' | 'student' | 'admin';

export type EseaDepartmentCode = 'ATEGU' | 'DECOF' | 'PEGO';

export interface EseaDepartmentInfo {
  code: EseaDepartmentCode;
  name: string;
  shortName: string;
  description: string;
}

export const ESEA_DEPARTMENTS_CONFIG: Record<EseaDepartmentCode, EseaDepartmentInfo> = {
  ATEGU: {
    code: 'ATEGU',
    name: 'Aménagement du Territoire, Environnement et Gestion Urbaine',
    shortName: 'Aménagement & Urbanisme',
    description: 'Département Aménagement du Territoire, Environnement et Gestion Urbaine',
  },
  DECOF: {
    code: 'DECOF',
    name: 'Développement Communautaire et Formation',
    shortName: 'Dév. Communautaire & Formation',
    description: 'Département Développement Communautaire et Formation',
  },
  PEGO: {
    code: 'PEGO',
    name: 'Planification Economique et Gestion des Organisations',
    shortName: 'Planification & Gestion',
    description: 'Département Planification Economique et Gestion des Organisations',
  },
};

export type InstitutionalScopeType = 'department' | 'multi_department' | 'transversal';

export interface InstitutionalScope {
  type: InstitutionalScopeType;
  departments?: EseaDepartmentCode[];
}

export interface UserProfile {
  id: string; // matches Firebase Auth UID
  uid?: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  department: EseaDepartmentCode | string;
  matricule?: string;
  avatarUrl?: string;
  phone?: string;
  createdAt?: string;
  lastLoginAt?: string;
  isDemo?: boolean;
}

export type QuestionType =
  | 'text_short'
  | 'text_long'
  | 'number'
  | 'date'
  | 'time'
  | 'boolean'
  | 'choice_single'
  | 'choice_multiple'
  | 'dropdown'
  | 'scale'
  | 'gps'
  | 'photo';

export interface QuestionValidation {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  errorMessage?: string;
}

export interface QuestionCondition {
  dependentQuestionId: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'in';
  value: string | number | boolean | string[];
}

export interface Question {
  id: string;
  key: string;
  label: string;
  description?: string;
  type: QuestionType;
  required: boolean;
  options?: string[];
  validation?: QuestionValidation;
  condition?: QuestionCondition;
  unit?: string; // e.g. 'FCFA', 'ans', 'kg'
  order: number;
}

export interface Group {
  id: string;
  name: string;
  zone: string;
  targetCount: number;
  assignedCollectorIds: string[];
}

export interface InvitationCode {
  id: string;
  code: string; // e.g. "THIAK-7K4P"
  projectId?: string;
  groupId?: string;
  groupName?: string;
  createdAt: string;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  active: boolean;
  createdBy?: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected';

export interface JoinRequest {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentMatricule: string;
  requestedGroupId?: string;
  requestedGroupName?: string;
  invitationCode: string;
  status: RequestStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface Mission {
  id: string;
  projectId: string;
  projectTitle: string;
  studentId: string;
  studentName: string;
  groupId?: string;
  groupName?: string;
  zone?: string;
  targetCount: number;
  completedCount: number;
  syncedCount: number;
  pendingCount: number;
  status: 'active' | 'completed';
  assignedAt: string;
}

export type QualityStatus = 'valid' | 'warning' | 'incomplete' | 'error';
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed';

export type GpsAcquisitionStatus = 'acquired' | 'unavailable' | 'denied' | 'timeout' | 'not_requested';

export interface SubmissionGps {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  timestamp?: string;
  status?: GpsAcquisitionStatus;
  errorMessage?: string;
}

export interface Submission {
  id: string; // stable UUID
  projectId: string;
  projectTitle: string;
  missionId?: string;
  studentId: string;
  studentName: string;
  groupId?: string;
  groupName?: string;
  questionnaireVersion?: number;
  answers: Record<string, any>;
  submittedAt: string;
  syncedAt?: string;
  syncStatus: SyncStatus;
  qualityStatus: QualityStatus;
  qualityNotes?: string[];
  gps?: SubmissionGps | null;
  gpsStatus?: GpsAcquisitionStatus;
  gpsErrorReason?: string;
  durationSeconds?: number;
  deviceInfo?: string;
  photoLocalUrl?: string;
  photoStorageUrl?: string;
}

export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface SurveyProject {
  id: string;
  title: string;
  code: string; // e.g. "THIAK-2025"
  description: string;
  department: string;
  institutionalScope?: InstitutionalScope;
  supervisorId: string;
  supervisorName: string;
  supervisorEmail: string;
  isPersonalStudentProject?: boolean;
  status: ProjectStatus;
  targetSubmissions: number;
  currentSubmissions: number;
  questionnaireVersion?: number;
  startDate: string;
  endDate: string;
  groups: Group[];
  invitationCodes: InvitationCode[];
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

export interface SyncStats {
  pendingCount: number;
  syncedCount: number;
  lastSyncTime?: string;
  isOnline: boolean;
  isSyncing: boolean;
  cloudSyncAvailable: boolean;
}

export type ThemePreference = 'light' | 'dark' | 'system';
