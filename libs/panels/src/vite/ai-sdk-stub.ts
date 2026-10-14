/**
 * Build-time stand-in for the "ai" package (Vercel AI SDK), an optional peer
 * of pptx-react-viewer used only by its AI chat panel. The panel is not
 * reachable in our integration, but Rollup still needs these named exports to
 * resolve. If the client ever adopts the real AI SDK, drop the vite alias for
 * /^ai$/ along with this file.
 */
export const isToolUIPart = (): boolean => false;
export const isDynamicToolUIPart = (): boolean => false;
export const getToolOrDynamicToolName = (): string => "";
export const isTextUIPart = (): boolean => false;
