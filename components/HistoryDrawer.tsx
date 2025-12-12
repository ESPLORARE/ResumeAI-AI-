import React from 'react';
import { X, History, Trash2, Calendar, Briefcase, ChevronRight, AlertCircle } from 'lucide-react';
import { HistorySession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: HistorySession[];
  onSelectSession: (session: HistorySession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void; // New prop for clearing all history
}

const HistoryDrawer: React.FC<HistoryDrawerProps> = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onSelectSession, 
  onDeleteSession,
  onClearAll
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 text-gray-900 font-bold">
            <History className="w-5 h-5 text-blue-600" />
            <h3>历史记录</h3>
          </div>
          <div className="flex items-center gap-2">
            {sessions.length > 0 && (
                <button 
                    onClick={onClearAll} 
                    className="px-3 py-1 text-xs text-red-600 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center gap-1"
                >
                    <Trash2 className="w-3 h-3" /> 清空全部
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors">
                <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>暂无筛选记录</p>
                <p className="text-sm mt-2 flex items-center justify-center gap-1 text-gray-500">
                    <AlertCircle className="w-4 h-4" /> 记录仅保存在您的浏览器本地存储中。
                </p>
            </div>
          ) : (
            sessions.map((session) => (
              <div 
                key={session.id} 
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-sm transition-all group cursor-pointer"
                onClick={() => onSelectSession(session)}
              >
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-gray-900 line-clamp-1">{session.jobTitle || '未命名职位'}</h4>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(session.id);
                        }}
                        className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.timestamp).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {session.totalCandidates} 位候选人
                    </span>
                </div>

                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">平均分:</span>
                        <span className={`text-sm font-bold ${
                            session.averageScore >= 80 ? 'text-green-600' :
                            session.averageScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                            {session.averageScore}
                        </span>
                     </div>
                     <span className="text-blue-600 text-xs font-medium flex items-center group-hover:underline">
                        查看结果 <ChevronRight className="w-3 h-3" />
                     </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HistoryDrawer;