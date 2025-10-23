import React from "react";

interface CountDisplayProps {
  codespaceCount: number;
  totalCount: number;
}

export const CountDisplay: React.FC<CountDisplayProps> = ({
  codespaceCount,
  totalCount,
}) => {
  return (
    <div className="flex gap-8 mb-4 text-lg font-semibold">
      <div>Codespace合計: {codespaceCount}</div>
      <div>Notebook+Codespace合計: {totalCount}</div>
    </div>
  );
};
