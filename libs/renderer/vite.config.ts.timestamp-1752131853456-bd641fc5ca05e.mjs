// libs/renderer/vite.config.ts
import { defineConfig } from "file:///D:/Users/workspace/apache-tomcat-9.0.104/webapps/SemossWeb/node_modules/.pnpm/vitest@1.6.1_@types+node@18_aac7956ffd3bc7076a7e85088c179e5c/node_modules/vitest/dist/config.js";
import react from "file:///D:/Users/workspace/apache-tomcat-9.0.104/webapps/SemossWeb/node_modules/.pnpm/@vitejs+plugin-react@4.5.0__b2a40644ca8dd33838aa61d1dbab5616/node_modules/@vitejs/plugin-react/dist/index.mjs";
import { nxViteTsPaths } from "file:///D:/Users/workspace/apache-tomcat-9.0.104/webapps/SemossWeb/node_modules/.pnpm/@nx+vite@19.8.4_@babel+trav_d7c1da972dbdc10df498ed165a16316b/node_modules/@nx/vite/plugins/nx-tsconfig-paths.plugin.js";
import { nxCopyAssetsPlugin } from "file:///D:/Users/workspace/apache-tomcat-9.0.104/webapps/SemossWeb/node_modules/.pnpm/@nx+vite@19.8.4_@babel+trav_d7c1da972dbdc10df498ed165a16316b/node_modules/@nx/vite/plugins/nx-copy-assets.plugin.js";
import { resolve } from "node:path";
var __vite_injected_original_dirname = "D:\\Users\\workspace\\apache-tomcat-9.0.104\\webapps\\SemossWeb\\libs\\renderer";
var vite_config_default = defineConfig({
  root: __vite_injected_original_dirname,
  cacheDir: "../../node_modules/.vite/packages/renderer",
  plugins: [
    react({ include: /\.(js|jsx|ts|tsx)$/ }),
    nxViteTsPaths(),
    nxCopyAssetsPlugin(["*.md"])
  ],
  resolve: {
    alias: [{ find: "@", replacement: resolve(__vite_injected_original_dirname, "./src") }]
  },
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    name: "renderer",
    watch: false,
    globals: true,
    environment: "jsdom",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    deps: {
      // Required for vitest-canvas-mock
      inline: ["vitest-canvas-mock"]
    },
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reportsDirectory: "../../coverage/packages/renderer"
    },
    environmentOptions: {
      jsdom: {
        resources: "usable"
      }
    },
    cache: {
      dir: "../../node_modules/.vitest"
    },
    setupFiles: ["./vitest.setup.ts"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibGlicy9yZW5kZXJlci92aXRlLmNvbmZpZy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiY29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2Rpcm5hbWUgPSBcIkQ6XFxcXFVzZXJzXFxcXHdvcmtzcGFjZVxcXFxhcGFjaGUtdG9tY2F0LTkuMC4xMDRcXFxcd2ViYXBwc1xcXFxTZW1vc3NXZWJcXFxcbGlic1xcXFxyZW5kZXJlclwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcVXNlcnNcXFxcd29ya3NwYWNlXFxcXGFwYWNoZS10b21jYXQtOS4wLjEwNFxcXFx3ZWJhcHBzXFxcXFNlbW9zc1dlYlxcXFxsaWJzXFxcXHJlbmRlcmVyXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9Vc2Vycy93b3Jrc3BhY2UvYXBhY2hlLXRvbWNhdC05LjAuMTA0L3dlYmFwcHMvU2Vtb3NzV2ViL2xpYnMvcmVuZGVyZXIvdml0ZS5jb25maWcudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz0ndml0ZXN0L2NvbmZpZycgLz5cclxuaW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZXN0L2NvbmZpZyc7XHJcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XHJcbmltcG9ydCB7IG54Vml0ZVRzUGF0aHMgfSBmcm9tICdAbngvdml0ZS9wbHVnaW5zL254LXRzY29uZmlnLXBhdGhzLnBsdWdpbic7XHJcbmltcG9ydCB7IG54Q29weUFzc2V0c1BsdWdpbiB9IGZyb20gJ0BueC92aXRlL3BsdWdpbnMvbngtY29weS1hc3NldHMucGx1Z2luJztcclxuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ25vZGU6cGF0aCc7XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gICAgcm9vdDogX19kaXJuYW1lLFxyXG4gICAgY2FjaGVEaXI6ICcuLi8uLi9ub2RlX21vZHVsZXMvLnZpdGUvcGFja2FnZXMvcmVuZGVyZXInLFxyXG5cclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICByZWFjdCh7IGluY2x1ZGU6IC9cXC4oanN8anN4fHRzfHRzeCkkLyB9KSxcclxuICAgICAgICBueFZpdGVUc1BhdGhzKCksXHJcbiAgICAgICAgbnhDb3B5QXNzZXRzUGx1Z2luKFsnKi5tZCddKSxcclxuICAgIF0sXHJcblxyXG4gICAgcmVzb2x2ZToge1xyXG4gICAgICAgIGFsaWFzOiBbeyBmaW5kOiAnQCcsIHJlcGxhY2VtZW50OiByZXNvbHZlKF9fZGlybmFtZSwgJy4vc3JjJykgfV0sXHJcbiAgICB9LFxyXG5cclxuICAgIC8vIFVuY29tbWVudCB0aGlzIGlmIHlvdSBhcmUgdXNpbmcgd29ya2Vycy5cclxuICAgIC8vIHdvcmtlcjoge1xyXG4gICAgLy8gIHBsdWdpbnM6IFsgbnhWaXRlVHNQYXRocygpIF0sXHJcbiAgICAvLyB9LFxyXG5cclxuICAgIHRlc3Q6IHtcclxuICAgICAgICBuYW1lOiAncmVuZGVyZXInLFxyXG4gICAgICAgIHdhdGNoOiBmYWxzZSxcclxuICAgICAgICBnbG9iYWxzOiB0cnVlLFxyXG4gICAgICAgIGVudmlyb25tZW50OiAnanNkb20nLFxyXG4gICAgICAgIGluY2x1ZGU6IFsnKiovKi57dGVzdCxzcGVjfS57anMsbWpzLGNqcyx0cyxtdHMsY3RzLGpzeCx0c3h9J10sXHJcbiAgICAgICAgZGVwczoge1xyXG4gICAgICAgICAgICAvLyBSZXF1aXJlZCBmb3Igdml0ZXN0LWNhbnZhcy1tb2NrXHJcbiAgICAgICAgICAgIGlubGluZTogWyd2aXRlc3QtY2FudmFzLW1vY2snXSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIHJlcG9ydGVyczogWydkZWZhdWx0J10sXHJcbiAgICAgICAgY292ZXJhZ2U6IHtcclxuICAgICAgICAgICAgcHJvdmlkZXI6ICd2OCcsXHJcbiAgICAgICAgICAgIHJlcG9ydHNEaXJlY3Rvcnk6ICcuLi8uLi9jb3ZlcmFnZS9wYWNrYWdlcy9yZW5kZXJlcicsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBlbnZpcm9ubWVudE9wdGlvbnM6IHtcclxuICAgICAgICAgICAganNkb206IHtcclxuICAgICAgICAgICAgICAgIHJlc291cmNlczogJ3VzYWJsZScsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjYWNoZToge1xyXG4gICAgICAgICAgICBkaXI6ICcuLi8uLi9ub2RlX21vZHVsZXMvLnZpdGVzdCcsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBzZXR1cEZpbGVzOiBbJy4vdml0ZXN0LnNldHVwLnRzJ10sXHJcbiAgICB9LFxyXG59KTsiXSwKICAibWFwcGluZ3MiOiAiO0FBQ0EsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxXQUFXO0FBQ2xCLFNBQVMscUJBQXFCO0FBQzlCLFNBQVMsMEJBQTBCO0FBQ25DLFNBQVMsZUFBZTtBQUx4QixJQUFNLG1DQUFtQztBQU96QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUN4QixNQUFNO0FBQUEsRUFDTixVQUFVO0FBQUEsRUFFVixTQUFTO0FBQUEsSUFDTCxNQUFNLEVBQUUsU0FBUyxxQkFBcUIsQ0FBQztBQUFBLElBQ3ZDLGNBQWM7QUFBQSxJQUNkLG1CQUFtQixDQUFDLE1BQU0sQ0FBQztBQUFBLEVBQy9CO0FBQUEsRUFFQSxTQUFTO0FBQUEsSUFDTCxPQUFPLENBQUMsRUFBRSxNQUFNLEtBQUssYUFBYSxRQUFRLGtDQUFXLE9BQU8sRUFBRSxDQUFDO0FBQUEsRUFDbkU7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBT0EsTUFBTTtBQUFBLElBQ0YsTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLElBQ1AsU0FBUztBQUFBLElBQ1QsYUFBYTtBQUFBLElBQ2IsU0FBUyxDQUFDLGtEQUFrRDtBQUFBLElBQzVELE1BQU07QUFBQTtBQUFBLE1BRUYsUUFBUSxDQUFDLG9CQUFvQjtBQUFBLElBQ2pDO0FBQUEsSUFDQSxXQUFXLENBQUMsU0FBUztBQUFBLElBQ3JCLFVBQVU7QUFBQSxNQUNOLFVBQVU7QUFBQSxNQUNWLGtCQUFrQjtBQUFBLElBQ3RCO0FBQUEsSUFDQSxvQkFBb0I7QUFBQSxNQUNoQixPQUFPO0FBQUEsUUFDSCxXQUFXO0FBQUEsTUFDZjtBQUFBLElBQ0o7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNILEtBQUs7QUFBQSxJQUNUO0FBQUEsSUFDQSxZQUFZLENBQUMsbUJBQW1CO0FBQUEsRUFDcEM7QUFDSixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
