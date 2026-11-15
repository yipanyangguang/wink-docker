import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import viteCompression from "vite-plugin-compression";

// 使用配置的函数
async function useConfig() {
  const manualChunks = {
    reactDom: ["react-dom"],
    classnames: ["classnames"],
    axios: ["axios"],
    react: ["react"],
    jsxRuntime: ["react/jsx-runtime"],
  };

  return defineConfig({
    base: "/",
    plugins: [
      react(),
      viteCompression({
        filter: (file) =>
          new RegExp("\\.(js|mjs|json|css)$").test(file),
        deleteOriginFile: false,
      }),
    ],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    build: {
      assetsDir: "assets",
      rollupOptions: {
        output: {
          entryFileNames: "main.[hash].js",
          chunkFileNames: "[name].[hash].js",
          // (chunkInfo) => {
          //   if (chunkInfo.name && chunkInfo.name in manualChunks) {
          //     return `chunks/[name].js`;
          //   } else {
          //     return `[name].[hash].js`;
          //   }
          // },
          assetFileNames: "[name]-[hash].[ext]",
          manualChunks,
        },
      },
    },
    // optimizeDeps: {
    //   include: ["react"],
    // },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
        },
      },
    },
    server: {
      proxy: {
        "/api": {
          target: `http://127.0.0.1:${process.env.APP_PORT || 3000}`,
          changeOrigin: true,
        },
        "/static": {
          target: `http://127.0.0.1:${process.env.APP_PORT || 3000}`,
          changeOrigin: true,
        },
      },
      port: 5101,
    },
  });
}

export default useConfig();
