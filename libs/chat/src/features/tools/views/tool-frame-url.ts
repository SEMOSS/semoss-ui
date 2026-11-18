import { isToolViewUri } from "@semoss/shared";
import type { PixelMessageToolCallPart } from "../../../types";
import { isChatToolCall, isFolderToolCall } from "../chat-tools/chat-tool-kind";
import { isAskExecutionMode } from "../mcp/mcp-utils";
import type { ToolAppInfo } from "./use-tool-app-info";

/** A tool call as a message part holds it. */
type ToolCall = PixelMessageToolCallPart["toolCall"];

/**
 * A tool whose UI ships with the web app declares it as
 * `system://<package>/<path>` instead of pointing at a published project portal.
 * These load straight from a sibling package's build output, so there is no
 * project to look up and no `public_home` round trip.
 */
const SYSTEM_APP_URI = /^system:\/\/([a-zA-Z0-9._-]+)(\/.*)?$/;

/**
 * Resolves a `system://` resourceURI to a path relative to this app's own
 * build output.
 *
 * @param resourceURI - The tool's `SMSS_MCP_UI.resourceURI`, if any.
 * @returns The app's path, or null when the URI is not a system app URI.
 */
export const resolveSystemAppUrl = (
	resourceURI: string | undefined,
): string | null => {
	if (!resourceURI) {
		return null;
	}
	const match = SYSTEM_APP_URI.exec(resourceURI);
	return match ? `../../${match[1]}/dist${match[2] ?? "/"}` : null;
};

/** What `ToolsView` draws for a call, as {@link resolveToolFrameUrl} picks it. */
export type ToolFrameRoute =
	/** There is no call yet: nothing. */
	| { readonly kind: "none" }
	/**
	 * A `component://` view the playground draws, in the page. `fallback` is
	 * what shows when the view fails.
	 */
	| { readonly kind: "component"; readonly fallback: "card" | "form" }
	/** A work folder or connector call's `ChatToolCard`. */
	| { readonly kind: "card" }
	/** A provider-side server tool, read-only in the inspector. */
	| { readonly kind: "inspector" }
	/** The app behind the call is still being looked up. */
	| { readonly kind: "loading" }
	/** The app's page, in a frame. */
	| { readonly kind: "frame"; readonly url: string }
	/**
	 * A legacy app's portal page, in a frame only once it is known to be
	 * published; the default form otherwise.
	 */
	| { readonly kind: "portal"; readonly url: string }
	/** The default form, or a request for the user's input. */
	| { readonly kind: "form" };

/** What {@link resolveToolFrameUrl} reads. */
export interface ToolFrameInput {
	/** The call, or undefined while the room does not have it. */
	readonly tool: ToolCall | undefined;
	/** Id of the app (project or engine) that owns the tool, or empty for none. */
	readonly app: string;
	/** Whether the playground draws the call's `component://` view. */
	readonly hasComponentView: boolean;
	/** The call's result once it succeeded. */
	readonly toolResponse: string | undefined;
	/** The app's details, from `useToolAppInfo`. */
	readonly appInfo: ToolAppInfo;
	/** Where the platform's low code apps are served (`ChatConfig.platformUrl`). */
	readonly platformUrl: string;
	/** The server's module path (`Env.MODULE`). */
	readonly module: string;
	/**
	 * The origin an app's pages are framed from (`ChatConfig.toolFrameOrigin`),
	 * put before a module path that has none.
	 */
	readonly toolFrameOrigin?: string;
}

/**
 * Works out what `ToolsView` draws for a call, in order: a `component://`
 * view the playground draws, except for work folder calls; folder and
 * connector calls' card; server tools' inspector; then the app's page (a
 * `system://` app, a low code app, or a portal page) or the default form. A
 * `component://` URI is never turned into a page URL.
 *
 * @param input - The call and what is known about its app.
 * @returns What to draw.
 */
export const resolveToolFrameUrl = ({
	tool,
	app,
	hasComponentView,
	toolResponse,
	appInfo,
	platformUrl,
	module,
	toolFrameOrigin,
}: ToolFrameInput): ToolFrameRoute => {
	if (!tool) {
		return { kind: "none" };
	}
	// work folder calls keep their card, even when they name a view
	if (hasComponentView && !isFolderToolCall(tool)) {
		return {
			kind: "component",
			fallback: isChatToolCall(tool) ? "card" : "form",
		};
	}
	// the folder tools run in the browser, and neither they nor connector
	// calls have an MCP project to fetch a schema or a UI from
	if (isChatToolCall(tool)) {
		return { kind: "card" };
	}
	if (tool.server_tool) {
		return { kind: "inspector" };
	}

	const resourceURI = tool._meta?.SMSS_MCP_UI?.resourceURI;
	// a view the playground does not draw is never a page
	if (isToolViewUri(resourceURI)) {
		return { kind: "form" };
	}
	// an auto call that has not finished shows the form
	if (!isAskExecutionMode(tool._meta?.SMSS_MCP_EXECUTION) && !toolResponse) {
		return { kind: "form" };
	}
	// resolved from the URI alone: no app is looked up for it
	const systemAppUrl = resolveSystemAppUrl(resourceURI);
	if (systemAppUrl) {
		return { kind: "frame", url: systemAppUrl };
	}
	// no app behind the call (such as the subagent control tools), so there
	// is nothing to look up
	if (!app) {
		return { kind: "form" };
	}
	if (appInfo.status === "INITIAL" || appInfo.status === "LOADING") {
		return { kind: "loading" };
	}
	if (appInfo.status === "ERROR") {
		return { kind: "form" };
	}
	// an app's pages, from the tool frame origin when the host has one
	const pagesUrl =
		toolFrameOrigin && module.startsWith("/")
			? `${toolFrameOrigin}${module}/public_home/${app}/portals`
			: `${module}/public_home/${app}/portals`;
	// legacy tools declare no UI: a low code app opens in the platform, any
	// other app shows its portal, when it has one
	if (!tool._meta?.SMSS_MCP_UI) {
		if (appInfo.projectType === "BLOCKS") {
			return { kind: "frame", url: `${platformUrl}/#/s/${app}/` };
		}
		return { kind: "portal", url: `${pagesUrl}/` };
	}
	// no UI, or a malformed system URI, which is no public_home path
	if (!resourceURI || resourceURI.startsWith("system://")) {
		return { kind: "form" };
	}
	if (appInfo.projectType === "BLOCKS") {
		return {
			kind: "frame",
			url: `${platformUrl}/#/s/${app}${resourceURI}`,
		};
	}
	return { kind: "frame", url: `${pagesUrl}${resourceURI}` };
};
