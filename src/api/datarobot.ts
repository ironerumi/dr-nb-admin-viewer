export interface DatasetResponse {
  count: number;
  next: string | null;
  previous: string | null;
  data: Dataset[];
  totalCount: number;
}

export interface Dataset {
  datasetId: string;
  name: string;
  isLatestVersion: boolean;
  versionId: string;
  categories: string[];
  creationDate: string;
  createdBy: string | null;
  isSnapshot: boolean;
  dataPersisted: boolean | null;
  isDataEngineEligible: boolean;
  processingState: string;
  timeSeriesProperties: {
    isMostlyImputed: boolean | null;
  };
  rowCount: number;
  columnCount: number;
  datasetSize: number;
  sampleSize: {
    value: number;
    type: string;
  } | null;
}

export interface UseCaseResponse {
  count: number;
  next: string | null;
  previous: string | null;
  data: UseCase[];
  totalCount: number;
}

export interface UseCase {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  notebooksCount: number;
}

export interface NotebookResponse {
  count: number;
  next: string | null;
  previous: string | null;
  data: Notebook[];
  totalCount: number;
}

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
  created: NotebookTimestamp;
  updated: NotebookTimestamp;
  lastViewed: NotebookTimestamp;
  session?: NotebookSession;
  hasSchedule: boolean;
  hasEnabledSchedule: boolean;
}

const rawEndpoint = process.env.DATAROBOT_ENDPOINT;

if (!rawEndpoint) {
  throw new Error("DATAROBOT_ENDPOINT not found in environment variables");
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

const API_V2_BASE_URL = new URL(ensureTrailingSlash(rawEndpoint));
const HOST_BASE_URL = new URL("/", API_V2_BASE_URL);
const DEFAULT_LIMIT = 50;
const MAX_RETRIES = 3;
const MAX_CONCURRENT_REQUESTS = 5;

export async function fetchDatasets(apiToken: string): Promise<DatasetResponse> {
  const response = await fetch(new URL("datasets/", API_V2_BASE_URL), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  return await response.json() as DatasetResponse;
}

export async function fetchUseCases(
  apiToken: string,
  offset: number = 0,
  limit: number = DEFAULT_LIMIT
): Promise<UseCaseResponse> {
  const url = new URL("useCases/", API_V2_BASE_URL);
  url.searchParams.set("includeModelsCount", "false");
  url.searchParams.set("offset", offset.toString());
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("orderBy", "name");
  url.searchParams.set("showOrgUseCases", "true");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  return await response.json() as UseCaseResponse;
}

export async function fetchNotebooks(
  apiToken: string,
  useCaseId: string,
  offset: number = 0,
  limit: number = DEFAULT_LIMIT
): Promise<NotebookResponse> {
  const url = new URL("api-gw/nbx/notebooks/", HOST_BASE_URL);
  url.searchParams.set("useCaseId", useCaseId);
  url.searchParams.set("offset", offset.toString());
  url.searchParams.set("limit", limit.toString());
  url.searchParams.set("orderBy", "-updated");

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "accept": "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
  }

  return await response.json() as NotebookResponse;
}

export async function fetchAllUseCases(apiToken: string): Promise<UseCase[]> {
  const allUseCases: UseCase[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchUseCases(apiToken, offset, DEFAULT_LIMIT);
    allUseCases.push(...response.data);
    
    if (response.next) {
      offset += DEFAULT_LIMIT;
    } else {
      hasMore = false;
    }
  }

  if (allUseCases.length !== allUseCases[0]?.notebooksCount && allUseCases.length > 0) {
    const lastResponse = await fetchUseCases(apiToken, 0, 1);
    if (allUseCases.length !== lastResponse.totalCount) {
      throw new Error(
        `Data validation failed: expected ${lastResponse.totalCount} use cases, got ${allUseCases.length}`
      );
    }
  }

  return allUseCases;
}

export async function fetchAllNotebooksForUseCase(
  apiToken: string,
  useCaseId: string
): Promise<Notebook[]> {
  const allNotebooks: Notebook[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchNotebooks(apiToken, useCaseId, offset, DEFAULT_LIMIT);
    allNotebooks.push(...response.data);
    
    if (response.next) {
      offset += DEFAULT_LIMIT;
    } else {
      hasMore = false;
    }
  }

  return allNotebooks;
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && error.message.includes("429");
      const isLastAttempt = i === retries - 1;
      
      if (!isRateLimit || isLastAttempt) {
        throw error;
      }
      
      const delay = 100 * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

class Semaphore {
  private tasks: (() => void)[] = [];
  private count: number;

  constructor(max: number) {
    this.count = max;
  }

  async acquire(): Promise<void> {
    if (this.count > 0) {
      this.count--;
      return;
    }
    return new Promise(resolve => this.tasks.push(resolve));
  }

  release(): void {
    this.count++;
    const next = this.tasks.shift();
    if (next) {
      this.count--;
      next();
    }
  }
}

export async function fetchAllNotebooksForAllUseCases(
  apiToken: string,
  useCaseIds: string[]
): Promise<Notebook[]> {
  const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);
  
  const tasks = useCaseIds.map(useCaseId => async () => {
    await semaphore.acquire();
    try {
      return await fetchWithRetry(() => fetchAllNotebooksForUseCase(apiToken, useCaseId));
    } finally {
      semaphore.release();
    }
  });

  const results = await Promise.all(tasks.map(task => task()));
  return results.flat();
}
