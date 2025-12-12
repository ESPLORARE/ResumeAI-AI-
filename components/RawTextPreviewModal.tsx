import React from 'react';
import { X, FileText, Copy } from 'lucide-react';

interface RawTextPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawText: string | null;
  fileName: string;
}

const RawTextPreviewModal: React.FC<RawTextPreviewModalProps> = ({ isOpen, onClose, rawText, fileName }) => {
  if (!isOpen) return null;

  const handleCopy = () => {
    if (rawText) {
      navigator.clipboard.writeText(rawText);
      // Ideally, show a toast here in a real app
      alert("文本已复制到剪贴板！"); 
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">简历原文内容</h3>
                <p className="text-xs text-gray-500">文件: {fileName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg border border-gray-100 text-gray-800">
                {rawText || "未能加载原文内容。"}
            </pre>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
             <button 
                onClick={handleCopy}
                disabled={!rawText}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
             >
                <Copy className="w-4 h-4" /> 复制
             </button>
             <button 
                onClick={onClose}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition"
             >
                关闭
             </button>
        </div>
      </div>
    </div>
  );
};

export default RawTextPreviewModal;