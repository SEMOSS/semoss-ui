import postcss from "postcss";
import type { Alias, Plugin } from "vite";
import { resolve } from "node:path";

const PPTX_VIEWER_SCOPE = ".pptx-viewer-scope";

/**
 * Confine pptx-react-viewer's stylesheet to its mount point. Its Tailwind
 * build emits the same utility class names and layer names as the app's own
 * Tailwind build (e.g. `.border-border`), compiled against `--color-*` tokens
 * it defines on `:root` — whichever stylesheet loads last would restyle the
 * whole document. Prefixing every selector pins its rules (and its tokens,
 * whose `:root`/`html` blocks become the scope element itself) to the viewer
 * subtree, and the +1 specificity lets them beat the app's same-named
 * utilities inside it.
 */
const scopePptxViewerCss = (code: string): string => {
	const sheet = postcss.parse(code);
	sheet.walkRules((rule) => {
		const parent = rule.parent;
		if (
			parent?.type === "atrule" &&
			/keyframes/i.test((parent as postcss.AtRule).name)
		) {
			return;
		}
		rule.selectors = rule.selectors.map((selector) => {
			const trimmed = selector.trim();
			const rehomed = trimmed.replace(
				/^(:root|:host|html)(?![\w-])/,
				PPTX_VIEWER_SCOPE,
			);
			if (rehomed !== trimmed) {
				return rehomed;
			}
			return `${PPTX_VIEWER_SCOPE} ${trimmed}`;
		});
	});
	return sheet.toString();
};

/**
 * Scope the pptx viewer's stylesheet. See `scopePptxViewerCss` — the scope
 * class is applied by `file-pptx-viewer-content.tsx` around the viewer mount.
 *
 * Every host that mounts the file panels needs this; it lives with them rather
 * than being copied into each app's vite config.
 */
export const scopePptxViewerCssPlugin: Plugin = {
	name: "scope-pptx-viewer-css",
	transform(code: string, id: string) {
		if (
			!id.includes("pptx-react-viewer") ||
			!id.split("?")[0].endsWith(".css")
		) {
			return null;
		}
		return { code: scopePptxViewerCss(code), map: null };
	},
};

/**
 * Stub the "ai" package, an optional peer of pptx-react-viewer used only by its
 * AI chat panel. The panel is unreachable here, but the bundler still has to
 * resolve its named imports — without this the build fails outright.
 *
 * Drop this alias (and `ai-sdk-stub.ts`) if a host ever adopts the real SDK.
 */
export const aiSdkStubAlias: Alias = {
	find: /^ai$/,
	replacement: resolve(import.meta.dirname, "./ai-sdk-stub.ts"),
};
