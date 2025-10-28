/**
 * Advanced Export Utilities
 * Professional PDF and Excel export with charts and formatting
 */

import { AIQueryResponse, AIInsight } from '../types';

/**
 * Export AI query results to PDF with charts and professional formatting
 * Note: This is a simplified version. Full implementation would require jspdf library.
 */
export function exportToPDF(
    response: AIQueryResponse,
    queryInfo: { query: string; timestamp: string }
): void {
    // For now, create a detailed HTML report that can be printed to PDF
    const reportWindow = window.open('', '_blank');
    if (!reportWindow) {
        alert('Please allow popups to export PDF');
        return;
    }

    const htmlContent = generatePDFHTML(response, queryInfo);
    reportWindow.document.write(htmlContent);
    reportWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
        reportWindow.print();
    }, 500);
}

function generatePDFHTML(response: AIQueryResponse, queryInfo: any): string {
    const data = response.data;
    const isMultiModule = response.module === 'all';
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>IT Inventory Report - ${queryInfo.timestamp}</title>
    <style>
        @page {
            margin: 1cm;
            size: A4;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            margin-bottom: 30px;
            border-radius: 8px;
        }
        
        .header h1 {
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .header .meta {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .summary-section {
            background: #f8f9fa;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .summary-section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #667eea;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
        }
        
        .summary-card {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
        }
        
        .summary-card .label {
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
            font-weight: 600;
        }
        
        .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #667eea;
            margin-top: 5px;
        }
        
        .insights-section {
            margin-bottom: 30px;
        }
        
        .insights-section h2 {
            font-size: 20px;
            margin-bottom: 15px;
            color: #495057;
        }
        
        .insight {
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid;
            display: flex;
            align-items: start;
            gap: 15px;
        }
        
        .insight.info {
            background: #e7f3ff;
            border-color: #2196F3;
        }
        
        .insight.warning {
            background: #fff8e1;
            border-color: #FFC107;
        }
        
        .insight.alert {
            background: #ffebee;
            border-color: #f44336;
        }
        
        .insight.success {
            background: #e8f5e9;
            border-color: #4CAF50;
        }
        
        .insight .icon {
            font-size: 24px;
        }
        
        .insight .content {
            flex: 1;
        }
        
        .insight .text {
            font-weight: 600;
            margin-bottom: 5px;
        }
        
        .insight .action {
            font-size: 13px;
            color: #6c757d;
            font-style: italic;
        }
        
        .data-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
        }
        
        .data-section h3 {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 12px 20px;
            margin-bottom: 15px;
            border-radius: 6px;
            font-size: 18px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        table thead {
            background: #f8f9fa;
        }
        
        table th {
            padding: 10px 8px;
            text-align: left;
            font-weight: 600;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
            text-transform: uppercase;
            font-size: 10px;
        }
        
        table td {
            padding: 8px;
            border-bottom: 1px solid #e9ecef;
        }
        
        table tbody tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        table tbody tr:hover {
            background: #e7f1ff;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            font-size: 12px;
            color: #6c757d;
        }
        
        @media print {
            body {
                background: white;
            }
            
            .header {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            .data-section {
                page-break-inside: avoid;
            }
            
            .data-section h3 {
                background: #667eea !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
            
            table {
                page-break-inside: auto;
            }
            
            tr {
                page-break-inside: avoid;
                page-break-after: auto;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📊 IT Inventory Report</h1>
        <div class="meta">
            <div><strong>Query:</strong> ${queryInfo.query}</div>
            <div><strong>Generated:</strong> ${new Date(queryInfo.timestamp).toLocaleString()}</div>
            <div><strong>Total Results:</strong> ${response.resultCount || 0} items</div>
        </div>
    </div>
    
    ${isMultiModule && response.moduleBreakdown ? `
    <div class="summary-section">
        <h2>📈 Summary</h2>
        <div class="summary-grid">
            ${Object.entries(response.moduleBreakdown).map(([module, count]) => `
                <div class="summary-card">
                    <div class="label">${module}</div>
                    <div class="value">${count}</div>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    ${response.insights && response.insights.length > 0 ? `
    <div class="insights-section">
        <h2>💡 AI Insights</h2>
        ${response.insights.map((insight: AIInsight) => `
            <div class="insight ${insight.type}">
                <div class="icon">${insight.icon}</div>
                <div class="content">
                    <div class="text">${insight.text}</div>
                    ${insight.action ? `<div class="action">→ ${insight.action}</div>` : ''}
                    ${insight.details ? `<div class="action">${insight.details}</div>` : ''}
                </div>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${isMultiModule && typeof data === 'object' && !Array.isArray(data) ? 
        Object.entries(data as Record<string, any[]>).map(([module, items]) => {
            if (!items || items.length === 0) return '';
            const headers = Object.keys(items[0]).filter(k => k !== 'id' && k !== 'itemType');
            return `
                <div class="data-section">
                    <h3>${module.toUpperCase()} (${items.length} items)</h3>
                    <table>
                        <thead>
                            <tr>
                                ${headers.map(h => `<th>${h}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${items.map(item => `
                                <tr>
                                    ${headers.map(h => `<td>${item[h] || '-'}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        }).join('')
    : 
        Array.isArray(data) && data.length > 0 ? `
            <div class="data-section">
                <h3>${response.module?.toUpperCase() || 'RESULTS'} (${data.length} items)</h3>
                <table>
                    <thead>
                        <tr>
                            ${Object.keys(data[0]).filter(k => k !== 'id').map(h => `<th>${h}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((item: any) => `
                            <tr>
                                ${Object.entries(item).filter(([k]) => k !== 'id').map(([, v]) => 
                                    `<td>${v !== null && v !== undefined ? v : '-'}</td>`
                                ).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : ''
    }
    
    <div class="footer">
        <div><strong>TDS IT Inventory Management System</strong></div>
        <div>Generated by AI Assistant • ${new Date().getFullYear()}</div>
        <div>This report contains confidential information</div>
    </div>
</body>
</html>
    `;
}

/**
 * Export data to Excel-compatible CSV with metadata
 */
export function exportToExcel(
    response: AIQueryResponse,
    queryInfo: { query: string; timestamp: string }
): void {
    const data = response.data;
    const isMultiModule = response.module === 'all';
    
    if (isMultiModule && typeof data === 'object' && !Array.isArray(data)) {
        // Export each module to separate sheets (combined in one CSV with separators)
        const csvContent = generateMultiModuleCSV(data as Record<string, any[]>, queryInfo);
        downloadCSV(csvContent, `inventory-report-${Date.now()}.csv`);
    } else if (Array.isArray(data)) {
        // Export single module
        const csvContent = generateSingleModuleCSV(data, queryInfo);
        downloadCSV(csvContent, `inventory-${response.module}-${Date.now()}.csv`);
    }
}

function generateMultiModuleCSV(data: Record<string, any[]>, queryInfo: any): string {
    let csv = `IT Inventory Report\n`;
    csv += `Query: ${queryInfo.query}\n`;
    csv += `Generated: ${new Date(queryInfo.timestamp).toLocaleString()}\n\n`;
    
    Object.entries(data).forEach(([module, items]) => {
        if (items.length > 0) {
            csv += `\n${module.toUpperCase()} (${items.length} items)\n`;
            const headers = Object.keys(items[0]).filter(k => k !== 'id');
            csv += headers.join(',') + '\n';
            items.forEach(item => {
                const row = headers.map(h => {
                    const value = item[h];
                    if (value === null || value === undefined) return '';
                    const str = String(value);
                    return str.includes(',') ? `"${str}"` : str;
                });
                csv += row.join(',') + '\n';
            });
        }
    });
    
    return csv;
}

function generateSingleModuleCSV(data: any[], queryInfo: any): string {
    if (data.length === 0) return '';
    
    let csv = `IT Inventory - ${queryInfo.query}\n`;
    csv += `Generated: ${new Date(queryInfo.timestamp).toLocaleString()}\n\n`;
    
    const headers = Object.keys(data[0]).filter(k => k !== 'id');
    csv += headers.join(',') + '\n';
    
    data.forEach(item => {
        const row = headers.map(h => {
            const value = item[h];
            if (value === null || value === undefined) return '';
            const str = String(value);
            return str.includes(',') ? `"${str}"` : str;
        });
        csv += row.join(',') + '\n';
    });
    
    return csv;
}

function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

