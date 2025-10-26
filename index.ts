import {
  fetchAllUseCases,
  fetchAllNotebooksForAllUseCases,
  DATAROBOT_HOST_BASE_URL,
  type Notebook,
  type UseCase,
} from "./src/api/datarobot";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

// In development, import HTML directly for HMR
// In production, we'll serve from ./dist built by Bun.build()
const indexHtml = isProduction ? null : await import("./index.html").then(m => m.default);

const envApiToken = process.env.DATAROBOT_API_TOKEN;

console.log("🔍 Server Environment Check:");
console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`- DATAROBOT_ENDPOINT: ${process.env.DATAROBOT_ENDPOINT || '[NOT SET]'}`);
console.log(`- DATAROBOT_API_TOKEN: ${envApiToken ? `[SET - ${envApiToken.substring(0, 10)}...]` : '[NOT SET]'}`);

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

const CACHE_DURATION = 5 * 60 * 1000;

async function fetchData() {
  const now = Date.now();
  
  if (cachedData && now - cachedData.lastFetched < CACHE_DURATION) {
    return cachedData;
  }

  console.log("Fetching data from DataRobot API...");
  const useCases = await fetchAllUseCases(apiToken);
  const useCaseIds = useCases.map(uc => uc.id);
  const notebooks = await fetchAllNotebooksForAllUseCases(apiToken, useCaseIds);

  cachedData = {
    notebooks,
    useCases,
    lastFetched: now,
  };

  console.log(`Fetched ${notebooks.length} notebooks and ${useCases.length} use cases`);
  return cachedData;
}

// API handler for notebooks
async function handleNotebooksAPI() {
  try {
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
    console.error("Error fetching notebooks:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch notebooks" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
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
      }
    },
    development: {
      hmr: true,
    },
  });
}

console.log("Server running at http://0.0.0.0:8080");