import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';

export const RosterImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const response = await api.importRoster(file);
      setSuccess(response.stats);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload roster");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <i className="bi bi-arrow-left mr-2"></i>
        Back to Admin Dashboard
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <i className="bi bi-file-earmark-text mr-3 text-blue-600"></i>
            Import Roster
          </h1>
          <p className="text-gray-600 mt-2">
            Upload the `roster_Report.csv` file exported from my.scouting.org to update the unit roster.
          </p>
        </div>

        <div className="p-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept=".csv" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center pointer-events-none">
              <i className="bi bi-cloud-upload text-4xl text-gray-400 mb-4"></i>
              <p className="text-lg font-medium text-gray-900">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                CSV files only
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start text-red-700">
              <i className="bi bi-exclamation-circle mr-3 mt-0.5 flex-shrink-0"></i>
              <div>
                <h3 className="font-medium">Import Failed</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {success && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start text-green-700">
              <i className="bi bi-check-circle mr-3 mt-0.5 flex-shrink-0"></i>
              <div>
                <h3 className="font-medium">Import Successful</h3>
                <ul className="text-sm mt-2 space-y-1 list-disc list-inside">
                  <li>Processed: {success.processed} rows</li>
                  <li>Added/Updated: {success.processed} members</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-colors flex items-center ${
                !file || uploading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
              }`}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                  Importing...
                </>
              ) : (
                <>
                  <i className="bi bi-upload mr-2"></i>
                  Import Roster
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
