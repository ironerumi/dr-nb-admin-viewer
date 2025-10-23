import { fetchAllUseCases, fetchAllNotebooksForAllUseCases, type Notebook, type UseCase } from "./src/api/datarobot";
import indexHtml from "./index.html";

const apiToken = process.env.DATAROBOT_API_TOKEN;

if (!apiToken) {
  console.error("Error: DATAROBOT_API_TOKEN not found in .env file");
  process.exit(1);
}

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

Bun.serve({
  port: 3000,
  idleTimeout: 120,
  routes: {
    "/": indexHtml,
    "/api/notebooks": {
      async GET(req) {
        try {
          const { notebooks, useCases } = await fetchData();

          const useCaseMap = new Map(useCases.map(uc => [uc.id, uc.name]));

          const enrichedNotebooks = notebooks.map(notebook => ({
            ...notebook,
            useCaseName: useCaseMap.get(notebook.useCaseId) || "Unknown",
          }));

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
    }
  },
  development: {
    hmr: true,
  },
});

console.log("Server running at http://localhost:3000");