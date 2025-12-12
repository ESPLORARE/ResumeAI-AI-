import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // GitHub Pages 部署在仓库子路径下，确保资源路径正确
      base: '/ResumeAI-AI-/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        // 直接输出到 docs，方便 GitHub Pages 选择 /docs 作为源
        outDir: 'docs'
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
