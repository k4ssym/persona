import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useKiosk } from '../context/KioskContext';
import { LogEntry } from '../types';
import {
    BarChart3, TrendingUp, Search, Download
} from 'lucide-react';

const Motion = motion as any;

// CSV Export Function
const exportToCSV = (logs: LogEntry[]) => {
    // CSV Headers
    const headers = ['ID', 'Start Time', 'Query', 'Department', 'Status', 'Duration', 'Latency (ms)', 'Tokens', 'Model', 'Confidence', 'Flagged', 'Messages'];

    // CSV Rows
    const rows = logs.map(log => [
        log.id,
        new Date(log.startTime).toISOString(),
        `"${log.userQuery.replace(/"/g, '""')}"`, // Escape quotes
        log.department,
        log.status,
        log.duration,
        log.metadata?.latency || 0,
        log.metadata?.tokensUsed || 0,
        log.metadata?.model || '',
        log.metadata?.confidence || 0,
        log.isFlagged ? 'Yes' : 'No',
        `"${log.messages.map(m => `[${m.role}]: ${m.text}`).join(' | ').replace(/"/g, '""')}"`
    ]);

    // Combine
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `kiosk-logs-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Enhanced Analytics View
export function AnalyticsView() {
    const { logs } = useKiosk();
    const [chartPeriod, setChartPeriod] = useState<'Week' | 'Month'>('Week');

    const totalInteractions = logs.length;
    const resolvedCount = logs.filter(l => l.status === 'resolved').length;
    const successRate = totalInteractions > 0
        ? Math.round((resolvedCount / totalInteractions) * 100)
        : 100;

    const recentLogs = useMemo(() => logs.slice(0, 4), [logs]);

    // --- ENHANCED METRICS CALCULATION ---
    const { avgLatency, totalTokens, chartValues, chartLabels } = useMemo(() => {
        if (logs.length === 0) return {
            avgLatency: 0,
            totalTokens: 0,
            chartValues: chartPeriod === 'Week' ? Array(7).fill(0) : Array(4).fill(0),
            chartLabels: chartPeriod === 'Week' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['W1', 'W2', 'W3', 'W4']
        };

        // 1. Averages & Totals
        const totalLat = logs.reduce((acc, log) => acc + (log.metadata?.latency || 0), 0);
        const totTokens = logs.reduce((acc, log) => acc + (log.metadata?.tokensUsed || 0), 0);

        let values: number[] = [];
        let labels: string[] = [];

        if (chartPeriod === 'Week') {
            // Last 7 days
            const last7Days = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toLocaleDateString();
            });

            const dayCounts: Record<string, number> = {};
            logs.forEach(log => {
                const d = new Date(log.startTime).toLocaleDateString();
                dayCounts[d] = (dayCounts[d] || 0) + 1;
            });

            values = last7Days.map(date => dayCounts[date] || 0);

            // Dynamic day labels
            const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
            labels = Array.from({ length: 7 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return days[d.getDay()];
            });
        } else {
            // Monthly view: Last 4 weeks
            const weekRanges = Array.from({ length: 4 }, (_, i) => {
                const endDate = new Date();
                endDate.setDate(endDate.getDate() - (i * 7));
                const startDate = new Date(endDate);
                startDate.setDate(startDate.getDate() - 6);
                return { start: startDate, end: endDate };
            }).reverse();

            const weekCounts = weekRanges.map(range => {
                return logs.filter(log => {
                    const logDate = new Date(log.startTime);
                    return logDate >= range.start && logDate <= range.end;
                }).length;
            });

            values = weekCounts;
            labels = ['W1', 'W2', 'W3', 'W4'];
        }

        return {
            avgLatency: Math.round(totalLat / logs.length),
            totalTokens: totTokens,
            chartValues: values,
            chartLabels: labels
        };
    }, [logs, chartPeriod]);

    const chartData = useMemo(() => {
        if (chartValues.every(v => v === 0)) return chartValues;

        const max = Math.max(...chartValues);
        const scale = max > 0 ? 100 / max : 1;
        return chartValues.map(v => v * scale);
    }, [chartValues]);

    return {
        totalInteractions,
        successRate,
        recentLogs,
        avgLatency,
        totalTokens,
        chartData,
        chartLabels,
        chartPeriod,
        setChartPeriod
    };
}

// Export Button Component
export const ExportButton = ({ logs }: { logs: LogEntry[] }) => {
    return (
        <button
            onClick={() => exportToCSV(logs)}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 disabled:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed border border-white/10 rounded-lg text-xs font-medium text-white transition-all"
        >
            <Download size={14} />
            Export CSV
        </button>
    );
};
