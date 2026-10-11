import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** Social previews need absolute URLs; fall back to relative when unknown. */
function siteUrl(url: string): Plugin {
  return {
    name: 'site-url',
    transformIndexHtml: (html) => html.replaceAll('%VITE_SITE_URL%/', url ? `${url.replace(/\/$/, '')}/` : './'),
  };
}

// `base: './'` keeps every asset path relative, so the production build works
// from a domain root or from a sub-path (e.g. GitHub Pages /Code-Odyssey/).
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    base: './',
    plugins: [react(), tailwindcss(), siteUrl(env.VITE_SITE_URL ?? '')],
    build: { target: 'es2020', assetsInlineLimit: 0 },
  };
});
