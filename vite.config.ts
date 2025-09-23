import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['HeaderTrimo.png', 'HeaderTrimo2.png', 'IconTrimo.png'],
          injectRegister: 'auto',
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 jours
                  },
                  cacheableResponse: {
                    statuses: [0, 200]
                  }
                }
              }
            ]
          },
          manifest: {
            short_name: "Trimo",
            name: "Gestionnaire de Notes Scolaires",
            description: "Une application de gestion personnelle des notes scolaires",
            icons: [
              {
                src: "IconTrimo.png",
                sizes: "512x512",
                type: "image/png",
                purpose: "any maskable"
              }
            ],
            id: "/",
            start_url: "/",
            scope: "/",
            display: "standalone",
            theme_color: "#2563eb",
            background_color: "#f1f5f9"
          }
        }),
      ],
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
