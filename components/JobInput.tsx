import React from 'react';
import { Briefcase } from 'lucide-react';
import { JobContext } from '../types';

interface JobInputProps {
  jobContext: JobContext;
  setJobContext: (job: JobContext) => void;
}

const JobInput: React.FC<JobInputProps> = ({ jobContext, setJobContext }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Briefcase className="w-5 h-5 text-gray-500" />
        <h2 className="text-lg font-semibold text-gray-900">职位详情</h2>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">职位名称</label>
        <input 
          type="text"
          value={jobContext.title}
          onChange={(e) => setJobContext({ ...jobContext, title: e.target.value })}
          placeholder="例如：高级前端工程师"
          className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">职位描述 (JD)</label>
        <textarea 
          value={jobContext.description}
          onChange={(e) => setJobContext({ ...jobContext, description: e.target.value })}
          placeholder="在此粘贴完整的职位描述..."
          className="w-full h-32 p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y transition text-sm"
        />
      </div>
    </div>
  );
};

export default JobInput;