# VS Code Extension - Axios Removal & Vite Configuration

## Summary
Successfully removed axios package from the VS Code extension and replaced all HTTP calls with node-fetch (which was already a dependency). Also enhanced the Vite configuration for the chatbot React webview.

## Changes Made

### 1. Replaced axios with node-fetch in source files

#### `src/utils/deploy.js`
- **Import**: Changed `const axios = require("axios")` to `const fetch = require("node-fetch")`
- **7 axios.post() calls** replaced with fetch equivalents
- **All `response.data` references** updated to `response` (fetch returns JSON directly after `.json()`)
- Updated comments from "axios errors" to "fetch errors"

#### `src/utils/createApp.js`
- **Import**: Changed `const axios = require("axios")` to `const fetch = require("node-fetch")`
- **3 axios.post() calls** replaced with fetch equivalents
- **Removed axios-specific error handling**: Eliminated `err.isAxiosError` check and related logic
- **All `response.data` references** updated to `response`

#### `src/utils/githubAssets.js`
- **Import**: Changed `const axios = require("axios")` to `const fetch = require("node-fetch")`
- **1 axios.get() call** replaced with fetch
- **1 axios() streaming call** replaced with fetch streaming using `response.body.pipe()`
- **All `response.data` references** updated to `response`

### 2. Updated package configuration

#### `package.json`
- **Removed dependency**: `"axios": "^1.3.4"`
- Kept `"node-fetch": "^3.3.2"` (already present)

#### `.vscodeignore`
- **Removed**: `!node_modules/axios/**` line (no longer needed for bundling)

### 3. Enhanced Vite configuration

#### `src/webviews/chatbot-react/vite.config.js`
Enhanced with the following improvements:
- **Source maps**: Added `sourcemap: true` for easier debugging
- **Clean builds**: Added `emptyOutDir: true`
- **Code splitting**: Disabled with `manualChunks: undefined` (better for webviews)
- **Modern target**: Updated from `es2015` to `es2020`
- **CSS optimization**: Added `cssCodeSplit: false` for single CSS file
- **Path aliases**: Added `@` alias pointing to `./src`
- **Dependencies optimization**: Configured `optimizeDeps` with include/exclude
- **Dev source maps**: Added `css.devSourcemap: true`
- **Server config**: Added `strictPort: true`

## Benefits

### Performance
- **node-fetch** is lighter than axios and more aligned with modern Fetch API standards
- No unnecessary axios dependencies in the bundle
- Better tree-shaking with node-fetch

### Maintainability
- Consistent with modern JavaScript Fetch API
- Simpler error handling (no axios-specific error types)
- One less dependency to maintain and update

### Build
- Smaller bundle size for the VS Code extension
- Improved Vite configuration for faster builds and better DX

## Testing Recommendations

1. **Test all HTTP operations**:
   - Project creation
   - Asset deployment
   - File uploads (FormData)
   - GitHub repository access (both public and private)

2. **Test error scenarios**:
   - Network errors
   - API failures
   - Invalid responses

3. **Test the chatbot webview**:
   - Build: `cd src/webviews/chatbot-react && npm run build`
   - Dev: `cd src/webviews/chatbot-react && npm run dev`

## Migration Notes

### Key Differences: axios vs node-fetch

1. **Response structure**:
   - axios: `response.data` contains the JSON
   - fetch: Must call `response.json()` to get JSON, then access directly

2. **Headers**:
   - axios: Pass headers as `{ headers }` in config
   - fetch: Pass headers directly in config object

3. **Request body**:
   - axios: Pass as second parameter
   - fetch: Pass as `body` in config object

4. **Streaming**:
   - axios: `response.data.pipe()`
   - fetch: `response.body.pipe()`

5. **Error handling**:
   - axios: Has `err.isAxiosError`, `err.response`, `err.request`
   - fetch: Standard Error objects, check `response.ok` or status code

## Files Modified

1. `src/utils/deploy.js`
2. `src/utils/createApp.js`
3. `src/utils/githubAssets.js`
4. `package.json`
5. `.vscodeignore`
6. `src/webviews/chatbot-react/vite.config.js`

## Installation

After pulling these changes, run:
```bash
pnpm install
```

This will remove axios and update the lock file.
