# Final Manual Edits for KioskViews.tsx

## You have 2 options:

### Option A: Small targeted edits (2 changes)

#### Change 1: Lines 111-163 - Replace analytics calculation
Find this section (around line 111):
```tsx
// --- REAL METRICS CALCULATION ---
const { avgLatency, totalTokens, chartValues } = useMemo(() => {
```

Replace everything from line 111 to line 163 (ending with `}, []);`) with:
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

#### Change 2: Lines 408-417 - Add CSV Export button
Find this section (around line 408):
```tsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={14} />
  <input 
```

Replace it with:
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
  
  {/* CSV Export Button */}
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

Don't forget to close the closing `</div>` tag after the input!

### Option B: Use find-and-replace (easier)

1. Press Ctrl+H in VSCode
2. Enable regex mode (.*button)
3. **First replacement:**
   - Find: `// --- REAL METRICS CALCULATION ---[\s\S]*?const chartLabels = useMemo\(\(\) => \{[\s\S]*?\}, \[\]\);`
   - Replace with the code from Change 1 above

Save and you're done!

## What you'll get:
✅ Monthly analytics (W1 W2 W3 W4) working
✅ CSV Export button in Logs view
✅ All calculations using the utility functions
