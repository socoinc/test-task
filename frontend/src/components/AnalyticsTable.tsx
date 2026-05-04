type AnalyticsTableProps = {
  title: string;
  subtitle: string;
  data: Array<Record<string, string | number | null>>;
  total: number;
  emptyText: string;
  isLoading?: boolean;
  errorText?: string | null;
};

export function AnalyticsTable({
  title,
  subtitle,
  data,
  total,
  emptyText,
  isLoading = false,
  errorText = null,
}: AnalyticsTableProps) {
  const columns = data[0] ? Object.keys(data[0]) : [];

  return (
    <section className="table-card">
      <div className="table-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <span className="table-count">{total} total</span>
      </div>

      {errorText ? (
        <div className="table-error-state">{errorText}</div>
      ) : isLoading ? (
        <div className="table-loading-state">Loading analytics...</div>
      ) : columns.length === 0 ? (
        <div className="empty-state">{emptyText}</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={`${title}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={`${rowIndex}-${column}`}>{String(row[column] ?? '-')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
