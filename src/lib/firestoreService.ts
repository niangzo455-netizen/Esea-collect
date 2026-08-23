import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import {
  SurveyProject,
  Mission,
  Submission,
  JoinRequest,
  SyncStats,
} from '../types';
import { eseaStorage } from './storage';
import { INITIAL_PROJECTS } from '../data/mockData';

export class FirestoreDataService {
  private static instance: FirestoreDataService;

  private constructor() {}

  public static getInstance(): FirestoreDataService {
    if (!FirestoreDataService.instance) {
      FirestoreDataService.instance = new FirestoreDataService();
    }
    return FirestoreDataService.instance;
  }

  // --- PROJECTS ---
  public async getProjects(isOnline: boolean = true): Promise<SurveyProject[]> {
    if (!isOnline || eseaStorage.isDemoMode()) {
      return eseaStorage.getProjects();
    }

    try {
      const projectsCol = collection(db, 'projects');
      const snapshot = await getDocs(projectsCol);

      if (snapshot.empty) {
        // If Firestore is empty, return local projects
        const local = eseaStorage.getProjects();
        return local;
      }

      const cloudProjects: SurveyProject[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          ...data,
          id: docSnap.id,
        } as SurveyProject;
      });

      // Merge with local projects to ensure seamless offline availability
      cloudProjects.forEach((p) => {
        eseaStorage.saveProject(p);
      });

