import { ReactNode } from "react";

interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  rows,
  isLoading,
  emptyTitle,
  emptyHint,
  onRowClick,
  rowKey,
}: {
  columns: Column<T>[];
  rows: T[];
  isLoading: boolean;
  emptyTitle: string;
  emptyHint?: string;
  onRowClick?: (row: T) => void;
  rowKey: (row: T) => string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-line bg-paper">
            {columns.map((col) => (
              <th
                key={col.header}
                className="px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wider text-slate"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate">
                Loading…
              </td>
            </tr>
          )}
          {!isLoading && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="font-display text-sm font-medium text-ink">{emptyTitle}</p>
                {emptyHint && <p className="mt-1 text-xs text-slate">{emptyHint}</p>}
              </td>
            </tr>
          )}
          {!isLoading &&
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-line last:border-0 ${
                  onRowClick ? "cursor-pointer hover:bg-paper" : ""
                }`}
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3 align-middle ${col.className ?? ""}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
