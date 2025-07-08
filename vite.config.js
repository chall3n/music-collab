import { defineConfig } from 'vite';

export default defineConfig({
  optimizeDeps: {
    include: [
      '@tldraw/utils',
      '@tldraw/state',
      '@tldraw/state-react',
      '@tldraw/store',
      '@tldraw/validate',
      '@tldraw/tlschema',
      '@tldraw/editor',
      'tldraw',
    ],
  },
});
