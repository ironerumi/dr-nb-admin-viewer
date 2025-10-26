import {
  fetchAllUseCases,
  fetchAllNotebooksForUseCase,
  DATAROBOT_HOST_BASE_URL,
  type Notebook,
  type UseCase,
} from "./src/api/datarobot";
import type { UpstreamError } from "./src/api/datarobot";
import type { NotebooksProgress } from "./src/types/progress";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

// In development, import HTML directly for HMR
// In production, we'll serve from ./dist built by Bun.build()
const indexHtml = isProduction ? null : await import("./index.html").then(m => m.default);

const envApiToken = process.env.DATAROBOT_API_TOKEN;

console.log("🔍 Server Environment Check:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- DATAROBOT_ENDPOINT: ${process.env.DATAROBOT_ENDPOINT || '[NOT SET]'}`);
console.log("- DATAROBOT_API_TOKEN: ", envApiToken ? "[SET]" : "[NOT SET]");

if (!envApiToken) {
  console.error("❌ Error: DATAROBOT_API_TOKEN not found in environment variables");
  console.error("Available env vars:", Object.keys(process.env).filter(k => k.startsWith('DATAROBOT')));
  throw new Error("DATAROBOT_API_TOKEN is required");
}

const apiToken = envApiToken;

let cachedData: {
  notebooks: Notebook[];
  useCases: UseCase[];
  lastFetched: number;
} | null = null;

const DEFAULT_PROGRESS: NotebooksProgress = {
  phase: "idle",
  useCasesFetched: 0,
  notebooksFetched: 0,
};

let currentProgress: NotebooksProgress = { ...DEFAULT_PROGRESS };

const CACHE_DURATION = 5 * 60 * 1000;

async function fetchData() {
  const now = Date.now();
  
  if (cachedData && now - cachedData.lastFetched < CACHE_DURATION) {
    currentProgress = {
      phase: "done",
      useCasesFetched: cachedData.useCases.length,
      useCasesTotal: cachedData.useCases.length,
      notebooksFetched: cachedData.notebooks.length,
      notebooksTotal: cachedData.notebooks.length,
      message: `キャッシュから ${cachedData.notebooks.length} 件のノートブックを読み込みました`,
      isCached: true,
    };
    return cachedData;
  }

  console.log("Fetching data from DataRobot API...");
  currentProgress = {
    phase: "fetchingUseCases",
    useCasesFetched: 0,
    notebooksFetched: 0,
    message: "ユースケースを取得中...",
  };

  try {
    const useCases = await fetchAllUseCases(apiToken, (fetched, total) => {
      currentProgress = {
        ...currentProgress,
        phase: "fetchingUseCases",
        useCasesFetched: fetched,
        useCasesTotal: total,
        message: `ユースケースを取得中 (${fetched}${total ? ` / ${total}` : ""})`,
      };
    });

    const useCaseIds = useCases.map(uc => uc.id);
    currentProgress = {
      ...currentProgress,
      phase: "fetchingNotebooks",
      useCasesFetched: useCases.length,
      useCasesTotal: useCases.length,
      notebooksFetched: 0,
      notebooksTotal: useCases.reduce((sum, uc) => sum + (uc.notebooksCount ?? 0), 0) || undefined,
      message: `ノートブックを ${useCases.length} 件のユースケースから取得中...`,
    };

    const notebooks: Notebook[] = [];

    for (const useCase of useCases) {
      currentProgress = {
        ...currentProgress,
        currentUseCaseName: useCase.name,
        message: `${useCase.name} のノートブックを取得中...`,
      };

      const notebooksForUseCase = await fetchAllNotebooksForUseCase(apiToken, useCase.id);
      notebooks.push(...notebooksForUseCase);

      currentProgress = {
        ...currentProgress,
        notebooksFetched: notebooks.length,
        message: `${useCase.name} のノートブックを ${notebooksForUseCase.length} 件取得しました`,
      };
    }

    cachedData = {
      notebooks,
      useCases,
      lastFetched: now,
    };

    console.log(`Fetched ${notebooks.length} notebooks and ${useCases.length} use cases`);
    currentProgress = {
      ...currentProgress,
      phase: "done",
      notebooksFetched: notebooks.length,
      notebooksTotal: notebooks.length,
      message: `${useCases.length} 件のユースケースから ${notebooks.length} 件のノートブックを取得しました`,
    };

    return cachedData;
  } catch (error) {
    const message = error instanceof Error ? error.message : "データ取得中にエラーが発生しました";
    currentProgress = {
      ...currentProgress,
      phase: "error",
      error: message,
      message,
    };
    throw error;
  }
}

// API handler for notebooks
function createRequestId(): string {
  return crypto.randomUUID();
}

function createErrorResponse(error: unknown, requestId: string): Response {
  if (error && typeof error === "object" && "status" in error) {
    const upstream = error as UpstreamError;
    return new Response(
      JSON.stringify({
        requestId,
        error: upstream.message,
        details: {
          status: upstream.status,
          statusText: upstream.statusText,
          endpoint: upstream.endpoint,
          responseBody: upstream.responseBody,
        },
      }),
      {
        status: upstream.status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      requestId,
      error: "Internal server error",
    }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    }
  );
}

async function handleNotebooksAPI() {
  const requestId = createRequestId();
  try {
    currentProgress = {
      ...DEFAULT_PROGRESS,
      phase: "fetchingUseCases",
      message: "ユースケースを取得中...",
    };
    const { notebooks, useCases } = await fetchData();

    const useCaseMap = new Map(useCases.map(uc => [uc.id, uc.name]));

    const enrichedNotebooks = notebooks.map(notebook => {
      const useCaseName = useCaseMap.get(notebook.useCaseId) || "Unknown";
      const useCaseUrl = `${DATAROBOT_HOST_BASE_URL}/usecases/${encodeURIComponent(notebook.useCaseId)}`;
      const notebookUrl = `${useCaseUrl}/notebooks/${encodeURIComponent(notebook.id)}`;

      const { lastViewed, ...rest } = notebook;

      return {
        ...rest,
        useCaseName,
        useCaseUrl,
        notebookUrl,
      };
    });

    const codespaceCount = notebooks.filter(n => n.type === "codespace").length;
    const notebookCount = notebooks.filter(n => n.type === "notebook").length;

    return new Response(
      JSON.stringify({
        requestId,
        total: notebooks.length,
        codespaceCount,
        notebookCount,
        data: enrichedNotebooks,
      }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`[${requestId}] Error fetching notebooks:`, error);
    currentProgress = {
      ...currentProgress,
      phase: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
    return createErrorResponse(error, requestId);
  }
}

function handleProgressAPI() {
  return new Response(
    JSON.stringify(currentProgress),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}

if (isProduction) {
  // Production: use fetch handler to serve from ./dist
  Bun.serve({
    port: 8080,
    hostname: "0.0.0.0",
    idleTimeout: 120,
    async fetch(req) {
      const url = new URL(req.url);

      // API routes
      if (url.pathname === "/api/notebooks") {
        return handleNotebooksAPI();
      }

      if (url.pathname === "/api/progress") {
        return handleProgressAPI();
      }

      // Serve static files from ./dist
      const filePath = url.pathname === "/" ? "/index.html" : url.pathname;
      const file = Bun.file(path.join("./dist", filePath));

      if (await file.exists()) {
        return new Response(file);
      }

      // Fallback to index.html for client-side routing
      return new Response(Bun.file("./dist/index.html"));
    },
  });
} else {
  // Development: use routes to support HTMLBundle
  if (!indexHtml) {
    throw new Error("Failed to load index.html in development mode");
  }
  Bun.serve({
    port: 8080,
    hostname: "0.0.0.0",
    idleTimeout: 120,
    routes: {
      "/": indexHtml,
      "/api/notebooks": {
        async GET() {
          return handleNotebooksAPI();
        }
      },
      "/api/progress": {
        async GET() {
          return handleProgressAPI();
        }
      }
    },
    development: {
      hmr: true,
    },
  });
}

console.log("Server running at http://0.0.0.0:8080");