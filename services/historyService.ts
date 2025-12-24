import { HistorySession, BatchItem, JobContext } from "../types";

const STORAGE_KEY = 'resume_ai_history_v1';

export const saveSession = (job: JobContext, items: BatchItem[]): HistorySession | null => {
  try {
    // Calculate stats
    const completedItems = items.filter(i => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return null;

    const totalScore = completedItems.reduce((acc, curr) => acc + (curr.result?.score || 0), 0);
    const averageScore = Math.round(totalScore / completedItems.length);

    // Create session object
    const session: HistorySession = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      jobTitle: job.title,
      jobDescription: job.description,
      headcount: job.headcount,
      items: items,
      totalCandidates: items.length,
      averageScore
    };

    // Get existing history
    const existingHistory = getHistory();
    const newHistory = [session, ...existingHistory].slice(0, 20); // Keep last 20 sessions

    // Try to save. Note: localStorage has 5MB limit. 
    // If files are large (images), this might fail. 
    // Optimization: We could strip 'content' from files if needed, but let's try full save first.
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.warn("Storage quota exceeded, trying to save without file content backup...");
        // Fallback: Strip heavy content to save at least the results
        const lightSession = {
            ...session,
            items: session.items.map(item => ({
                ...item,
                file: { ...item.file, content: '' } // Remove content to save space
            }))
        };
        const lightHistory = [lightSession, ...existingHistory].slice(0, 20);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(lightHistory));
    }

    return session;
  } catch (error) {
    console.error("Failed to save history:", error);
    return null;
  }
};

export const getHistory = (): HistorySession[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
};

export const clearHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const deleteSession = (id: string): HistorySession[] => {
    const history = getHistory();
    const newHistory = history.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    return newHistory;
};
