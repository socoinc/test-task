type AnalyticsTableProps = {
  title: string;
  subtitle: string;
  data: Array<Record<string, string | number | null>>;
  total: number;
  emptyText: string;
};

export function AnalyticsTable({
  title,
  subtitle,
  data,
  total,
  emptyText,
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

      {columns.length === 0 ? (
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
