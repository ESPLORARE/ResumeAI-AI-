import React, { useState, useEffect } from 'react';
import { X, Key, Save, ShieldCheck, ExternalLink, Thermometer } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemperature: number; // New prop for initial value
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, initialTemperature }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [temperature, setTemperature] = useState(initialTemperature);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey) setApiKey(storedKey);

      const storedTemp = localStorage.getItem('gemini_temperature');
      setTemperature(storedTemp ? Math.max(0, Math.min(1, parseFloat(storedTemp))) : 0.4);
    }
  }, [isOpen]);

  // Update internal temperature state if prop changes (e.g., App component resets it)
  useEffect(() => {
      setTemperature(initialTemperature);
  }, [initialTemperature]);

  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('gemini_api_key');
    }
    // Save temperature
    localStorage.setItem('gemini_temperature', temperature.toFixed(1)); // Save as 1 decimal place

    onClose();
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
          setTemperature(Math.max(0, Math.min(1, value))); // Ensure between 0 and 1
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-up">
        
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <Key className="w-5 h-5" />
            </div>
            <h3>API 密钥与设置</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-800">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
                    <div>
                        <p className="font-semibold mb-1">您的密钥安全存储在本地</p>
                        <p className="opacity-90">API Key 仅保存在您的浏览器 localStorage 中，不会上传到任何中间服务器，直接用于请求 Google Gemini API。</p>
                    </div>
                </div>
            </div>

            {/* API Key Input */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Gemini API Key</label>
                <div className="relative">
                    <input 
                        type={showKey ? "text" : "password"}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full pl-4 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm"
                    />
                    <button 
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 rounded"
                    >
                        {showKey ? '隐藏' : '显示'}
                    </button>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                        获取 API Key <ExternalLink className="w-3 h-3" />
                    </a>
                    {localStorage.getItem('gemini_api_key') && (
                        <button onClick={handleClearKey} className="text-xs text-red-500 hover:text-red-600">
                            清除已存密钥
                        </button>
                    )}
                </div>
            </div>

            {/* Temperature Setting */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Thermometer className="w-4 h-4 text-gray-500" /> AI 生成温度 ({temperature.toFixed(1)})
                </label>
                <input 
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={temperature}
                    onChange={handleTemperatureChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>更严谨 (0.0)</span>
                    <span>更平衡 (0.5)</span>
                    <span>更具创造力 (1.0)</span>
                </div>
            </div>

            <button 
                onClick={handleSave}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
            >
                <Save className="w-4 h-4" />
                保存设置
            </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;