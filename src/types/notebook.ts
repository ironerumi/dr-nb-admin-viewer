export interface NotebookUser {
  id: string;
  orgId: string | null;
  activated: boolean;
  username: string;
  firstName: string;
  lastName: string;
  gravatarHash: string;
  tenantPhase: string;
}

export interface NotebookTimestamp {
  at: string;
  by: NotebookUser;
}

export interface NotebookSession {
  status: string;
  notebookId: string;
  userId: string;
  startedAt: string;
  sessionType: string;
}

export interface Notebook {
  id: string;
  type: string;
  name: string;
  description: string | null;
  useCaseId: string;
  useCaseName?: string;
  useCaseUrl?: string;
  notebookUrl?: string;
  created: NotebookTimestamp;
  updated: NotebookTimestamp;
  session?: NotebookSession;
  hasSchedule: boolean;
  hasEnabledSchedule: boolean;
}

export interface UseCase {
  id: string;
  name: string;
  description: string | null;
}

export interface NotebooksResponse {
  total: number;
  codespaceCount: number;
  notebookCount: number;
  data: Notebook[];
}
