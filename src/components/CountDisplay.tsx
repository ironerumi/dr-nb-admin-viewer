import React from "react";
import type { AdminMode } from "../types/admin";

interface CountDisplayProps {
  codespaceCount: number;
  totalCount: number;
  adminMode?: AdminMode;
}

export const CountDisplay: React.FC<CountDisplayProps> = ({
  codespaceCount,
  totalCount,
  adminMode = "unknown",
}) => {
  const getBadgeClasses = (mode: AdminMode): string => {
    const baseClasses = "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium";

    switch (mode) {
      case "admin":
        return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-300`;
      case "user":
        return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-300`;
      case "unknown":
        return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-300`;
      default:
        return baseClasses;
    }
  };

  const getModeLabel = (mode: AdminMode): string => {
    switch (mode) {
      case "admin":
        return "モード: admin";
      case "user":
        return "モード: user";
      case "unknown":
        return "モード: 不明";
      default:
        return "モード: 不明";
    }
  };

  return (
    <div className="flex gap-8 mb-4 text-lg font-semibold items-center">
      <div className={getBadgeClasses(adminMode)}>
        {getModeLabel(adminMode)}
      </div>
      <div>Codespace合計: {codespaceCount}</div>
      <div>Notebook+Codespace合計: {totalCount}</div>
    </div>
  );
};
