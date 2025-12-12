import React from 'react';
import { X, MessageCircle, BookOpen, Code, Star, HelpCircle } from 'lucide-react';
import { InterviewPlan } from '../types';

interface InterviewGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: InterviewPlan | null;
  candidateName: string;
}

const InterviewGuideModal: React.FC<InterviewGuideModalProps> = ({ isOpen, onClose, plan, candidateName }) => {
  if (!isOpen || !plan) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
                <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-900">面试指南</h3>
                <p className="text-xs text-gray-500">针对 {candidateName} 的结构化面试计划</p>
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
        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            
            {/* 1. Opening */}
            <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-600 uppercase tracking-wider mb-3">
                    <MessageCircle className="w-4 h-4" /> 01. 开场与破冰
                </h4>
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-indigo-900 text-sm leading-relaxed whitespace-pre-wrap">
                    {plan.opening}
                </div>
            </section>

            {/* 2. Background Check */}
            <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
                    <BookOpen className="w-4 h-4" /> 02. 背景与经历
                </h4>
                <div className="space-y-3">
                    {plan.backgroundQuestions.map((item, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">{item.topic}</span>
                            </div>
                            <p className="font-medium text-gray-900 mb-2">{item.question}</p>
                            {item.guidance && (
                                <p className="text-xs text-gray-500 italic border-l-2 border-gray-300 pl-2">
                                    💡 提示: {item.guidance}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. Technical Assessment */}
            <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-blue-600 uppercase tracking-wider mb-3">
                    <Code className="w-4 h-4" /> 03. 技术能力评估
                </h4>
                <div className="space-y-4">
                    {plan.technicalQuestions.map((item, idx) => (
                        <div key={idx} className="bg-blue-50/50 border border-blue-100 rounded-xl p-5">
                            <h5 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs">{idx + 1}</span>
                                {item.skill}
                            </h5>
                            <p className="text-gray-800 font-medium mb-4 ml-8">{item.question}</p>
                            <div className="ml-8 bg-white rounded-lg p-3 border border-blue-100">
                                <span className="text-xs font-bold text-blue-500 uppercase block mb-1">期望回答关键点</span>
                                <ul className="list-disc list-inside space-y-1">
                                    {item.expectedKeyPoints.map((point, pIdx) => (
                                        <li key={pIdx} className="text-sm text-gray-600">{point}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Behavioral (STAR) */}
            <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-purple-600 uppercase tracking-wider mb-3">
                    <Star className="w-4 h-4" /> 04. 行为面试 (STAR法则)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plan.behavioralQuestions.map((item, idx) => (
                        <div key={idx} className="bg-purple-50/50 border border-purple-100 rounded-xl p-5">
                            <div className="mb-3">
                                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                                    考察: {item.competency}
                                </span>
                            </div>
                            <p className="text-gray-900 font-medium mb-4">{item.question}</p>
                            <div className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-purple-100">
                                <span className="font-bold text-purple-600 block mb-1">STAR 评估指南:</span>
                                {item.starGuide}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

             {/* 5. Closing */}
             <section>
                <h4 className="flex items-center gap-2 text-sm font-bold text-teal-600 uppercase tracking-wider mb-3">
                    <HelpCircle className="w-4 h-4" /> 05. 反馈与互动
                </h4>
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-teal-900 text-sm leading-relaxed whitespace-pre-wrap">
                    {plan.closing}
                </div>
            </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
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

export default InterviewGuideModal;