import React, { useState, useEffect, useRef } from 'react';
import { UploadedFile, JobContext, BatchItem, HistorySession } from './types';
import ResumeUploader from './components/ResumeUploader';
import JobInput from './components/JobInput';
import AnalysisView from './components/AnalysisView';
import BatchResults from './components/BatchResults';
import HistoryDrawer from './components/HistoryDrawer';
import ApiKeyModal from './components/ApiKeyModal';
import RawTextPreviewModal from './components/RawTextPreviewModal';
import { analyzeResume } from './services/geminiService';
import { saveSession, getHistory, deleteSession } from './services/historyService';
import { Sparkles, ScanLine, RefreshCcw, History, Settings, Key, X, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';

interface ToastMessage {
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning';
}

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]
  );
  const [jobContext, setJobContext] = useState<JobContext>({ title: '', description: '' });
  
  // Batch State
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentView, setCurrentView] = useState<'input' | 'list' | 'detail'>('input');
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historySessions, setHistorySessions] = useState<HistorySession[]>([]);

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [temperature, setTemperature] = useState<number>(() => {
    const storedTemp = localStorage.getItem('gemini_temperature');
    return storedTemp ? Math.max(0, Math.min(1, parseFloat(storedTemp))) : 0.4;
  });

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const toastIdRef = useRef(0);

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
      const id = (toastIdRef.current++).toString();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
          setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 5000); // Toast disappears after 5 seconds
  };

  const removeToast = (id: string) => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
  };


  useEffect(() => {
    // Load history on mount
    setHistorySessions(getHistory());
    
    // Check API Key immediately
    const key = localStorage.getItem('gemini_api_key');
    const exists = !!key;
    setHasApiKey(exists);
    if (!exists) {
        // Auto open modal if no key is found to enforce "bring your own key"
        setIsSettingsOpen(true);
    }
  }, []);

  const handleSettingsClose = () => {
      setIsSettingsOpen(false);
      // Re-check key status when modal closes
      const keyExists = !!localStorage.getItem('gemini_api_key');
      setHasApiKey(keyExists);
      if (!keyExists) {
          showToast("API Key 未配置，部分功能将受限。", "warning");
      } else {
          showToast("API Key 已更新。", "success");
      }
      // Also update temperature state
      const storedTemp = localStorage.getItem('gemini_temperature');
      setTemperature(storedTemp ? Math.max(0, Math.min(1, parseFloat(storedTemp))) : 0.4);
  };

  const handleBatchAnalyze = async () => {
    if (!hasApiKey) {
        setIsSettingsOpen(true);
        showToast("请先配置 Google Gemini API Key 才能开始分析。", "warning");
        return;
    }

    if (files.length === 0 || !jobContext.description) {
        showToast("请至少上传一份简历并填写职位描述。", "warning");
        return;
    }
    
    // Initialize batch items
    const initialItems: BatchItem[] = files.map(f => ({
      file: f,
      status: 'idle',
      result: null
    }));
    
    setBatchItems(initialItems);
    setCurrentView('list');
    setIsProcessing(true);
    showToast(`开始分析 ${files.length} 份简历...`, "success");

    let processedItems = [...initialItems];

    // Process sequentially
    for (let i = 0; i < initialItems.length; i++) {
        const item = initialItems[i];
        
        // Update status to analyzing
        setBatchItems(prev => prev.map(p => p.file.id === item.file.id ? { ...p, status: 'analyzing' } : p));

        try {
            const result = await analyzeResume(item.file, jobContext);
            // Update with result
            const updatedItem: BatchItem = { ...item, status: 'completed', result };
            processedItems[i] = updatedItem; // Update local tracker
            setBatchItems(prev => prev.map(p => p.file.id === item.file.id ? updatedItem : p));
            showToast(`简历 '${item.file.name}' 分析完成。`, "success");
        } catch (error: any) {
            // Check for API Key Missing error (Double check although we check hasApiKey)
            if (error.message === 'API_KEY_MISSING') {
                setIsProcessing(false);
                setIsSettingsOpen(true); 
                setHasApiKey(false); // Update state to reflect reality
                showToast("您的 API Key 无效或未设置，请重新配置。", "error");
                return; // Stop processing
            }

            // Update with error
            const errorItem: BatchItem = { ...item, status: 'error', error: error.message };
            processedItems[i] = errorItem;
            setBatchItems(prev => prev.map(p => p.file.id === item.file.id ? errorItem : p));
            showToast(`简历 '${item.file.name}' 分析失败：${error.message}`, "error");
        }
    }

    setIsProcessing(false);
    showToast("所有简历批处理完成！", "success");

    // Save to history after completion
    const saved = saveSession(jobContext, processedItems);
    if (saved) {
        setHistorySessions(prev => [saved, ...prev]);
        showToast("本次分析结果已保存到历史记录。", "success");
    }
  };

  const handleReset = () => {
    setFiles([]);
    setBatchItems([]);
    setCurrentView('input');
    setSelectedDetailId(null);
    showToast("应用已重置。", "success");
  };

  const handleViewDetails = (item: BatchItem) => {
      setSelectedDetailId(item.file.id);
      setCurrentView('detail');
  };

  const handleBackToList = () => {
      setSelectedDetailId(null);
      setCurrentView('list');
  };

  const handleRestoreSession = (session: HistorySession) => {
      setJobContext({
          title: session.jobTitle,
          description: session.jobDescription
      });
      // We might not have the original 'files' strictly separate if we stripped content
      // But for display purposes, we reconstruct files from batch items
      const restoredFiles = session.items.map(i => i.file);
      setFiles(restoredFiles);
      setBatchItems(session.items);
      setCurrentView('list');
      setIsHistoryOpen(false);
      showToast(`已恢复历史会话 '${session.jobTitle}'。`, "success");
  };

  const handleDeleteSession = (id: string) => {
      const updated = deleteSession(id);
      setHistorySessions(updated);
      showToast("历史记录已删除。", "success");
  };

  const handleClearAllHistory = () => {
      if (window.confirm("确定要清空所有历史记录吗？此操作不可撤销。")) {
          localStorage.removeItem('resume_ai_history_v1');
          setHistorySessions([]);
          showToast("所有历史记录已清除。", "success");
      }
  };

  // Derived state for the detail view
  const selectedBatchItem = batchItems.find(i => i.file.id === selectedDetailId);

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 pb-20">
      
      <HistoryDrawer 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={historySessions}
        onSelectSession={handleRestoreSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllHistory}
      />

      <ApiKeyModal 
        isOpen={isSettingsOpen}
        onClose={handleSettingsClose}
        initialTemperature={temperature}
      />

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleReset}>
              <div className="bg-blue-600 p-2 rounded-lg">
                <ScanLine className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">ResumeAI</span>
            </div>
            <div className="flex items-center gap-4">
                {currentView !== 'input' && (
                     <button onClick={handleReset} className="text-sm font-medium text-gray-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                        <RefreshCcw className="w-3 h-3" /> 重置
                     </button>
                )}
                
                <button 
                    onClick={() => setIsHistoryOpen(true)}
                    className="text-sm font-medium text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                >
                    <History className="w-4 h-4" /> 历史记录
                </button>

                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className={`p-2 rounded-full transition-colors flex items-center gap-2 px-3 border ${hasApiKey ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-red-600 border-red-200 bg-red-50 hover:bg-red-100 animate-pulse'}`}
                    title="设置 API Key"
                >
                    <Settings className="w-4 h-4" />
                    {!hasApiKey && <span className="text-xs font-bold">未配置 Key</span>}
                </button>

                <div className="h-4 w-px bg-gray-200"></div>
                <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">批量版</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* VIEW: INPUT (Upload & Job) */}
        {currentView === 'input' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in-up">
            
            {/* Left Column: Context */}
            <div className="lg:col-span-7 space-y-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">AI 智能简历筛选 (批量版)</h1>
                    <p className="text-gray-600 text-lg">
                        批量上传候选人简历，统一匹配职位描述。AI 助您快速生成人才排行榜。
                    </p>
                    {!hasApiKey && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                             <Settings className="w-4 h-4" />
                             请点击右上角或下方按钮配置您的 Google API Key 以开始使用。
                        </div>
                    )}
                </div>

                <JobInput jobContext={jobContext} setJobContext={setJobContext} />
            </div>

            {/* Right Column: Upload & Action */}
            <div className="lg:col-span-5 space-y-6 flex flex-col h-[600px]">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex-1 flex flex-col min-h-0">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 shrink-0">候选人简历列表</h2>
                    <ResumeUploader files={files} onFilesChange={setFiles} />
                </div>

                <button
                    onClick={!hasApiKey ? () => setIsSettingsOpen(true) : handleBatchAnalyze}
                    disabled={!hasApiKey ? false : (files.length === 0 || !jobContext.description || isProcessing)}
                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 shrink-0
                        ${(!hasApiKey && files.length === 0) 
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200' 
                            : isProcessing 
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                : (files.length === 0 || !jobContext.description)
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 shadow-blue-100'}`}
                >
                   {!hasApiKey ? (
                        <>
                            <Key className="w-5 h-5" />
                            配置 API Key
                        </>
                   ) : isProcessing ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            分析中...
                        </>
                   ) : (
                        <>
                            <Sparkles className="w-5 h-5" />
                            开始批量筛选 ({files.length})
                        </>
                   )}
                </button>
                
                <p className="text-center text-xs text-gray-400 shrink-0">
                    由 Gemini 2.5 Flash 提供支持 • 建议一次不超过 10 份
                </p>
            </div>
          </div>
        )}

        {/* VIEW: LIST (Batch Results) */}
        {currentView === 'list' && (
            <div className="animate-fade-in">
                <BatchResults items={batchItems} onViewDetails={handleViewDetails} />
                {isProcessing && (
                    <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                        <span>正在逐个分析简历，请稍候...</span>
                    </div>
                )}
            </div>
        )}

        {/* VIEW: DETAIL (Single Analysis) */}
        {currentView === 'detail' && selectedBatchItem && selectedBatchItem.result && (
             <AnalysisView 
                result={selectedBatchItem.result} 
                onReset={handleReset} // This won't be used much in this view but kept for compat
                onBackToList={handleBackToList}
                file={selectedBatchItem.file}
                jobContext={jobContext}
                onShowToast={showToast}
             />
        )}

      </main>

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-[999] space-y-2">
          {toasts.map(toast => (
              <div 
                  key={toast.id} 
                  className={`relative p-4 pr-10 rounded-lg shadow-md flex items-center gap-3 transition-all duration-300 ${
                      toast.type === 'success' ? 'bg-green-500 text-white' :
                      toast.type === 'error' ? 'bg-red-500 text-white' :
                      'bg-yellow-500 text-white'
                  } toast-enter-active`}
                  // Use inline style for exit animation for simplicity without react-transition-group
                  style={{ animation: 'toast-enter 0.3s forwards' }} 
              >
                  {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                  {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                  {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                  <p className="text-sm font-medium">{toast.message}</p>
                  <button onClick={() => removeToast(toast.id)} className="absolute top-2 right-2 p-1 rounded-full hover:bg-white/20">
                      <X className="w-4 h-4" />
                  </button>
              </div>
          ))}
      </div>
    </div>
  );
}

export default App;