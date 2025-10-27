export interface UpstreamError {
  status: number;
  statusText: string;
  message: string;
  endpoint: string;
  responseBody?: string;
}

async function makeUpstreamError(
  response: Response,
  endpoint: string,
  preReadBody?: string
): Promise<UpstreamError> {
  const responseBody = preReadBody ?? (await response.text().catch(() => undefined));
  return {
    status: response.status,
    statusText: response.statusText,
    message: `HTTP ${response.status} ${response.statusText}`,
    endpoint,
    responseBody,
  };
}

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
export const DATAROBOT_HOST_BASE_URL = HOST_BASE_URL.origin;
const DEFAULT_LIMIT = 50;
const MAX_RETRIES = 4;
const MAX_CONCURRENT_REQUESTS = 10;

export async function fetchDatasets(apiToken: string): Promise<DatasetResponse> {
  const endpoint = new URL("datasets/", API_V2_BASE_URL).toString();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json"
    }
  });

  if (!response.ok) {
    throw await makeUpstreamError(response, endpoint);
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

  const endpoint = url.toString();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "accept": "application/json"
    }
  });

  if (!response.ok) {
    console.error(`❌ API Error Details:`);
    console.error(`   Status: ${response.status} - ${response.statusText}`);
    console.error(`   URL: ${endpoint}`);
    console.error(`   Token prefix: ${apiToken.substring(0, 10)}...`);
    const errorBody = await response.text().catch(() => "Unable to read error body");
    console.error(`   Response body: ${errorBody}`);
    throw await makeUpstreamError(response, endpoint, errorBody);
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

  const endpoint = url.toString();
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "accept": "application/json"
    }
  });

  if (!response.ok) {
    console.error(`❌ API Error Details:`);
    console.error(`   Status: ${response.status} - ${response.statusText}`);
    console.error(`   URL: ${endpoint}`);
    const errorBody = await response.text().catch(() => "Unable to read error body");
    console.error(`   Response body: ${errorBody}`);
    throw await makeUpstreamError(response, endpoint, errorBody);
  }

  return await response.json() as NotebookResponse;
}

export async function fetchAllUseCases(
  apiToken: string,
  onProgress?: (fetched: number, total?: number) => void
): Promise<UseCase[]> {
  const allUseCases: UseCase[] = [];
  let offset = 0;
  let hasMore = true;
  let totalFetched = 0;
  let totalCount: number | undefined;

  while (hasMore) {
    const response = await fetchUseCases(apiToken, offset, DEFAULT_LIMIT);
    allUseCases.push(...response.data);
    totalFetched += response.data.length;
    totalCount = response.totalCount ?? totalCount;

    onProgress?.(totalFetched, totalCount);

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
    const response = await fetchWithRetry(() =>
      fetchNotebooks(apiToken, useCaseId, offset, DEFAULT_LIMIT)
    );
    allNotebooks.push(...response.data);

    if (response.next) {
      offset += DEFAULT_LIMIT;
    } else {
      hasMore = false;
    }
  }

  return allNotebooks;
}

// Retry logic for handling rate limits and transient failures
async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      // Check for 429 in both UpstreamError objects and Error instances
      const isRateLimit =
        (error && typeof error === "object" && "status" in error && error.status === 429) ||
        (error instanceof Error && error.message.includes("429"));
      const isLastAttempt = i === retries - 1;

      if (!isRateLimit || isLastAttempt) {
        throw error;
      }

      const delay = 1000 * Math.pow(2, i);
      console.warn(`⚠️  Rate limit (429) hit, retrying in ${delay}ms (attempt ${i + 1}/${retries})...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}

// Semaphore for controlling concurrent requests
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

// Concurrent fetch with progress tracking
export async function fetchAllNotebooksForAllUseCases(
  apiToken: string,
  useCases: UseCase[],
  onProgress?: (useCaseName: string, notebooksCount: number, totalNotebooksFetched: number) => void
): Promise<Notebook[]> {
  const semaphore = new Semaphore(MAX_CONCURRENT_REQUESTS);
  let totalNotebooksFetched = 0;

  const notebooksByUseCase = await Promise.all(
    useCases.map(async (useCase) => {
      await semaphore.acquire();
      try {
        const notebooks = await fetchWithRetry(() =>
          fetchAllNotebooksForUseCase(apiToken, useCase.id)
        );

        totalNotebooksFetched += notebooks.length;
        onProgress?.(useCase.name, notebooks.length, totalNotebooksFetched);

        return notebooks;
      } finally {
        semaphore.release();
      }
    })
  );

  return notebooksByUseCase.flat();
}
