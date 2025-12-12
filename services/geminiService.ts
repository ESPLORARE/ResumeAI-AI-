import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, UploadedFile, JobContext, InterviewPlan } from "../types";

const getApiKey = (): string | null => {
  // STRICT: Only get from local storage (user provided)
  // We have removed process.env.API_KEY fallback to enforce user input
  return localStorage.getItem('gemini_api_key');
};

const getTemperature = (): number => {
  const storedTemp = localStorage.getItem('gemini_temperature');
  // Default to 0.4 if not set or invalid
  return storedTemp ? Math.max(0, Math.min(1, parseFloat(storedTemp))) : 0.4;
};

const getAIClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    candidateName: { type: Type.STRING, description: "候选人姓名" },
    score: { type: Type.INTEGER, description: "0-100分的匹配度评分" },
    headline: { type: Type.STRING, description: "简短的5-10字候选人总结标题" },
    summary: { type: Type.STRING, description: "候选人经验的综合总结" },
    pros: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "相对于职位的关键优势列表",
    },
    cons: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "潜在弱点或缺失技能列表",
    },
    skillsGap: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "JD中要求但简历中缺失或薄弱的具体技能",
    },
    personality: {
      type: Type.OBJECT,
      properties: {
        archetype: { type: Type.STRING, description: "例如：'战略型领导者'，'分析型解决者'" },
        traits: { type: Type.ARRAY, items: { type: Type.STRING } },
        communicationStyle: { type: Type.STRING },
        cultureFit: { type: Type.STRING }
      },
      required: ["archetype", "traits", "communicationStyle", "cultureFit"]
    },
    recommendation: {
      type: Type.STRING,
      enum: ["HIRE", "MAYBE", "REJECT"],
      description: "最终的录用建议"
    },
    reasoning: { type: Type.STRING, description: "评分和建议的详细理由" }
  },
  required: ["candidateName", "score", "headline", "summary", "pros", "cons", "skillsGap", "personality", "recommendation", "reasoning"]
};

const interviewPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    opening: { type: Type.STRING, description: "面试开场白和破冰话术" },
    backgroundQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          question: { type: Type.STRING },
          guidance: { type: Type.STRING, description: "对面试官的提示，说明此问题旨在考察什么" }
        },
        required: ["topic", "question"]
      }
    },
    technicalQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          skill: { type: Type.STRING, description: "考察的具体技术点" },
          question: { type: Type.STRING },
          expectedKeyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "期望候选人提到的关键点" }
        },
        required: ["skill", "question", "expectedKeyPoints"]
      }
    },
    behavioralQuestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          competency: { type: Type.STRING, description: "考察的核心胜任力，如'团队合作'、'解决冲突'" },
          question: { type: Type.STRING },
          starGuide: { type: Type.STRING, description: "使用STAR法则（情境、任务、行动、结果）的评估指南" }
        },
        required: ["competency", "question", "starGuide"]
      }
    },
    closing: { type: Type.STRING, description: "结束语，引导候选人提问并促进互动" }
  },
  required: ["opening", "backgroundQuestions", "technicalQuestions", "behavioralQuestions", "closing"]
};

