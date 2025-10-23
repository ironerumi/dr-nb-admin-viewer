import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type ColumnSizingState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, Copy, Download } from "lucide-react";
import type { Notebook } from "../types/notebook";
import { Button } from "./ui/button";
import { ButtonGroup } from "./ui/button-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

interface NotebooksTableProps {
  data: Notebook[];
}

const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const iso = date.toISOString();
  return iso.length >= 10 ? iso.slice(0, 10) : iso;
};

const formatBoolean = (value: boolean): string => {
  return value ? "はい" : "いいえ";
};

const escapeCsvValue = (value: string): string => {
  if (value.includes("\"") || value.includes(",") || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
};

interface ColumnExportMeta {
  label: string;
  getValue?: (row: Notebook) => string;
  extra?: Array<{
    label: string;
    getValue: (row: Notebook) => string;
  }>;
}

export const NotebooksTable: React.FC<NotebooksTableProps> = ({ data }) => {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied">("idle");
  const copyTimeoutRef = React.useRef<number | null>(null);

  const columns = useMemo<ColumnDef<Notebook>[]>(
    () => [
      {
        accessorKey: "useCaseName",
        size: 240,
        minSize: 160,
        enableResizing: true,
        meta: {
          label: "UC名",
          getValue: (row: Notebook) => row.useCaseName ?? "-",
          extra: [
            {
              label: "UC名_link",
              getValue: (row: Notebook) => row.useCaseUrl ?? "",
            },
          ],
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            UC名
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const useCaseName = row.original.useCaseName;
          const useCaseUrl = row.original.useCaseUrl;

          if (!useCaseName) {
            return "-";
          }

          if (!useCaseUrl) {
            return useCaseName;
          }

          return (
            <a
              href={useCaseUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="truncate text-sky-600 underline underline-offset-2 hover:text-sky-500 dark:text-sky-400"
              title={useCaseName}
            >
              {useCaseName}
            </a>
          );
        },
      },
      {
        accessorKey: "name",
        size: 240,
        minSize: 160,
        enableResizing: true,
        meta: {
          label: "名前",
          getValue: (row: Notebook) => row.name ?? "-",
          extra: [
            {
              label: "名前_link",
              getValue: (row: Notebook) => row.notebookUrl ?? "",
            },
          ],
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            名前
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => {
          const { name, notebookUrl } = row.original;

          if (!name) {
            return "-";
          }

          if (!notebookUrl) {
            return name;
          }

          return (
            <a
              href={notebookUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="truncate text-sky-600 underline underline-offset-2 hover:text-sky-500 dark:text-sky-400"
              title={name}
            >
              {name}
            </a>
          );
        },
      },
      {
        accessorKey: "type",
        size: 160,
        minSize: 120,
        enableResizing: true,
        meta: {
          label: "タイプ",
          getValue: (row: Notebook) => row.type ?? "-",
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            タイプ
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
      },
      {
        accessorKey: "session.status",
        size: 160,
        minSize: 120,
        enableResizing: true,
        meta: {
          label: "ステータス",
          getValue: (row: Notebook) => row.session?.status ?? "-",
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            ステータス
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.session?.status || "-",
      },
      {
        accessorKey: "updated.at",
        size: 170,
        minSize: 140,
        enableResizing: true,
        meta: {
          label: "編集日時",
          getValue: (row: Notebook) => formatDate(row.updated?.at),
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            編集日時
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.updated?.at),
      },
      {
        accessorKey: "updated.by.username",
        size: 180,
        minSize: 140,
        enableResizing: true,
        meta: {
          label: "編集者",
          getValue: (row: Notebook) => row.updated?.by?.username ?? "-",
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            編集者
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.updated.by.username,
      },
      {
        accessorKey: "created.at",
        size: 170,
        minSize: 140,
        enableResizing: true,
        meta: {
          label: "作成時間",
          getValue: (row: Notebook) => formatDate(row.created?.at),
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            作成時間
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatDate(row.original.created?.at),
      },
      {
        accessorKey: "created.by.username",
        size: 180,
        minSize: 140,
        enableResizing: true,
        meta: {
          label: "作成者",
          getValue: (row: Notebook) => row.created?.by?.username ?? "-",
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            作成者
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => row.original.created.by.username,
      },
      {
        accessorKey: "hasSchedule",
        size: 140,
        minSize: 120,
        maxSize: 220,
        enableResizing: true,
        meta: {
          label: "定期実行",
          getValue: (row: Notebook) => formatBoolean(row.hasSchedule),
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            定期実行
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatBoolean(row.getValue("hasSchedule")),
      },
      {
        accessorKey: "hasEnabledSchedule",
        size: 160,
        minSize: 120,
        maxSize: 240,
        enableResizing: true,
        meta: {
          label: "定期実行有効",
          getValue: (row: Notebook) => formatBoolean(row.hasEnabledSchedule),
        } satisfies ColumnExportMeta,
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="hover:bg-transparent p-0"
          >
            定期実行有効
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row }) => formatBoolean(row.getValue("hasEnabledSchedule")),
      },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnSizingChange: setColumnSizing,
    enableColumnResizing: true,
    columnResizeMode: "onChange",
    state: {
      sorting,
      columnSizing,
    },
    initialState: {
      pagination: {
        pageSize: 100,
      },
    },
  });

  const totalTableWidth = table.getTotalSize();

  const buildCsv = React.useCallback((): string => {
    const visibleColumns = table.getVisibleLeafColumns();

    if (!visibleColumns.length) {
      return "";
    }

    const header = visibleColumns
      .flatMap((column) => {
        const meta = column.columnDef.meta as ColumnExportMeta | undefined;
        const baseLabel = escapeCsvValue(meta?.label ?? column.id);
        const extraLabels = meta?.extra?.map((extra) => escapeCsvValue(extra.label)) ?? [];
        return [baseLabel, ...extraLabels];
      })
      .join(",");

    const rowsCsv = table.getRowModel().rows.map((row) => {
      const cells = visibleColumns.flatMap((column) => {
        const meta = column.columnDef.meta as ColumnExportMeta | undefined;
        const raw = meta?.getValue ? meta.getValue(row.original) : row.getValue(column.id);
        const value = raw == null ? "" : typeof raw === "string" ? raw : String(raw);
        const baseValue = escapeCsvValue(value);
        const extraValues = meta?.extra?.map((extra) => {
          const extraRaw = extra.getValue(row.original);
          const extraValue = extraRaw == null ? "" : typeof extraRaw === "string" ? extraRaw : String(extraRaw);
          return escapeCsvValue(extraValue);
        }) ?? [];

        return [baseValue, ...extraValues];
      });

      return cells.join(",");
    });

    return [header, ...rowsCsv].join("\n");
  }, [table]);

  const scheduleCopyReset = React.useCallback(() => {
    if (copyTimeoutRef.current !== null) {
      window.clearTimeout(copyTimeoutRef.current);
    }

    copyTimeoutRef.current = window.setTimeout(() => {
      setCopyStatus("idle");
      copyTimeoutRef.current = null;
    }, 2000);
  }, []);

  const handleCopy = React.useCallback(async () => {
    const csv = buildCsv();

    if (!csv) {
      console.warn("No table data available to copy.");
      return;
    }

    try {
      let copied = false;

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(csv);
        copied = true;
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = csv;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        copied = document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      if (!copied) {
        console.warn("Failed to copy table data");
        return;
      }

      setCopyStatus("copied");
      scheduleCopyReset();
    } catch (error) {
      console.warn("Failed to copy table data", error);
    }
  }, [buildCsv, scheduleCopyReset]);

  const handleDownload = React.useCallback(() => {
    const csv = buildCsv();

    if (!csv) {
      console.warn("No table data available to download.");
      return;
    }

    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8-sig;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "list.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.warn("Failed to download table data", error);
    }
  }, [buildCsv]);

  React.useEffect(() => {
    return () => {
      if (copyTimeoutRef.current !== null) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ButtonGroup size="sm">
          <Button variant="outline" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            {copyStatus === "copied" ? "Copied" : "Copy"}
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </ButtonGroup>
      </div>
      <div className="rounded-md border">
        <Table
          style={{
            width: `${totalTableWidth}px`,
            tableLayout: "fixed",
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const minSize = header.column.columnDef.minSize;
                  const maxSize = header.column.columnDef.maxSize;

                  return (
                    <TableHead
                      key={header.id}
                      className="relative"
                      style={{
                        width: `${header.getSize()}px`,
                        minWidth: typeof minSize === "number" ? `${minSize}px` : undefined,
                        maxWidth: typeof maxSize === "number" ? `${maxSize}px` : undefined,
                      }}
                    >
                      {header.isPlaceholder ? null : (
                        <>
                          <div className="flex h-full min-w-0 items-center pr-2 overflow-hidden text-ellipsis whitespace-nowrap">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </div>
                          {header.column.getCanResize() ? (
                            <div
                              role="separator"
                              aria-orientation="vertical"
                              aria-label="Resize column"
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className={`absolute right-0 top-0 z-10 h-full w-2 cursor-col-resize select-none touch-none transition-colors ${
                                header.column.getIsResizing()
                                  ? "bg-border"
                                  : "bg-transparent hover:bg-border"
                              }`}
                            />
                          ) : null}
                        </>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => {
                    const minSize = cell.column.columnDef.minSize;
                    const maxSize = cell.column.columnDef.maxSize;
                    const cellValue = cell.getValue();

                    return (
                      <TableCell
                        key={cell.id}
                        style={{
                          width: `${cell.column.getSize()}px`,
                          minWidth: typeof minSize === "number" ? `${minSize}px` : undefined,
                          maxWidth: typeof maxSize === "number" ? `${maxSize}px` : undefined,
                        }}
                      >
                        <div
                          className="block max-w-full truncate"
                          title={
                            typeof cellValue === "string" ? cellValue : undefined
                          }
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  データがありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} 件中{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}
          -
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          件を表示
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            前へ
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            次へ
          </Button>
        </div>
      </div>
    </div>
  );
};
