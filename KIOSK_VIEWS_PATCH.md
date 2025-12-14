# KioskViews.tsx Updates - CSV Export & Monthly Analytics

## Step 1: Add import at the top (around line 10)
After the existing lucide-react imports, add:
```tsx
import { Download } from 'lucide-react';  // Add to the existing import list
import { exportLogsToCSV, calculateAnalytics } from '../lib/analyticsUtils';
```

## Step 2: Update AnalyticsView function (around line 98-162)

FIND this section:
```tsx
// --- REAL METRICS CALCULATION ---
const { avgLatency, totalTokens, chartValues } = useMemo(() => {
```

REPLACE the entire metrics calculation with:
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

## Step 3: Add Export Button to Logs View (around line 407-416)

FIND this section in LogsView function:
```tsx
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
```

REPLACE WITH:
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
      <span className="hidden md:inline">Export CSV</span>
   </button>
</div>
```

## Quick Copy-Paste Version:

### At line 10 (in imports):
```tsx
  Download
```
Add Download to the lucide-react import list, then add this line after:
```tsx
import { exportLogsToCSV, calculateAnalytics } from '../lib/analyticsUtils';
```

### Save and test!

After making these changes:
1. Save the file
2. The app will hot-reload
3. Go to Logs view
4. You should see a green "Export CSV" button
5. Monthly/Weekly toggle should now show correct data
