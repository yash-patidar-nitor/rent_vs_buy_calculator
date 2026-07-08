import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/rent_vs_buy_calculator/',
  plugins: [react()],
});
