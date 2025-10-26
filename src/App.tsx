import React, { useEffect, useState } from "react";
import type { Notebook, NotebooksResponse } from "./types/notebook";
import { NotebooksTable } from "./components/NotebooksTable";
import { FilterCheckboxes, type FilterState } from "./components/FilterCheckboxes";
import { CountDisplay } from "./components/CountDisplay";
import { MorphingSquare } from "./components/ui/loading";
import "./styles/tailwind.css";

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [codespaceCount, setCodespaceCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<FilterState>({
    codespaceOnly: false,
    oneMonthOld: false,
    running: false,
  });

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const fetchNotebooks = async () => {
    try {
      const response = await fetch("./api/notebooks");

      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = `サーバーエラー: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // If JSON parsing fails, use status text
        }

        setError(errorMessage);
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
      setError("ネットワークエラー: サーバーに接続できませんでした");
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
    return <MorphingSquare />;
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
                  <p className="mb-3">{error}</p>

                  <div className="bg-red-100 border border-red-300 rounded p-3 mt-3">
                    <p className="font-semibold mb-2">考えられる原因:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>DataRobot APIトークンに必要な権限がない可能性があります</li>
                      <li>トークンの権限: ユースケース読み取り、ノートブック読み取り</li>
                      <li>サーバーログで詳細なエラー情報を確認してください</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      fetchNotebooks();
                    }}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    再試行
                  </button>
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
      />

      <FilterCheckboxes filters={filters} onChange={setFilters} />

      <NotebooksTable data={filteredNotebooks} />
    </div>
  );
};