export const analyzeResume = async (
  file: UploadedFile,
  job: JobContext
): Promise<AnalysisResult> => {
  const model = "gemini-2.5-flash";
  const ai = getAIClient();
  const temperature = getTemperature();
  
  const promptText = `
    你是一位资深的技术招聘专家和HR专家。
    请根据提供的职位描述（JD）分析以下简历。
    
    职位名称: ${job.title}
    职位描述: ${job.description}
    
    请提取候选人详情并进行深度评估。
    请评估技术匹配度、软技能和文化契合度。
    根据他们的写作风格、职业发展和成就，提供一份心理学人格画像。
    请保持批判性但公正。
    
    **重要：请务必使用简体中文（Chinese Simplified）输出所有分析内容。**
  `;

  let parts: any[] = [];

  // Add the file content (Supports Image and PDF via mimeType)
  if (file.type === 'image' || file.type === 'pdf') {
    parts.push({
      inlineData: {
        mimeType: file.mimeType || (file.type === 'pdf' ? 'application/pdf' : 'image/png'),
        data: file.content
      }
    });
    parts.push({ text: promptText });
  } else {
    // Text based
    parts.push({
      text: `${promptText}\n\n简历内容:\n${file.content}`
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: temperature, 
        // Adding thinkingBudget for complex PDF/image processing and structured output
        thinkingConfig: { thinkingBudget: 24576 }, // Max budget for gemini-2.5-flash
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
      throw new Error("Gemini API 未返回文本数据");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateInterviewPlan = async (
  file: UploadedFile,
  job: JobContext,
  candidateName: string
): Promise<InterviewPlan> => {
  const model = "gemini-2.5-flash";
  const ai = getAIClient();
  const temperature = getTemperature();
  
  const promptText = `
    **Role**: 结构化面试专家
    **Profile**: 你是一位经验丰富的面试专家，精通结构化行为面试和STAR提问法，在招聘领域有着深厚的背景和丰富的实践经验，能够根据职位要求和候选人简历设计出全面、有针对性的面试计划。
    
    **Goals**:
    1. 设计一份全面的面试计划，涵盖面试的各个环节。
    2. 根据职位要求，生成覆盖职位能力要求的技术评估问题。
    3. 使用STAR提问法生成行为面试问题。
    4. 引导候选人提出对公司、团队和职位的疑问，促进有效的反馈与互动。
    
    **Input**:
    - 职位名称: ${job.title}
    - 职位描述: ${job.description}
    - 候选人姓名: ${candidateName}
    
    **Workflow**:
    1. 分析职位信息和候选人简历，确定面试的重点和方向。
    2. 设计面试开场（包含破冰）。
    3. 设计背景调查问题（基于简历的具体经历）。
    4. 设计技术评估问题（覆盖JD要求的核心硬技能）。
    5. 设计行为面试问题（基于STAR法则，考察软技能）。
    6. 设计结束互动环节。

    **重要：请务必使用简体中文（Chinese Simplified）输出。**
  `;

  let parts: any[] = [];
  
  if (file.type === 'image' || file.type === 'pdf') {
    parts.push({
      inlineData: { 
          mimeType: file.mimeType || (file.type === 'pdf' ? 'application/pdf' : 'image/png'), 
          data: file.content 
      }
    });
    parts.push({ text: promptText });
  } else {
    parts.push({ text: `${promptText}\n\n简历内容:\n${file.content}` });
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: interviewPlanSchema,
        temperature: temperature,
        // Adding thinkingBudget for complex PDF/image processing and structured output
        thinkingConfig: { thinkingBudget: 24576 }, // Max budget for gemini-2.5-flash
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as InterviewPlan;
    } else {
      throw new Error("Gemini API 未返回面试计划数据");
    }
  } catch (error) {
    console.error("Gemini Interview Plan Error:", error);
    throw error;
  }
};

/**
 * Extracts raw text content from an UploadedFile using the Gemini API.
 * This is useful for previewing what the model "sees" from PDF/Image files.
 */
export const extractResumeRawText = async (file: UploadedFile): Promise<string> => {
  const model = "gemini-2.5-flash";
  const ai = getAIClient();
  const temperature = getTemperature();

  if (file.type === 'text') {
    return file.content; // Already text, no need for API call
  }

  const promptText = `请从以下文件中提取所有可读文本内容，并以纯文本格式返回。不要进行任何总结、分析或评论，只返回原始文本。`;
  
  let parts: any[] = [
    { text: promptText },
    {
      inlineData: {
        mimeType: file.mimeType || (file.type === 'pdf' ? 'application/pdf' : 'image/png'),
        data: file.content
      }
    }
  ];

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: {
        temperature: temperature,
        thinkingConfig: { thinkingBudget: 24576 },
      }
    });

    return response.text || "未能从文件中提取到任何文本。";
  } catch (error) {
    console.error("Gemini Raw Text Extraction Error:", error);
    throw error;
  }
};