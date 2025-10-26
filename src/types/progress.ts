export type ProgressPhase = "idle" | "fetchingUseCases" | "fetchingNotebooks" | "done" | "error";

export interface NotebooksProgress {
  phase: ProgressPhase;
  message?: string;
  useCasesFetched: number;
  useCasesTotal?: number;
  notebooksFetched: number;
  notebooksTotal?: number;
  currentUseCaseName?: string;
  isCached?: boolean;
  error?: string;
}

