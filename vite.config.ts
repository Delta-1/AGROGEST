import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({plugins:[react()],server:{allowedHosts:['terminal.local']},base:process.env.GITHUB_ACTIONS ? '/AGROGEST/' : '/',build:{chunkSizeWarningLimit:900}});
