import {
  SurveyProject,
  Mission,
  Submission,
  JoinRequest,
  UserProfile,
} from '../types';
import {
  INITIAL_PROJECTS,
  INITIAL_MISSIONS,
  INITIAL_SUBMISSIONS,
  INITIAL_JOIN_REQUESTS,
  CURRENT_SUPERVISOR,
  CURRENT_STUDENT,
  DEFAULT_CLEAN_SUPERVISOR,
  DEFAULT_CLEAN_STUDENT,
} from '../data/mockData';

const STORAGE_KEYS = {
  PROJECTS: 'esea_collect_projects_v1',
  MISSIONS: 'esea_collect_missions_v1',
  SUBMISSIONS: 'esea_collect_submissions_v1',
  JOIN_REQUESTS: 'esea_collect_join_requests_v1',
  ACTIVE_USER: 'esea_collect_active_user_v1',
  ONLINE_STATUS: 'esea_collect_online_mode_v1',
  DEMO_MODE_ACTIVE: 'esea_collect_demo_active_v1',
};

// Safe storage helpers
function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (e) {
    console.error(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to localStorage`, e);
  }
}

export class EseaStorageService {
  private static instance: EseaStorageService;
  private listeners: (() => void)[] = [];

  private constructor() {
    // Initial check: Clean state by default without auto-injecting mock data
    if (localStorage.getItem(STORAGE_KEYS.PROJECTS) === null) {
      saveToStorage(STORAGE_KEYS.PROJECTS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.MISSIONS) === null) {
      saveToStorage(STORAGE_KEYS.MISSIONS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.SUBMISSIONS) === null) {
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.JOIN_REQUESTS) === null) {
      saveToStorage(STORAGE_KEYS.JOIN_REQUESTS, []);
    }
    if (localStorage.getItem(STORAGE_KEYS.ACTIVE_USER) === null) {
      saveToStorage(STORAGE_KEYS.ACTIVE_USER, DEFAULT_CLEAN_SUPERVISOR);
    }
    if (localStorage.getItem(STORAGE_KEYS.ONLINE_STATUS) === null) {
      saveToStorage(STORAGE_KEYS.ONLINE_STATUS, true);
    }
    if (localStorage.getItem(STORAGE_KEYS.DEMO_MODE_ACTIVE) === null) {
      saveToStorage(STORAGE_KEYS.DEMO_MODE_ACTIVE, false);
    }
  }

  public static getInstance(): EseaStorageService {
    if (!EseaStorageService.instance) {
      EseaStorageService.instance = new EseaStorageService();
    }
    return EseaStorageService.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (err) {
        console.error('Storage subscriber error:', err);
      }
    });
  }

  // --- Demo Mode Status ---
  public isDemoMode(): boolean {
    return getFromStorage<boolean>(STORAGE_KEYS.DEMO_MODE_ACTIVE, false);
  }

  public loadDemoData(): void {
    try {
      const activeUser = this.getActiveUser();
      const isStudentRole = activeUser.role === 'student';

      // Deep clone initial mock datasets to avoid mutating references
      const clonedProjects = JSON.parse(JSON.stringify(INITIAL_PROJECTS));
      const clonedMissions = JSON.parse(JSON.stringify(INITIAL_MISSIONS));
      const clonedSubmissions = JSON.parse(JSON.stringify(INITIAL_SUBMISSIONS));
      const clonedJoinRequests = JSON.parse(JSON.stringify(INITIAL_JOIN_REQUESTS));
      const targetUser = isStudentRole ? CURRENT_STUDENT : CURRENT_SUPERVISOR;

      saveToStorage(STORAGE_KEYS.PROJECTS, clonedProjects);
      saveToStorage(STORAGE_KEYS.MISSIONS, clonedMissions);
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, clonedSubmissions);
      saveToStorage(STORAGE_KEYS.JOIN_REQUESTS, clonedJoinRequests);
      saveToStorage(STORAGE_KEYS.ACTIVE_USER, targetUser);
      saveToStorage(STORAGE_KEYS.DEMO_MODE_ACTIVE, true);

      console.info('ESEA Collect: Demo datasets loaded successfully into local storage.', {
        projectsCount: clonedProjects.length,
        missionsCount: clonedMissions.length,
        submissionsCount: clonedSubmissions.length,
        activeUser: targetUser.name,
      });

      this.notify();
    } catch (err) {
      console.error('ESEA Collect: Failed to load demo datasets:', err);
      throw new Error('Impossible de charger les données de démonstration.');
    }
  }

  public resetToCleanState(): void {
    try {
      const activeUser = this.getActiveUser();
      const isStudentRole = activeUser.role === 'student';
      const cleanUser = isStudentRole ? DEFAULT_CLEAN_STUDENT : DEFAULT_CLEAN_SUPERVISOR;

      saveToStorage(STORAGE_KEYS.PROJECTS, []);
      saveToStorage(STORAGE_KEYS.MISSIONS, []);
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, []);
      saveToStorage(STORAGE_KEYS.JOIN_REQUESTS, []);
      saveToStorage(STORAGE_KEYS.ACTIVE_USER, cleanUser);
      saveToStorage(STORAGE_KEYS.DEMO_MODE_ACTIVE, false);

      console.info('ESEA Collect: Reset to clean pilot state completed (0 projects, 0 missions).', {
        activeUser: cleanUser.name,
      });

      this.notify();
    } catch (err) {
      console.error('ESEA Collect: Failed to reset to clean state:', err);
      throw new Error('Impossible de réinitialiser l\'environnement.');
    }
  }

  public resetAllToDemo(): void {
    this.loadDemoData();
  }

  // --- Online / Network state ---
  public isOnline(): boolean {
    return getFromStorage<boolean>(STORAGE_KEYS.ONLINE_STATUS, true);
  }

  public setOnlineStatus(status: boolean): void {
    saveToStorage(STORAGE_KEYS.ONLINE_STATUS, status);
    this.notify();
  }

  public toggleOnlineStatus(): boolean {
    const current = this.isOnline();
    this.setOnlineStatus(!current);
    return !current;
  }

  // --- Active User / Role Switching ---
  public getActiveUser(): UserProfile {
    return getFromStorage<UserProfile>(STORAGE_KEYS.ACTIVE_USER, DEFAULT_CLEAN_SUPERVISOR);
  }

  public setActiveUser(user: UserProfile): void {
    saveToStorage(STORAGE_KEYS.ACTIVE_USER, user);
    this.notify();
  }

  public switchRole(role: 'supervisor' | 'student'): void {
    const isDemo = this.isDemoMode();
    if (role === 'supervisor') {
      this.setActiveUser(isDemo ? CURRENT_SUPERVISOR : DEFAULT_CLEAN_SUPERVISOR);
    } else {
      this.setActiveUser(isDemo ? CURRENT_STUDENT : DEFAULT_CLEAN_STUDENT);
    }
  }

  // --- Projects ---
  public getProjects(): SurveyProject[] {
    return getFromStorage<SurveyProject[]>(STORAGE_KEYS.PROJECTS, []);
  }

  public getProjectById(id: string): SurveyProject | undefined {
    return this.getProjects().find((p) => p.id === id);
  }

  public saveProject(project: SurveyProject): void {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.id === project.id);
    if (index >= 0) {
      projects[index] = { ...project, updatedAt: new Date().toISOString() };
    } else {
      projects.unshift({ ...project, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    this.notify();
  }

  public deleteProject(projectId: string): void {
    const projects = this.getProjects().filter((p) => p.id !== projectId);
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    this.notify();
  }

  // --- Join Requests & Invitations ---
  public getJoinRequests(projectId?: string): JoinRequest[] {
    const all = getFromStorage<JoinRequest[]>(STORAGE_KEYS.JOIN_REQUESTS, []);
    if (projectId) {
      return all.filter((r) => r.projectId === projectId);
    }
    return all;
  }

  public createJoinRequest(request: Omit<JoinRequest, 'id' | 'createdAt' | 'status'>): JoinRequest {
    const all = this.getJoinRequests();
    const newReq: JoinRequest = {
      ...request,
      id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    all.unshift(newReq);
    saveToStorage(STORAGE_KEYS.JOIN_REQUESTS, all);
    this.notify();
    return newReq;
  }

  public updateJoinRequestStatus(requestId: string, status: 'accepted' | 'rejected'): void {
    const all = this.getJoinRequests();
    const target = all.find((r) => r.id === requestId);
    if (target) {
      target.status = status;
      saveToStorage(STORAGE_KEYS.JOIN_REQUESTS, all);

      // If accepted, auto-create or assign mission to student
      if (status === 'accepted') {
        const project = this.getProjectById(target.projectId);
        if (project) {
          const group = project.groups.find((g) => g.id === target.requestedGroupId);
          if (group && !group.assignedCollectorIds.includes(target.studentId)) {
            group.assignedCollectorIds.push(target.studentId);
            this.saveProject(project);
          }

          // Create mission for student
          this.createOrUpdateMission({
            projectId: project.id,
            projectTitle: project.title,
            studentId: target.studentId,
            studentName: target.studentName,
            groupId: group?.id,
            groupName: group?.name,
            zone: group?.zone,
            targetCount: group?.targetCount ? Math.round(group.targetCount / Math.max(1, group.assignedCollectorIds.length)) : 30,
            completedCount: 0,
            syncedCount: 0,
            pendingCount: 0,
            status: 'active',
            assignedAt: new Date().toISOString(),
          });
        }
      }
      this.notify();
    }
  }

  // --- Missions ---
  public getMissions(studentId?: string): Mission[] {
    const all = getFromStorage<Mission[]>(STORAGE_KEYS.MISSIONS, []);
    if (studentId) {
      return all.filter((m) => m.studentId === studentId);
    }
    return all;
  }

  public createOrUpdateMission(missionData: Omit<Mission, 'id'> & { id?: string }): Mission {
    const all = this.getMissions();
    const existingIndex = all.findIndex(
      (m) =>
        (missionData.id && m.id === missionData.id) ||
        (m.projectId === missionData.projectId && m.studentId === missionData.studentId)
    );

    if (existingIndex >= 0) {
      const updated: Mission = { ...all[existingIndex], ...missionData };
      all[existingIndex] = updated;
      saveToStorage(STORAGE_KEYS.MISSIONS, all);
      this.notify();
      return updated;
    } else {
      const newMission: Mission = {
        ...missionData,
        id: missionData.id || `mis-${Date.now()}`,
      };
      all.push(newMission);
      saveToStorage(STORAGE_KEYS.MISSIONS, all);
      this.notify();
      return newMission;
    }
  }

  // --- Submissions & Offline Sync Queue ---
  public getSubmissions(projectId?: string): Submission[] {
    const all = getFromStorage<Submission[]>(STORAGE_KEYS.SUBMISSIONS, []);
    if (projectId) {
      return all.filter((s) => s.projectId === projectId);
    }
    return all;
  }

  public getPendingSubmissions(studentId?: string): Submission[] {
    const all = this.getSubmissions();
    return all.filter((s) => s.syncStatus === 'pending' && (!studentId || s.studentId === studentId));
  }

  public submitQuestionnaireDirect(submission: Submission, isOnline: boolean): void {
    const all = this.getSubmissions();
    const existingIndex = all.findIndex((s) => s.id === submission.id);
    if (existingIndex >= 0) {
      all[existingIndex] = submission;
    } else {
      all.unshift(submission);
    }
    saveToStorage(STORAGE_KEYS.SUBMISSIONS, all);

    // Update mission counts
    if (submission.missionId || (submission.projectId && submission.studentId)) {
      const missions = this.getMissions();
      const mission = missions.find(
        (m) => m.id === submission.missionId || (m.projectId === submission.projectId && m.studentId === submission.studentId)
      );
      if (mission) {
        mission.completedCount += 1;
        if (isOnline && submission.syncStatus === 'synced') {
          mission.syncedCount += 1;
        } else {
          mission.pendingCount += 1;
        }
        saveToStorage(STORAGE_KEYS.MISSIONS, missions);
      }
    }

    // Update project submissions total
    const projects = this.getProjects();
    const project = projects.find((p) => p.id === submission.projectId);
    if (project) {
      project.currentSubmissions += 1;
      saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    }

    this.notify();
  }

  public markSubmissionAsSynced(submissionId: string, photoStorageUrl?: string): void {
    const all = this.getSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (sub) {
      sub.syncStatus = 'synced';
      sub.syncedAt = new Date().toISOString();
      if (photoStorageUrl) {
        sub.photoStorageUrl = photoStorageUrl;
      }
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, all);

      // Update mission counters
      const missions = this.getMissions();
      const mission = missions.find(
        (m) => m.id === sub.missionId || (m.projectId === sub.projectId && m.studentId === sub.studentId)
      );
      if (mission && mission.pendingCount > 0) {
        mission.pendingCount -= 1;
        mission.syncedCount += 1;
        saveToStorage(STORAGE_KEYS.MISSIONS, missions);
      }

      this.notify();
    }
  }

  public markSubmissionAsPending(submissionId: string): void {
    const all = this.getSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (sub) {
      sub.syncStatus = 'pending';
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, all);
      this.notify();
    }
  }

  public submitQuestionnaire(
    submissionData: Omit<Submission, 'id' | 'submittedAt' | 'syncStatus'>
  ): Submission {
    const online = this.isOnline();
    const newSub: Submission = {
      ...submissionData,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      submittedAt: new Date().toISOString(),
      syncStatus: online ? 'synced' : 'pending',
      syncedAt: online ? new Date().toISOString() : undefined,
    };

    this.submitQuestionnaireDirect(newSub, online);
    return newSub;
  }

  public async syncPendingSubmissions(studentId?: string): Promise<{ syncedCount: number; errors: number }> {
    if (!this.isOnline()) {
      throw new Error('Impossible de synchroniser en mode hors ligne.');
    }

    const all = this.getSubmissions();
    let count = 0;

    all.forEach((sub) => {
      if (sub.syncStatus === 'pending' && (!studentId || sub.studentId === studentId)) {
        sub.syncStatus = 'synced';
        sub.syncedAt = new Date().toISOString();
        count++;
      }
    });

    saveToStorage(STORAGE_KEYS.SUBMISSIONS, all);

    // Update mission pending -> synced
    const missions = this.getMissions();
    missions.forEach((m) => {
      if (!studentId || m.studentId === studentId) {
        m.syncedCount += m.pendingCount;
        m.pendingCount = 0;
      }
    });
    saveToStorage(STORAGE_KEYS.MISSIONS, missions);

    this.notify();
    return { syncedCount: count, errors: 0 };
  }

  public updateSubmissionQuality(
    submissionId: string,
    qualityStatus: Submission['qualityStatus'],
    note?: string
  ): void {
    const all = this.getSubmissions();
    const sub = all.find((s) => s.id === submissionId);
    if (sub) {
      sub.qualityStatus = qualityStatus;
      if (note) {
        sub.qualityNotes = sub.qualityNotes || [];
        sub.qualityNotes.push(note);
      }
      saveToStorage(STORAGE_KEYS.SUBMISSIONS, all);
      this.notify();
    }
  }
}

export const eseaStorage = EseaStorageService.getInstance();
