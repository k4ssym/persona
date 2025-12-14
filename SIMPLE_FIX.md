# Quick Manual Fix for KioskViews.tsx

## The file is too large for automatic editing. Here's the simplest fix:

### STEP 1: Find line 111 in KioskViews.tsx
Look for this comment:
```tsx
// --- REAL METRICS CALCULATION ---
```

### STEP 2: Replace lines 111-163 with this:

```tsx
  // --- REAL METRICS CALCULATION ---
  const analytics = useMemo(() => calculateAnalytics(logs, chartPeriod), [logs, chartPeriod]);
  const { avgLatency, totalTokens, chartValues, chartLabels } = analytics;

  const chartData = useMemo(() => {
    if (chartValues.every(v => v === 0)) return chartValues;
    
    const max = Math.max(...chartValues);
    const scale = max > 0 ? 100 / max : 1;
    return chartValues.map(v => v * scale); 
  }, [chartValues]);
```

### STEP 3: Find line 407 (in LogsView function)
Look for the search input:
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
  <input 
```

### STEP 4: Replace that `<div className="relative">` section with:

```tsx
<div className="flex items-center gap-3">
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
    <input 
      type="text" 
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search logs..." 
      className="bg-[#18181b] border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-xs text-white focus:outline-none focus:border-blue-500 w-64 transition-all"
    />
  </div>
  
  {/* Export CSV Button */}
  <button
    onClick={() => exportLogsToCSV(filteredLogs)}
    disabled={filteredLogs.length === 0}
    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 disabled:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed border border-emerald-500/20 hover:border-emerald-500/30 rounded-lg text-xs font-medium text-emerald-400 transition-all"
  >
    <Download size={14} />
    Export
  </button>
</div>
```

## ✅ That's it! 2 changes total.

Save the file and the app will reload with:
- Monthly/Weekly analytics working properly  
- CSV Export button in the Logs view
