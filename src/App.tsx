import React, { useEffect, useState } from "react";
import type { Notebook, NotebooksResponse } from "./types/notebook";
import type { NotebooksProgress } from "./types/progress";
import type { AdminMode, AccountProfile } from "./types/admin";
import { NotebooksTable } from "./components/NotebooksTable";
import { FilterCheckboxes, type FilterState } from "./components/FilterCheckboxes";
import { CountDisplay } from "./components/CountDisplay";
import { ProgressLoader } from "./components/ui/ProgressLoader";
import "./styles/tailwind.css";

interface ErrorState {
  message: string;
  httpStatus: number;
  requestId?: string;
  endpoint?: string;
  responseBody?: string;
}

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [codespaceCount, setCodespaceCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [progress, setProgress] = useState<NotebooksProgress | null>(null);
  const [adminMode, setAdminMode] = useState<AdminMode>("unknown");
  const [filters, setFilters] = useState<FilterState>({
    codespaceOnly: false,
    oneMonthOld: false,
    running: false,
  });

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    const pollProgress = async () => {
      try {
        const res = await fetch("./api/progress");
        if (!res.ok) {
          throw new Error(`Failed to fetch progress: ${res.status}`);
        }
        const data: NotebooksProgress = await res.json();
        if (isMounted) {
          setProgress(data);
        }
      } catch (err) {
        console.error("Failed to poll progress", err);
      }
    };

    const startPolling = () => {
      if (pollTimer === null) {
        pollTimer = setInterval(pollProgress, 1500);
      }
    };

    (async () => {
      await pollProgress();
      startPolling();
      await fetchNotebooks();
      await checkAdminStatus();
      await pollProgress();
      if (pollTimer !== null) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    })().catch(err => {
      console.error("Failed to initialize loading state", err);
    });

    return () => {
      isMounted = false;
      if (pollTimer !== null) {
        clearInterval(pollTimer);
      }
    };
  }, []);

  const checkAdminStatus = async () => {
    try {
      console.log(`Sending request to ${window.location.origin}/account/profile`);
      const response = await fetch(`${window.location.origin}/account/profile`, {
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Failed to fetch admin status:", response.status);
        setAdminMode("unknown");
        return;
      }

      const profile = await response.json() as AccountProfile;

      if (!profile.final_access_levels || !Array.isArray(profile.final_access_levels)) {
        console.warn("No access levels found in profile");
        setAdminMode("unknown");
        return;
      }

      const customAppAccess = profile.final_access_levels.find(
        (level) => level.entity === "CUSTOM_APPLICATION"
      );
      const customAppSourceAccess = profile.final_access_levels.find(
        (level) => level.entity === "CUSTOM_APPLICATION_SOURCE"
      );

      const isAdmin =
        customAppAccess?.admin === true &&
        customAppSourceAccess?.admin === true;

      const mode = isAdmin ? "admin" : "user";
      console.log(`Admin mode: ${mode}`);
      setAdminMode(mode);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setAdminMode("unknown");
    }
  };

  const fetchNotebooks = async () => {
    try {
      const response = await fetch("./api/notebooks");

      if (!response.ok) {
        let errorState: ErrorState = {
          message: `サーバーエラー: ${response.status} ${response.statusText}`,
          httpStatus: response.status,
        };

        try {
          const errorData = await response.json();
          if (typeof errorData === "object" && errorData !== null) {
            const requestId = typeof errorData.requestId === "string" ? errorData.requestId : undefined;
            const details = errorData.details as Record<string, unknown> | undefined;

            if (details) {
              if ("status" in details && typeof details.status === "number") {
                errorState.httpStatus = details.status;
              }

              if ("statusText" in details && typeof details.statusText === "string") {
                errorState.message = `サーバーエラー: ${details.status ?? response.status} ${details.statusText}`;
              }

              if ("endpoint" in details && typeof details.endpoint === "string") {
                errorState.endpoint = details.endpoint;
              }

              if ("responseBody" in details && typeof details.responseBody === "string") {
                errorState.responseBody = details.responseBody.slice(0, 500);
              }
            }

            if (typeof errorData.error === "string" && errorData.error.trim().length > 0) {
              errorState.message = errorData.error;
            }

            if (requestId) {
              errorState.requestId = requestId;
            }
          }
        } catch (jsonError) {
          console.warn("Failed to parse error response", jsonError);
          // If JSON parsing fails, keep default message
        }

        setError(errorState);
        setLoading(false);
        return;
      }

      const data: NotebooksResponse = await response.json();
      setNotebooks(data.data);
      setCodespaceCount(data.codespaceCount);
      setTotalCount(data.total);
      setError(null);
    } catch (error) {
      console.error("Error fetching notebooks:", error);
      setError({
        message: "ネットワークエラー: サーバーに接続できませんでした",
        httpStatus: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredNotebooks = notebooks.filter((notebook) => {
    if (filters.codespaceOnly && notebook.type !== "codespace") {
      return false;
    }

    if (filters.oneMonthOld) {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const updatedDate = new Date(notebook.updated.at);
      if (updatedDate >= oneMonthAgo) {
        return false;
      }
    }

    if (filters.running) {
      if (notebook.session?.status !== "running") {
        return false;
      }
    }

    return true;
  });

  if (loading) {
    return <ProgressLoader progress={progress} />;
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">
                  データの取得に失敗しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p className="mb-3">{error.message}</p>

                  {error.httpStatus ? (
                    <p className="text-xs text-red-600">HTTPステータス: {error.httpStatus}</p>
                  ) : null}

                  {error.requestId ? (
                    <p className="text-xs text-red-600">リクエストID: {error.requestId}</p>
                  ) : null}

                  {error.endpoint ? (
                    <p className="text-xs text-red-600">エンドポイント: {error.endpoint}</p>
                  ) : null}

                  {error.responseBody ? (
                    <div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
                      <p className="font-semibold mb-2">レスポンス内容:</p>
                      <pre className="text-xs whitespace-pre-wrap break-words max-h-48 overflow-auto">
                        {error.responseBody}
                      </pre>
                    </div>
                  ) : null}

                  <div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
                    <p className="font-semibold mb-2">考えられる原因:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>DataRobot APIトークンに必要な権限がない可能性があります</li>
                      <li>トークンの権限: ユースケース読み取り、ノートブック読み取り</li>
                      <li>サーバーログで詳細なエラー情報を確認してください</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Notebook管理</h1>

      <CountDisplay
        codespaceCount={codespaceCount}
        totalCount={totalCount}
        adminMode={adminMode}
      />

      <FilterCheckboxes filters={filters} onChange={setFilters} />

      <NotebooksTable data={filteredNotebooks} />
    </div>
  );
};
