import React from "react";
import type { NotebooksProgress, ProgressPhase } from "../../types/progress";

interface ProgressLoaderProps {
  progress: NotebooksProgress | null;
}

const PHASE_LABELS: Record<ProgressPhase, string> = {
  idle: "待機中",
  fetchingUseCases: "ユースケースを取得中",
  fetchingNotebooks: "ノートブックを取得中",
  done: "完了",
  error: "エラーが発生しました",
};

function formatMessage(progress: NotebooksProgress | null): string | null {
  if (!progress) return null;
  if (progress.message) return progress.message;
  if (progress.isCached) {
    return "キャッシュされた結果を使用しています";
  }

  switch (progress.phase) {
    case "fetchingUseCases":
      return `ユースケース ${progress.useCasesFetched}${
        progress.useCasesTotal ? ` / ${progress.useCasesTotal}` : ""
      } を取得中`;
    case "fetchingNotebooks":
      return `ノートブック ${progress.notebooksFetched}${
        progress.notebooksTotal ? ` / ${progress.notebooksTotal}` : ""
      } を取得中`;
    case "done":
      return "データ取得が完了しました";
    case "error":
      return progress.error ?? "データ取得に失敗しました";
    default:
      return null;
  }
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({ progress }) => {
  const phase = progress?.phase ?? "idle";
  const phaseLabel = PHASE_LABELS[phase];
  const message = formatMessage(progress);

  const useCaseTotal = progress?.useCasesTotal ?? null;
  const showUseCaseProgress = phase === "fetchingUseCases" && useCaseTotal !== null && useCaseTotal !== undefined;
  const useCasePercent = showUseCaseProgress && progress
    ? Math.round((progress.useCasesFetched / Math.max(1, useCaseTotal ?? 1)) * 100)
    : null;

  const notebooksTotal = progress?.notebooksTotal ?? null;
  const showNotebookProgress = phase === "fetchingNotebooks" && notebooksTotal !== null && notebooksTotal !== undefined;
  const notebookPercent = showNotebookProgress && progress
    ? Math.round((progress.notebooksFetched / Math.max(1, notebooksTotal ?? 1)) * 100)
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-primary rounded-lg animate-spin"
             style={{ animation: "morphing 2s ease-in-out infinite" }} />
        <style>{`
          @keyframes morphing {
            0%, 100% {
              border-radius: 0.5rem;
              transform: rotate(0deg);
            }
            25% {
              border-radius: 50%;
              transform: rotate(90deg);
            }
            50% {
              border-radius: 0.5rem;
              transform: rotate(180deg);
            }
            75% {
              border-radius: 50%;
              transform: rotate(270deg);
            }
          }
        `}</style>
      </div>

      <div className="text-center space-y-2">
        <p className="text-lg font-semibold text-primary-700">{phaseLabel}</p>
        {message ? (
          <p className={`text-sm ${phase === "error" ? "text-red-600" : "text-muted-foreground"}`}>
            {message}
          </p>
        ) : null}

        {progress?.isCached ? (
          <p className="text-xs text-muted-foreground">前回取得したデータを表示しています</p>
        ) : null}

        {showUseCaseProgress ? (
          <div className="w-64">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>ユースケース</span>
              <span>{useCasePercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, useCasePercent ?? 0))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress?.useCasesFetched} / {progress?.useCasesTotal ?? "?"}
            </p>
          </div>
        ) : null}

        {showNotebookProgress ? (
          <div className="w-64">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>ノートブック</span>
              <span>{notebookPercent}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.max(0, notebookPercent ?? 0))}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {progress?.notebooksFetched} / {progress?.notebooksTotal ?? "?"}
            </p>
            {progress?.currentUseCaseName ? (
              <p className="text-xs text-muted-foreground mt-2">
                対象ユースケース: {progress.currentUseCaseName}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

