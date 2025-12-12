import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, AlertTriangle, Brain, User, Zap, Target, BookOpen, Loader2, ArrowLeft, FileText } from 'lucide-react';
import { AnalysisResult, HiringRecommendation, InterviewPlan, UploadedFile, JobContext } from '../types';
import { generateInterviewPlan, extractResumeRawText } from '../services/geminiService';
import InterviewGuideModal from './InterviewGuideModal';
import RawTextPreviewModal from './RawTextPreviewModal'; // New component for raw text

interface AnalysisViewProps {
  result: AnalysisResult;
  onReset: () => void;
  // We need file and jobContext to generate the plan if requested
  file?: UploadedFile | null; 
  jobContext?: JobContext;
  onBackToList?: () => void; // New prop for batch mode navigation
  onShowToast: (message: string, type: 'success' | 'error' | 'warning') => void;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ result, onReset, file, jobContext, onBackToList, onShowToast }) => {
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [interviewPlan, setInterviewPlan] = useState<InterviewPlan | null>(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);

  const [isExtractingText, setIsExtractingText] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isRawTextModalOpen, setIsRawTextModalOpen] = useState(false);


  const getScoreColor = (score: number) => {
    if (score >= 80) return '#22c55e'; // green-500
    if (score >= 60) return '#eab308'; // yellow-500
    return '#ef4444'; // red-500
  };

  const scoreData = [
    { name: 'Score', value: result.score },
    { name: 'Remaining', value: 100 - result.score },
  ];

  const recommendationConfig = {
    [HiringRecommendation.HIRE]: { color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle, label: '建议录用' },
    [HiringRecommendation.MAYBE]: { color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: AlertTriangle, label: '谨慎考虑' },
    [HiringRecommendation.REJECT]: { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: '不予推荐' },
  };

  const rec = recommendationConfig[result.recommendation];

  const handleGeneratePlan = async () => {
    if (!file || !jobContext) {
        onShowToast("缺少简历或职位信息，无法生成面试指南。", "warning");
        return;
    }
    
    // If we already have the plan, just open the modal
    if (interviewPlan) {
        setIsInterviewModalOpen(true);
        return;
    }

    setIsGeneratingPlan(true);
    try {
        const plan = await generateInterviewPlan(file, jobContext, result.candidateName);
        setInterviewPlan(plan);
        setIsInterviewModalOpen(true);
        onShowToast("面试指南生成成功！", "success");
    } catch (error: any) {
        onShowToast(`生成面试指南失败：${error.message}`, "error");
        console.error(error);
    } finally {
        setIsGeneratingPlan(false);
    }
  };

  const handleExtractRawText = async () => {
    if (!file || file.type === 'text') {
        onShowToast("此简历类型不支持原文提取，或文件信息缺失。", "warning");
        return;
    }

    setIsExtractingText(true);
    try {
        const text = await extractResumeRawText(file);
        setExtractedText(text);
        setIsRawTextModalOpen(true);
        onShowToast("简历原文提取成功！", "success");
    } catch (error: any) {
        onShowToast(`提取原文失败：${error.message}`, "error");
        console.error(error);
    } finally {
        setIsExtractingText(false);
    }
  };


  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <InterviewGuideModal 
        isOpen={isInterviewModalOpen} 
        onClose={() => setIsInterviewModalOpen(false)} 
        plan={interviewPlan}
        candidateName={result.candidateName}
      />

      <RawTextPreviewModal 
        isOpen={isRawTextModalOpen} 
        onClose={() => setIsRawTextModalOpen(false)} 
        rawText={extractedText}
        fileName={file?.name || '未知文件'}
      />

      {/* Back to List Button (Only if prop provided) */}
      {onBackToList && (
          <button 
            onClick={onBackToList}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors font-medium mb-2"
          >
              <ArrowLeft className="w-4 h-4" />
              返回批量列表
          </button>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
            
          {/* Score Chart */}
          <div className="relative w-40 h-40 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={getScoreColor(result.score)} />
                  <Cell fill="#f1f5f9" />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-gray-900">{result.score}</span>
              <span className="text-xs text-gray-500 font-medium uppercase">匹配度</span>
            </div>
          </div>

          {/* Candidate Headlines */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start items-center mb-2">
                    <h2 className="text-3xl font-bold text-gray-900">{result.candidateName || '候选人'}</h2>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold border flex items-center gap-2 ${rec.color}`}>
                        <rec.icon className="w-4 h-4" />
                        {rec.label}
                    </span>
                </div>
                <p className="text-xl text-gray-600 font-medium italic">"{result.headline}"</p>
            </div>
            
            <p className="text-gray-600 leading-relaxed max-w-2xl">
                {result.summary}
            </p>
            {(file && file.type !== 'text') && (
                <button
                    onClick={handleExtractRawText}
                    disabled={isExtractingText}
                    className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 mx-auto md:mx-0"
                >
                    {isExtractingText ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            提取中...
                        </>
                    ) : (
                        <>
                            <FileText className="w-4 h-4" />
                            查看原文
                        </>
                    )}
                </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pros & Cons */}
          <div className="md:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                    <Target className="w-5 h-5 text-gray-500" />
                    <h3 className="font-semibold text-gray-900">分析详情</h3>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                          <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4" /> 优势
                          </h4>
                          <ul className="space-y-3">
                              {result.pros.map((pro, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                                      {pro}
                                  </li>
                              ))}
                          </ul>
                      </div>
                      <div>
                          <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> 劣势与风险
                          </h4>
                           <ul className="space-y-3">
                              {result.cons.map((con, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                                      {con}
                                  </li>
                              ))}
                          </ul>
                      </div>
                  </div>
              </div>

               {/* Skills Gap */}
               {result.skillsGap && result.skillsGap.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h4 className="text-sm font-bold text-orange-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap className="w-4 h-4" /> 缺失/薄弱技能
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {result.skillsGap.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-orange-50 text-orange-700 border border-orange-100 rounded-lg text-sm">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
               )}

              {/* Reasoning */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <h4 className="font-semibold text-gray-900 mb-3">AI 评估理由</h4>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
                    {result.reasoning}
                </p>
              </div>
          </div>

          {/* Personality & Actions Sidebar */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 bg-indigo-600 text-white flex items-center gap-2">
                    <Brain className="w-5 h-5" />
                    <h3 className="font-semibold">人格画像</h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="text-center p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <User className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                        <h4 className="font-bold text-indigo-900">{result.personality.archetype}</h4>
                        <p className="text-xs text-indigo-600 uppercase tracking-wide mt-1">原型</p>
                    </div>

                    <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">关键特质</h5>
                        <div className="flex flex-wrap gap-2">
                            {result.personality.traits.map((trait, i) => (
                                <span key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                                    {trait}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">沟通风格</h5>
                        <p className="text-sm text-gray-700">{result.personality.communicationStyle}</p>
                    </div>

                    <div>
                        <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">文化契合度</h5>
                        <p className="text-sm text-gray-700">{result.personality.cultureFit}</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
                <button
                    onClick={handleGeneratePlan}
                    disabled={isGeneratingPlan || !file || !jobContext}
                    className="w-full py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm flex items-center justify-center gap-2"
                >
                    {isGeneratingPlan ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            生成中...
                        </>
                    ) : (
                        <>
                            <BookOpen className="w-5 h-5" />
                            生成结构化面试指南
                        </>
                    )}
                </button>

                {!onBackToList && (
                    <button 
                        onClick={onReset}
                        className="w-full py-3 bg-white border border-gray-300 shadow-sm text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
                    >
                        筛选下一位
                    </button>
                )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default AnalysisView;