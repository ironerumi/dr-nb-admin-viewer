import React, { useEffect, useState } from "react";
import type { Notebook, NotebooksResponse } from "./types/notebook";
import { NotebooksTable } from "./components/NotebooksTable";
import { FilterCheckboxes, type FilterState } from "./components/FilterCheckboxes";
import { CountDisplay } from "./components/CountDisplay";
import { MorphingSquare } from "./components/ui/loading";
import "./styles/tailwind.css";

export const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
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
      const response = await fetch("/api/notebooks");
      const data: NotebooksResponse = await response.json();
      setNotebooks(data.data);
      setCodespaceCount(data.codespaceCount);
      setTotalCount(data.total);
    } catch (error) {
      console.error("Error fetching notebooks:", error);
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
