import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { identifyProductFromImage } from '../services/geminiService';
import { InventoryItem } from '../types';

interface ScannerProps {
  onScanComplete: (data: Partial<InventoryItem>) => void;
  onClose: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ onScanComplete, onClose }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        // Remove data url prefix for Gemini API
        const base64Data = base64String.split(',')[1];
        
        try {
          const result = await identifyProductFromImage(base64Data);
          onScanComplete(result);
        } catch (err) {
          setError("Failed to identify product. Please try again.");
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError("Error reading file.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            <h3 className="font-semibold text-lg">AI Product Scanner</h3>
          </div>
          <button onClick={onClose} className="hover:bg-indigo-700 p-1 rounded-full transition">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center text-center">
          {isAnalyzing ? (
            <div className="py-8 animate-pulse flex flex-col items-center">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-slate-600 font-medium">Analyzing visual data...</p>
              <p className="text-slate-400 text-sm mt-2">Identifying objects, reading labels, estimating value.</p>
            </div>
          ) : (
            <>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition-all group"
              >
                <div className="bg-white p-4 rounded-full shadow-sm mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-indigo-600" />
                </div>
                <p className="text-indigo-900 font-medium">Click to Upload Image</p>
                <p className="text-indigo-400 text-sm mt-1">Supports JPG, PNG</p>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              <div className="mt-6 text-left w-full bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> 
                  AI Capabilities
                </h4>
                <ul className="text-sm text-slate-600 space-y-1 pl-6 list-disc">
                  <li>Auto-detect product name & category</li>
                  <li>Estimate market price</li>
                  <li>Generate description from visuals</li>
                  <li>Suggest SKU format</li>
                </ul>
              </div>
            </>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm w-full">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Scanner;
