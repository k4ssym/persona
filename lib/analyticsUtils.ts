// Analytics & Export Utilities for Kiosk

import { LogEntry } from '../types';

/**
 * Export logs to CSV file
 */
export const exportLogsToCSV = (logs: LogEntry[]) => {
    const headers = [
        'ID', 'Start Time', 'Query', 'Department', 'Status',
        'Duration', 'Latency (ms)', 'Tokens', 'Model',
        'Confidence', 'Flagged', 'Messages'
    ];

    const rows = logs.map(log => [
        log.id,
        new Date(log.startTime).toISOString(),
        `"${(log.userQuery || '').replace(/"/g, '""')}"`, // Escape quotes
        log.department || '',
        log.status || '',
        log.duration || '',
        log.metadata?.latency || 0,
        log.metadata?.tokensUsed || 0,
        log.metadata?.model || '',
        log.metadata?.confidence || 0,
        log.isFlagged ? 'Yes' : 'No',
        `"${log.messages.map(m => `[${m.role}]: ${m.text}`).join(' | ').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `kiosk-logs-${new Date().toISOString().split('T')[0]}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log(`✅ Exported ${logs.length} logs to ${fileName}`);
};

/**
 * Calculate analytics metrics from logs
 */
export const calculateAnalytics = (logs: LogEntry[], period: 'Week' | 'Month') => {
    if (logs.length === 0) {
        return {
            avgLatency: 0,
            totalTokens: 0,
            chartValues: period === 'Week' ? Array(7).fill(0) : Array(4).fill(0),
            chartLabels: period === 'Week' ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'] : ['W1', 'W2', 'W3', 'W4']
        };
    }

    // Calculate totals
    const totalLat = logs.reduce((acc, log) => acc + (log.metadata?.latency || 0), 0);
    const totTokens = logs.reduce((acc, log) => acc + (log.metadata?.tokensUsed || 0), 0);

    let values: number[] = [];
    let labels: string[] = [];

    if (period === 'Week') {
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
};
