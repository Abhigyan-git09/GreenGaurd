import React, { useState } from 'react';
import { Search, Filter, ArrowUpDown, Download, Check, AlertTriangle, ShieldX } from 'lucide-react';

export default function CorporateDatabase({ data, onRemove }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('All');
  const [sortField, setSortField] = useState('skepticScore');
  const [sortOrder, setSortOrder] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.parentCorporation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'All' || item.severity === filterSeverity;

    return matchesSearch && matchesSeverity;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (typeof aVal === 'string') {
      return sortOrder === 'asc' 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }
  });

  // Export to CSV Function
  const exportToCSV = () => {
    const headers = ['ID', 'Product Name', 'Company Name', 'Parent Corp', 'Category', 'Skeptic Score', 'Severity', 'Status', 'Date'];
    const rows = sortedData.map(item => [
      item.id,
      `"${item.productName}"`,
      `"${item.companyName}"`,
      `"${item.parentCorporation}"`,
      `"${item.category}"`,
      item.skepticScore,
      item.severity,
      item.status,
      item.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EcoSkeptic_Transparency_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-[#0D1713] rounded-lg whisper-border-effect p-6">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <h2 className="font-headline-md text-lg font-bold text-text-ivory">Accountability DB</h2>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#11231c] whisper-border-effect rounded border">
            <Filter className="w-3.5 h-3.5 text-outline" />
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="bg-transparent border-none text-[10px] font-label-caps text-on-surface-variant focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="All">FILTER: ALL SEVERITY</option>
              <option value="Critical">FILTER: CRITICAL</option>
              <option value="Medium">FILTER: MEDIUM</option>
              <option value="Low">FILTER: LOW</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Company or Product..."
              className="w-full bg-[#11231c] border border-whisper-border focus:border-primary rounded pl-10 pr-4 py-2 text-xs text-text-ivory focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <button
            onClick={exportToCSV}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-on-primary font-bold font-label-caps text-[10px] px-4 py-2.5 rounded transition-all hover:brightness-105"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-outline font-label-caps text-[10px] uppercase">
              <th className="px-4 py-3 font-bold cursor-pointer hover:text-text-ivory" onClick={() => handleSort('productName')}>
                Product <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </th>
              <th className="px-4 py-3 font-bold cursor-pointer hover:text-text-ivory" onClick={() => handleSort('parentCorporation')}>
                Parent Corp <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </th>
              <th className="px-4 py-3 font-bold cursor-pointer hover:text-text-ivory" onClick={() => handleSort('category')}>
                Category <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </th>
              <th className="px-4 py-3 font-bold cursor-pointer hover:text-text-ivory text-right" onClick={() => handleSort('skepticScore')}>
                Skeptic Score <ArrowUpDown className="inline w-3 h-3 ml-1" />
              </th>
              <th className="px-4 py-3 font-bold text-center">Status</th>
              <th className="px-4 py-3 font-bold text-right">Last Audit</th>
              {onRemove && <th className="px-4 py-3 font-bold text-center">Action</th>}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 text-outline text-xs">
                  No records match your active query filters.
                </td>
              </tr>
            ) : (
              sortedData.map((item) => (
                <tr key={item.id} className="bg-[#121C18] hover:bg-[#1b2e27]/40 transition-colors whisper-border-effect rounded-lg">
                  <td className="px-4 py-3 text-text-ivory font-bold text-sm">
                    {item.productName}
                    <span className="block text-[10px] text-outline font-normal mt-0.5">{item.companyName}</span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">{item.parentCorporation}</td>
                  <td className="px-4 py-3 text-on-surface-variant text-xs">
                    <span className="bg-[#11231c] px-2 py-1 rounded text-primary text-[10px] border border-whisper-border">
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-metric-md text-sm font-bold ${
                    item.skepticScore > 75 
                      ? 'text-alert-crimson' 
                      : item.skepticScore > 40 
                      ? 'text-warning-orange' 
                      : 'text-secondary'
                  }`}>
                    {item.skepticScore}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-[9px] font-label-caps px-2 py-0.5 border flex items-center justify-center gap-1 mx-auto w-24 rounded-sm ${
                      item.status === 'Verified' 
                        ? 'bg-alert-crimson/10 text-alert-crimson border-alert-crimson/20' 
                        : item.status === 'Rejected' 
                        ? 'bg-secondary/10 text-secondary border-secondary/20' 
                        : 'bg-warning-orange/10 text-warning-orange border-warning-orange/20'
                    }`}>
                      {item.status === 'Verified' ? (
                        <>
                          <ShieldX className="w-2.5 h-2.5" />
                          FLAGGED
                        </>
                      ) : item.status === 'Rejected' ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          CLEARED
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-2.5 h-2.5" />
                          PENDING
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-outline text-xs font-metric-md">{item.created_at}</td>
                  {onRemove && (
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-alert-crimson hover:underline text-[10px] font-label-caps uppercase"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
