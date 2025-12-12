import React, { useState, useMemo } from 'react';
import { BatchItem, HiringRecommendation } from '../types';
import { Loader2, CheckCircle, AlertTriangle, XCircle, ChevronRight, FileText, AlertCircle, Search, Filter, ArrowUpDown } from 'lucide-react';

interface BatchResultsProps {
  items: BatchItem[];
  onViewDetails: (item: BatchItem) => void;
}

type SortOption = 'scoreDesc' | 'scoreAsc' | 'nameAsc';
type FilterStatus = 'ALL' | 'HIRE' | 'MAYBE' | 'REJECT';

const BatchResults: React.FC<BatchResultsProps> = ({ items, onViewDetails }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('scoreDesc');
  const [filterRec, setFilterRec] = useState<FilterStatus>('ALL');
  const [minScore, setMinScore] = useState<number>(0);

  // Process items based on filters and sort
  const processedItems = useMemo(() => {
    let result = [...items];

    // 1. Search
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(
        item => 
          item.file.name.toLowerCase().includes(lowerTerm) || 
          (item.result?.candidateName && item.result.candidateName.toLowerCase().includes(lowerTerm))
      );
    }

    // 2. Filter Recommendation
    if (filterRec !== 'ALL') {
      result = result.filter(item => item.result?.recommendation === filterRec);
    }

    // 3. Filter Score
    if (minScore > 0) {
        result = result.filter(item => (item.result?.score || 0) >= minScore);
    }

    // 4. Sort
    result.sort((a, b) => {
      // Always put processing/errors at bottom for score sorts
      const scoreA = a.result?.score ?? -1;
      const scoreB = b.result?.score ?? -1;

      switch (sortBy) {
        case 'scoreDesc':
          return scoreB - scoreA;
        case 'scoreAsc':
          // If -1 (no result), push to bottom
          if (scoreA === -1 && scoreB !== -1) return 1;
          if (scoreB === -1 && scoreA !== -1) return -1;
          return scoreA - scoreB;
        case 'nameAsc':
          return a.file.name.localeCompare(b.file.name);
        default:
          return 0;
      }
    });

    return result;
  }, [items, searchTerm, sortBy, filterRec, minScore]);

  const getRecIcon = (rec: HiringRecommendation) => {
    switch (rec) {
      case HiringRecommendation.HIRE: return <CheckCircle className="w-4 h-4 text-green-500" />;
      case HiringRecommendation.MAYBE: return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case HiringRecommendation.REJECT: return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusBadge = (item: BatchItem) => {
      if (item.status === 'analyzing') return <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full"><Loader2 className="w-3 h-3 animate-spin"/> 分析中</span>;
      if (item.status === 'idle') return <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">等待中</span>;
      if (item.status === 'error') return <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full"><AlertCircle className="w-3 h-3"/> 失败</span>;
      
      // Completed
      return (
        <div className="flex items-center gap-2">
             <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                 item.result?.recommendation === HiringRecommendation.HIRE ? 'bg-green-50 border-green-200 text-green-700' :
                 item.result?.recommendation === HiringRecommendation.MAYBE ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                 'bg-red-50 border-red-200 text-red-700'
             }`}>
                 {item.result?.score}分
             </span>
        </div>
      );
  };

  return (
    <div className="space-y-4 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
             <h2 className="text-xl font-bold text-gray-900">批量分析结果 ({items.length})</h2>
             <div className="text-sm text-gray-500">
                 已完成: {items.filter(i => i.status === 'completed').length} / {items.length}
             </div>
        </div>

        {/* Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center">
            
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="搜索文件名或候选人..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="h-8 w-px bg-gray-200 hidden md:block"></div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select 
                    value={filterRec}
                    onChange={(e) => setFilterRec(e.target.value as FilterStatus)}
                    className="py-2 pl-2 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                    <option value="ALL">全部结果</option>
                    <option value="HIRE">建议录用</option>
                    <option value="MAYBE">谨慎考虑</option>
                    <option value="REJECT">不予推荐</option>
                </select>

                 <select 
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="py-2 pl-2 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                    <option value="0">全部分数</option>
                    <option value="60">60分以上</option>
                    <option value="80">80分以上</option>
                    <option value="90">90分以上</option>
                </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="py-2 pl-2 pr-8 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                >
                    <option value="scoreDesc">分数 (从高到低)</option>
                    <option value="scoreAsc">分数 (从低到高)</option>
                    <option value="nameAsc">文件名 (A-Z)</option>
                </select>
            </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-semibold">文件名</th>
                            <th className="px-6 py-4 font-semibold">候选人</th>
                            <th className="px-6 py-4 font-semibold">状态/评分</th>
                            <th className="px-6 py-4 font-semibold">建议</th>
                            <th className="px-6 py-4 font-semibold">总结</th>
                            <th className="px-6 py-4 font-semibold text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {processedItems.map((item) => (
                            <tr 
                                key={item.file.id} 
                                className={`hover:bg-gray-50 transition-colors 
                                    ${item.status === 'analyzing' ? 'bg-blue-50/40 animate-pulse-subtle' : ''}`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 text-gray-900 font-medium max-w-[150px] truncate" title={item.file.name}>
                                        <FileText className="w-4 h-4 text-gray-400" />
                                        <span className="truncate">{item.file.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {item.result?.candidateName || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(item)}
                                </td>
                                <td className="px-6 py-4">
                                    {item.result ? (
                                        <div className="flex items-center gap-1.5" title={item.result.recommendation}>
                                            {getRecIcon(item.result.recommendation)}
                                            <span className="text-gray-600 text-xs">{
                                                item.result.recommendation === HiringRecommendation.HIRE ? '录用' :
                                                item.result.recommendation === HiringRecommendation.MAYBE ? '待定' : '淘汰'
                                            }</span>
                                        </div>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={item.result?.headline}>
                                    {item.result?.headline || '-'}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {item.status === 'completed' && (
                                        <button 
                                            onClick={() => onViewDetails(item)}
                                            className="text-blue-600 hover:text-blue-800 font-medium text-xs inline-flex items-center gap-1"
                                        >
                                            详情 <ChevronRight className="w-3 h-3" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                         {processedItems.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    {items.length > 0 ? '没有符合筛选条件的简历' : '尚未添加任何简历'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
  );
};

export default BatchResults;