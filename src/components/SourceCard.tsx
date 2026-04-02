'use client';

import { useState, useRef } from 'react';
import { BusySlot } from '@/lib/bookingReader';

interface SourceCardProps {
  onSlotsLoaded: (slots: BusySlot[]) => void;
  slots: BusySlot[];
}

export default function SourceCard({ onSlotsLoaded, slots }: SourceCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.ics')) {
      setError('Please upload a .ics calendar file');
      return;
    }
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/source/availability', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to parse file');
      onSlotsLoaded(data.slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file');
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const isConnected = slots.length > 0;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 flex-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Source Calendar</h2>
            <p className="text-sm text-gray-500">Upload .ics export</p>
          </div>
        </div>
        {isConnected && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
            {slots.length} events loaded
          </span>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' :
          isConnected ? 'border-green-400 bg-green-50' :
          'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input ref={fileInputRef} type="file" accept=".ics" className="hidden" onChange={handleInputChange} />
        {isLoading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Parsing calendar...</p>
          </div>
        ) : isConnected ? (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-green-700">{fileName}</p>
            <p className="text-xs text-green-600">{slots.length} events found — click to replace</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm font-medium text-gray-700">Drop your .ics file here</p>
            <p className="text-xs text-gray-500">or click to browse</p>
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500 font-medium mb-1">How to export from Outlook:</p>
        <p className="text-xs text-gray-400">File → Open &amp; Export → Import/Export → Export to a file → iCalendar (.ics)</p>
      </div>
    </div>
  );
}
