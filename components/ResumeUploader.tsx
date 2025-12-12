import React, { useState, useRef } from 'react';
import { Upload, FileText, X, Image as ImageIcon, Plus, Trash2, FileType2 } from 'lucide-react';
import { UploadedFile } from '../types';

interface ResumeUploaderProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

const ResumeUploader: React.FC<ResumeUploaderProps> = ({ files, onFilesChange }) => {
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFiles = (fileList: FileList | File[]) => {
    const newFiles: UploadedFile[] = [];
    let processedCount = 0;
    const total = fileList.length;

    Array.from(fileList).forEach(file => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      const isText = file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md');

      if (isImage || isPdf) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = (e.target?.result as string).split(',')[1];
          newFiles.push({
            id: generateId(),
            type: isPdf ? 'pdf' : 'image',
            content: base64,
            name: file.name,
            mimeType: file.type
          });
          processedCount++;
          if (processedCount === total) {
             onFilesChange([...files, ...newFiles]);
          }
        };
        reader.readAsDataURL(file);
      } else if (isText) {
         const reader = new FileReader();
         reader.onload = (e) => {
           newFiles.push({
             id: generateId(),
             type: 'text',
             content: e.target?.result as string,
             name: file.name
           });
           processedCount++;
           if (processedCount === total) {
              onFilesChange([...files, ...newFiles]);
           }
         };
         reader.readAsText(file);
      } else {
          // Skip unsupported files or notify user
          processedCount++;
          if (processedCount === total && newFiles.length > 0) {
             onFilesChange([...files, ...newFiles]);
          }
      }
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset input so same files can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePasteSubmit = () => {
    if (!textInput.trim()) return;
    const newFile: UploadedFile = {
        id: generateId(),
        type: 'text',
        content: textInput,
        name: `粘贴文本 ${files.length + 1}`
    };
    onFilesChange([...files, newFile]);
    setTextInput('');
    setMode('upload'); // Switch back to view list
  };

  const removeFile = (id: string) => {
    onFilesChange(files.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string) => {
      switch(type) {
          case 'pdf': return <FileType2 className="w-4 h-4 text-red-500 shrink-0" />;
          case 'image': return <ImageIcon className="w-4 h-4 text-purple-500 shrink-0" />;
          default: return <FileText className="w-4 h-4 text-blue-500 shrink-0" />;
      }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm overflow-hidden flex flex-col h-full">
        <div className="flex border-b border-gray-100 shrink-0">
            <button 
                onClick={() => setMode('upload')}
                className={`flex-1 py-3 text-sm font-medium ${mode === 'upload' ? 'bg-gray-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                上传文件 ({files.length})
            </button>
            <button 
                onClick={() => setMode('paste')}
                className={`flex-1 py-3 text-sm font-medium ${mode === 'paste' ? 'bg-gray-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
            >
                粘贴文本
            </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto custom-scrollbar">
            {mode === 'upload' ? (
                <div className="space-y-4">
                    <div 
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            className="hidden" 
                            onChange={handleChange}
                            accept="image/*,.pdf,.txt,.md"
                            multiple // Allow multiple files
                        />
                        <div className="flex flex-col items-center gap-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                                <Plus className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-medium text-sm">点击添加或拖入多个文件</p>
                                <p className="text-xs text-gray-500 mt-1">支持 PDF、图片 (PNG/JPG) 和 文本</p>
                            </div>
                        </div>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <div className="flex justify-between items-center text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">
                                <span>已选择 {files.length} 个文件</span>
                                <button onClick={() => onFilesChange([])} className="text-red-500 hover:text-red-600">清空全部</button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                {files.map((file) => (
                                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg group hover:border-blue-200 transition-colors">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            {getFileIcon(file.type)}
                                            <span className="text-sm text-gray-700 truncate font-medium">{file.name}</span>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <textarea 
                        className="w-full h-48 p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                        placeholder="在此粘贴简历内容..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                    />
                    <button 
                        onClick={handlePasteSubmit}
                        disabled={!textInput.trim()}
                        className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
                    >
                        添加至列表
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default ResumeUploader;