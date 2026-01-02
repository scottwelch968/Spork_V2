// Utility functions for exporting analytics data to CSV and JSON formats

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (data: any, filename: string) => {
  const jsonString = JSON.stringify(data, null, 2);
  downloadFile(jsonString, `${filename}.json`, 'application/json');
};

export const convertToCSV = (data: any[]): string => {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];

  return csvRows.join('\n');
};

export const exportToCSV = (data: any[], filename: string) => {
  const csvString = convertToCSV(data);
  downloadFile(csvString, `${filename}.csv`, 'text/csv');
};

// Export functions for specific analytics data types

export const exportOverviewData = (analytics: any, chartData: any[], format: 'csv' | 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    exportToJSON({
      exportDate: new Date().toISOString(),
      summary: {
        totalUsers: analytics?.totalUsers || 0,
        totalWorkspaces: analytics?.totalWorkspaces || 0,
        totalChats: analytics?.totalChats || 0,
        totalMessages: analytics?.totalMessages || 0,
      },
      usageOverTime: chartData,
    }, `overview-report-${timestamp}`);
  } else {
    const csvData = chartData.map(item => ({
      Date: item.date,
      Activities: item.count,
      Tokens: item.tokens,
    }));
    exportToCSV(csvData, `overview-report-${timestamp}`);
  }
};

export const exportModelUsageData = (data: any, format: 'csv' | 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    exportToJSON({
      exportDate: new Date().toISOString(),
      modelUsage: data,
    }, `model-usage-${timestamp}`);
  } else {
    const csvData = data.modelData?.map((item: any) => ({
      Model: item.model,
      Category: item.category || 'N/A',
      Requests: item.requests,
      Tokens: item.tokens,
      'Average Tokens': item.avgTokens?.toFixed(2) || 0,
    })) || [];
    exportToCSV(csvData, `model-usage-${timestamp}`);
  }
};

export const exportTokenAnalyticsData = (data: any, format: 'csv' | 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    exportToJSON({
      exportDate: new Date().toISOString(),
      tokenAnalytics: data,
    }, `token-analytics-${timestamp}`);
  } else {
    const csvData = data.modelData?.map((item: any) => ({
      Model: item.model,
      'Total Tokens': item.tokens,
      Requests: item.requests,
      'Avg Tokens/Request': item.avgTokens?.toFixed(2) || 0,
    })) || [];
    exportToCSV(csvData, `token-analytics-${timestamp}`);
  }
};

export const exportCostAnalyticsData = (data: any, format: 'csv' | 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    exportToJSON({
      exportDate: new Date().toISOString(),
      costAnalytics: data,
    }, `cost-breakdown-${timestamp}`);
  } else {
    const csvData = data.modelData?.map((item: any) => ({
      Model: item.model,
      'Total Cost': `$${item.cost?.toFixed(4) || 0}`,
      Requests: item.requests,
      'Avg Cost/Request': `$${item.avgCost?.toFixed(4) || 0}`,
    })) || [];
    exportToCSV(csvData, `cost-breakdown-${timestamp}`);
  }
};

export const exportLiveActivityData = (activityFeed: any[], format: 'csv' | 'json') => {
  const timestamp = new Date().toISOString().split('T')[0];
  
  if (format === 'json') {
    exportToJSON({
      exportDate: new Date().toISOString(),
      activityFeed,
    }, `live-activity-${timestamp}`);
  } else {
    const csvData = activityFeed.map(entry => ({
      Timestamp: new Date(entry.timestamp).toLocaleString(),
      User: entry.userEmail,
      Model: entry.model,
      Tokens: entry.tokens,
      Cost: `$${entry.cost.toFixed(4)}`,
    }));
    exportToCSV(csvData, `live-activity-${timestamp}`);
  }
};
