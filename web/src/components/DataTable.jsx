import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export default function DataTable({ columns, data, onRowClick, page, totalPages, onPageChange, emptyMessage = 'Tidak ada data' }) {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-stone-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-stone-50 border-b border-stone-200">
              {columns.map((col, i) => (
                <th key={i}
                  className={`px-4 py-3.5 text-[10px] font-bold uppercase text-neo-text-secondary tracking-[0.08em] ${
                    col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                  }`}
                  style={col.width ? { width: col.width } : undefined}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-14 text-center">
                  <div className="text-gray-300 mb-1">
                    <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25M12 11.625l2.25-2.25M12 11.625l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-400">{emptyMessage}</span>
                </td>
              </tr>
            ) : data.map((row, ri) => (
              <tr key={row.id || ri}
                onClick={() => onRowClick?.(row)}
                className={`
                  border-b border-stone-100 transition-colors duration-150
                  ${ri % 2 === 1 ? 'bg-stone-50/30' : 'bg-white'}
                  ${onRowClick ? 'cursor-pointer hover:bg-emerald-50/40' : ''}
                  stagger-enter
                `}
                style={{ animationDelay: `${Math.min(ri * 30, 300)}ms` }}>
                {columns.map((col, ci) => (
                  <td key={ci}
                    className={`px-4 py-3 ${col.align === 'right' ? 'text-right font-semibold' : col.align === 'center' ? 'text-center' : 'text-gray-900'}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-t border-stone-200">
          <span className="text-[11px] font-semibold text-neo-text-secondary">
            Hal {page} dari {totalPages}
          </span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => onPageChange(page - 1)}
              className="btn-press px-2.5 py-1.5 text-xs font-bold border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...' ? (
                <span key={`e${i}`} className="px-2 py-1 text-xs font-bold text-gray-400">...</span>
              ) : (
                <button key={p} onClick={() => onPageChange(p)}
                  className={`btn-press px-3 py-1.5 text-xs font-bold border rounded-lg transition ${
                    p === page
                      ? 'bg-neo-primary text-white border-neo-primary shadow-sm'
                      : 'border-stone-200 hover:bg-stone-100'
                  }`}>
                  {p}
                </button>
              )
            )}
            <button disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}
              className="btn-press px-2.5 py-1.5 text-xs font-bold border border-stone-200 rounded-lg hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed transition">
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