      return cloudProjects;
    } catch (err) {
      console.warn('Firestore getProjects failed, fallback to local storage:', err);
      return eseaStorage.getProjects();
    }
  }

  public async getProjectById(id: string, isOnline: boolean = true): Promise<SurveyProject | undefined> {
    if (!isOnline || eseaStorage.isDemoMode()) {
      return eseaStorage.getProjectById(id);
    }

    try {
      const projectDocRef = doc(db, 'projects', id);
      const snapshot = await getDoc(projectDocRef);
      if (snapshot.exists()) {
        const p = { ...snapshot.data(), id: snapshot.id } as SurveyProject;
        eseaStorage.saveProject(p);
        return p;
      }
      return eseaStorage.getProjectById(id);
    } catch (err) {
      console.warn(`Firestore getProjectById(${id}) failed, fallback to local:`, err);
      return eseaStorage.getProjectById(id);
    }
  }

  public async saveProject(project: SurveyProject, isOnline: boolean = true): Promise<void> {
    // 1. Always persist to local cache first
    eseaStorage.saveProject(project);

    // 2. If online and NOT in demo mode, write to Firestore
    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const projectRef = doc(db, 'projects', project.id);
        const version = (project.questionnaireVersion || 1);
        const dataToSave = {
          ...project,
          questionnaireVersion: version,
          updatedAt: new Date().toISOString(),
        };
        await setDoc(projectRef, dataToSave, { merge: true });
      } catch (err) {
        console.warn('Firestore saveProject error (saved locally):', err);
      }
    }
  }

  public async deleteProject(projectId: string, isOnline: boolean = true): Promise<void> {
    eseaStorage.deleteProject(projectId);
    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const projectRef = doc(db, 'projects', projectId);
        await deleteDoc(projectRef);
      } catch (err) {
        console.warn('Firestore deleteProject error:', err);
      }
    }
  }

  // --- JOIN REQUESTS ---
  public async getJoinRequests(projectId?: string, isOnline: boolean = true): Promise<JoinRequest[]> {
    if (!isOnline || eseaStorage.isDemoMode()) {
      return eseaStorage.getJoinRequests(projectId);
    }

    try {
      const requestsCol = collection(db, 'joinRequests');
      const q = projectId ? query(requestsCol, where('projectId', '==', projectId)) : requestsCol;
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return eseaStorage.getJoinRequests(projectId);
      }

      const cloudRequests: JoinRequest[] = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as JoinRequest[];

      return cloudRequests;
    } catch (err) {
      console.warn('Firestore getJoinRequests fallback to local:', err);
      return eseaStorage.getJoinRequests(projectId);
    }
  }

  public async createJoinRequest(
    requestData: Omit<JoinRequest, 'id' | 'createdAt' | 'status'>,
    isOnline: boolean = true
  ): Promise<JoinRequest> {
    const localReq = eseaStorage.createJoinRequest(requestData);

    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const reqRef = doc(db, 'joinRequests', localReq.id);
        await setDoc(reqRef, localReq);
      } catch (err) {
        console.warn('Firestore createJoinRequest error (saved locally):', err);
      }
    }

    return localReq;
  }

  public async updateJoinRequestStatus(
    requestId: string,
    status: 'accepted' | 'rejected',
    reviewerId?: string,
    isOnline: boolean = true
  ): Promise<void> {
    eseaStorage.updateJoinRequestStatus(requestId, status);

    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const reqRef = doc(db, 'joinRequests', requestId);
        await updateDoc(reqRef, {
          status,
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewerId || 'supervisor',
        });
      } catch (err) {
        console.warn('Firestore updateJoinRequestStatus error:', err);
      }
    }
  }

  // --- MISSIONS ---
  public async getMissions(studentId?: string, isOnline: boolean = true): Promise<Mission[]> {
    if (!isOnline || eseaStorage.isDemoMode()) {
      return eseaStorage.getMissions(studentId);
    }

    try {
      const missionsCol = collection(db, 'missions');
      const q = studentId ? query(missionsCol, where('studentId', '==', studentId)) : missionsCol;
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return eseaStorage.getMissions(studentId);
      }

      const cloudMissions: Mission[] = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as Mission[];

      return cloudMissions;
    } catch (err) {
      console.warn('Firestore getMissions fallback to local:', err);
      return eseaStorage.getMissions(studentId);
    }
  }

  public async saveMission(mission: Mission, isOnline: boolean = true): Promise<void> {
    eseaStorage.createOrUpdateMission(mission);

    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const missionRef = doc(db, 'missions', mission.id);
        await setDoc(missionRef, mission, { merge: true });
      } catch (err) {
        console.warn('Firestore saveMission error:', err);
      }
    }
  }

  // --- SUBMISSIONS & OFFLINE-FIRST ENGINE ---
  public async getSubmissions(projectId?: string, isOnline: boolean = true): Promise<Submission[]> {
    if (!isOnline || eseaStorage.isDemoMode()) {
      return eseaStorage.getSubmissions(projectId);
    }

    try {
      const submissionsCol = collection(db, 'submissions');
      const q = projectId ? query(submissionsCol, where('projectId', '==', projectId)) : submissionsCol;
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return eseaStorage.getSubmissions(projectId);
      }

      const cloudSubmissions: Submission[] = snapshot.docs.map((d) => ({
        ...d.data(),
        id: d.id,
      })) as Submission[];

      // Merge local pending with cloud synced
      const localPending = eseaStorage.getPendingSubmissions().filter((s) => !projectId || s.projectId === projectId);
      const combined = [...localPending];

      cloudSubmissions.forEach((cs) => {
        if (!combined.some((s) => s.id === cs.id)) {
          combined.push(cs);
        }
      });

      return combined;
    } catch (err) {
      console.warn('Firestore getSubmissions fallback to local:', err);
      return eseaStorage.getSubmissions(projectId);
    }
  }

  public async submitQuestionnaire(
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'syncStatus'>,
    isOnline: boolean = true
  ): Promise<Submission> {
    // 1. Generate unique, duplicate-proof submission UUID
    const submissionId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    let photoStorageUrl: string | undefined = undefined;

    // 2. Prepare submission object
    const newSubmission: Submission = {
      ...submissionData,
      id: submissionId,
      submittedAt: new Date().toISOString(),
      syncStatus: isOnline ? 'synced' : 'pending',
      syncedAt: isOnline ? new Date().toISOString() : undefined,
      photoLocalUrl: submissionData.photoLocalUrl,
      photoStorageUrl: undefined,
    };

    // 3. Save locally in offline queue / cache
    eseaStorage.submitQuestionnaireDirect(newSubmission, isOnline);

    // 4. If online and NOT in demo mode, upload to Firestore and upload photo to Firebase Storage
    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        // Upload photo if present as base64 data URL
        if (newSubmission.photoLocalUrl && newSubmission.photoLocalUrl.startsWith('data:image')) {
          try {
            const photoRef = ref(storage, `collect_photos/${newSubmission.projectId}/${submissionId}.jpg`);
            await uploadString(photoRef, newSubmission.photoLocalUrl, 'data_url');
            photoStorageUrl = await getDownloadURL(photoRef);
            newSubmission.photoStorageUrl = photoStorageUrl;
          } catch (photoErr) {
            console.warn('Photo upload to Firebase Storage failed, keeping local URL:', photoErr);
          }
        }

        const subRef = doc(db, 'submissions', submissionId);
        await setDoc(subRef, {
          ...newSubmission,
          photoStorageUrl: photoStorageUrl || null,
        });
      } catch (err) {
        console.warn('Firestore live submission failed, marked as pending for later sync:', err);
        newSubmission.syncStatus = 'pending';
        eseaStorage.markSubmissionAsPending(submissionId);
      }
    }

    return newSubmission;
  }

  // Synchronize all pending offline submissions to Cloud Firestore
  public async syncPendingSubmissions(
    studentId?: string,
    isOnline: boolean = true
  ): Promise<{ syncedCount: number; errors: number }> {
    if (eseaStorage.isDemoMode()) {
      return eseaStorage.syncPendingSubmissions(studentId);
    }

    if (!isOnline) {
      throw new Error('Connexion Internet requise pour la synchronisation cloud.');
    }

    const pending = eseaStorage.getPendingSubmissions(studentId);
    if (pending.length === 0) {
      return { syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    for (const sub of pending) {
      try {
        let photoStorageUrl = sub.photoStorageUrl;

        // Upload photo if not yet uploaded
        if (!photoStorageUrl && sub.photoLocalUrl && sub.photoLocalUrl.startsWith('data:image')) {
          try {
            const photoRef = ref(storage, `collect_photos/${sub.projectId}/${sub.id}.jpg`);
            await uploadString(photoRef, sub.photoLocalUrl, 'data_url');
            photoStorageUrl = await getDownloadURL(photoRef);
          } catch (pErr) {
            console.warn(`Photo upload error for sub ${sub.id}:`, pErr);
          }
        }

        const updatedSub: Submission = {
          ...sub,
          syncStatus: 'synced',
          syncedAt: new Date().toISOString(),
          photoStorageUrl,
        };

        // Idempotent write to Firestore
        const subRef = doc(db, 'submissions', sub.id);
        await setDoc(subRef, updatedSub, { merge: true });

        // Update local status
        eseaStorage.markSubmissionAsSynced(sub.id, photoStorageUrl);
        syncedCount++;
      } catch (err) {
        console.error(`Failed to sync submission ${sub.id}:`, err);
        errors++;
      }
    }

    return { syncedCount, errors };
  }

  public async updateSubmissionQuality(
    submissionId: string,
    qualityStatus: Submission['qualityStatus'],
    note?: string,
    isOnline: boolean = true
  ): Promise<void> {
    eseaStorage.updateSubmissionQuality(submissionId, qualityStatus, note);

    if (isOnline && !eseaStorage.isDemoMode()) {
      try {
        const subRef = doc(db, 'submissions', submissionId);
        const subSnap = await getDoc(subRef);
        if (subSnap.exists()) {
          const currentNotes = (subSnap.data().qualityNotes || []) as string[];
          const updatedNotes = note ? [...currentNotes, note] : currentNotes;
          await updateDoc(subRef, {
            qualityStatus,
            qualityNotes: updatedNotes,
          });
        }
      } catch (err) {
        console.warn('Firestore updateSubmissionQuality error:', err);
      }
    }
  }
}

export const firestoreService = FirestoreDataService.getInstance();
