export const exportToCSV = <T extends object>(data: T[], filename: string) => {
    if (data.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(item =>
            headers
                .map(header => {
                    const value = (item as any)[header];
                    // Handle null/undefined, escape double quotes, and wrap if necessary
                    let stringValue = String(value ?? '').replace(/"/g, '""');
                    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
                        stringValue = `"${stringValue}"`;
                    }
                    return stringValue;
                })
                .join(',')
        )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
