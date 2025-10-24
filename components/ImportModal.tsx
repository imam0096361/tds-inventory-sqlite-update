import React, { useState, useCallback } from 'react';
import { Modal } from './Modal';
import { DownloadIcon } from './Icons';

interface ImportModalProps<T> {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: T[]) => { success: boolean, message: string };
  assetName: string;
  templateHeaders: string[];
  exampleRow: string[];
}

export const ImportModal = <T extends object>({
  isOpen,
  onClose,
  onImport,
  assetName,
  templateHeaders,
  exampleRow,
}: ImportModalProps<T>) => {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = templateHeaders.join(',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${assetName.toLowerCase().replace(/\s/g, '_')}_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const processImport = useCallback(async () => {
    if (!file) {
      setImportResult({ success: false, message: 'Please select a file to import.' });
      return;
    }
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        setImportResult({ success: false, message: 'Invalid file type. Please upload a .csv file.'});
        return;
    }

    setIsProcessing(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const rows = text.split(/\r?\n/).filter(row => row.trim() !== '');
      if (rows.length < 2) {
        throw new Error('CSV file must contain a header row and at least one data row.');
      }
      
      const headerRow = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const dataRows = rows.slice(1);

      // Flexible header validation - check if required fields are present
      const missingHeaders = templateHeaders.filter(h => !headerRow.includes(h));
      if (missingHeaders.length > 0) {
         throw new Error(`Missing required CSV headers: ${missingHeaders.join(', ')}. Found: ${headerRow.join(', ')}.`);
      }

      const parsedData = dataRows.map(row => {
        const values = row.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // handle commas inside quotes
        const entry: Record<string, any> = {};
        
        // Map values to headers based on position
        headerRow.forEach((header, index) => {
          entry[header] = values[index]?.trim().replace(/"/g, '') || '';
        });
        
        // Only keep the fields defined in templateHeaders (plus id and customFields if present)
        const filteredEntry: Record<string, any> = {};
        templateHeaders.forEach(header => {
          filteredEntry[header] = entry[header];
        });
        
        // Preserve id and customFields if they exist in the import
        if (entry.id) filteredEntry.id = entry.id;
        if (entry.customFields) {
          try {
            filteredEntry.customFields = JSON.parse(entry.customFields);
          } catch {
            filteredEntry.customFields = {};
          }
        }
        
        return filteredEntry as T;
      });

      const result = onImport(parsedData);
      setImportResult(result);
      if (result.success) {
        setFile(null);
      }
    } catch (error: any) {
      setImportResult({ success: false, message: error.message || 'An unexpected error occurred during import.' });
    } finally {
      setIsProcessing(false);
    }
  }, [file, onImport, templateHeaders]);
  
  const resetAndClose = () => {
    setFile(null);
    setImportResult(null);
    setIsProcessing(false);
    onClose();
  }

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={`Import ${assetName}`}>
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload a CSV file to bulk-add {assetName}. The file must follow the specified format.
        </p>
        
        <div className="bg-gray-50 p-3 rounded-lg">
           <h4 className="text-sm font-semibold text-gray-800 mb-2">CSV Format Requirements:</h4>
           <p className="text-xs text-gray-600">The first row must be a header row with the following columns in order:</p>
           <code className="block text-xs bg-gray-200 p-2 rounded mt-1 font-mono">{templateHeaders.join(', ')}</code>
           <p className="text-xs text-gray-600 mt-2">Example data row:</p>
           <code className="block text-xs bg-gray-200 p-2 rounded mt-1 font-mono">{exampleRow.join(', ')}</code>
        </div>
        
        <button
            onClick={downloadTemplate}
            className="w-full text-sm bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
            <DownloadIcon />
            <span>Download Template CSV</span>
        </button>
        
        <div>
            <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-1">Upload CSV File</label>
            <input
                id="csv-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
        </div>

        {importResult && (
            <div className={`p-3 rounded-lg text-sm ${importResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {importResult.message}
            </div>
        )}

      </div>
       <div className="mt-6 flex justify-end space-x-4">
          <button onClick={resetAndClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            {importResult?.success ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={processImport}
            disabled={!file || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Import Data'}
          </button>
      </div>
    </Modal>
  );
};