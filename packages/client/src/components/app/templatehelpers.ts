import type { MonolithStore } from "@/stores";
import type { AppMetadata } from "../app";

export function parseTemplateJson(
	raw: string | Record<string, unknown>,
): Record<string, unknown> {
	if (typeof raw === "object" && raw !== null) {
		return raw;
	}

	if (typeof raw !== "string") {
		throw new Error("Template must be a JSON object or JSON string.");
	}

	let txt = raw.trim();

	if (txt.startsWith('"') && txt.endsWith('"')) {
		txt = txt.slice(1, -1);
		txt = txt.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
	}

	try {
		const parsed = JSON.parse(txt);
		if (typeof parsed !== "object" || parsed === null) {
			throw new Error("Parsed template is not an object.");
		}
		return parsed as Record<string, unknown>;
	} catch (err) {
		const msg =
			err instanceof Error ? err.message : "Unknown JSON parse error";
		throw new Error(`Failed to parse template JSON: ${msg}`);
	}
}

export function normalizeTemplateState(
	state: Record<string, unknown>,
): Record<string, unknown> {
	const normalized: Record<string, unknown> = { ...state };

	if (!normalized.version) {
		normalized.version = "1.0.0-alpha.17";
	}

	if (
		!normalized.executionOrder ||
		!Array.isArray(normalized.executionOrder)
	) {
		normalized.executionOrder = [];
	}

	if (!normalized.blocks || typeof normalized.blocks !== "object") {
		normalized.blocks = {};
	}

	if (!normalized.variables || typeof normalized.variables !== "object") {
		normalized.variables = {};
	}

	if (!normalized.queries || typeof normalized.queries !== "object") {
		normalized.queries = {};
	}

	return normalized;
}


function escapeDoubleQuotesForPixel(s: string): string {
	return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export async function createAppFromTemplate(
	cleanJson: string | Record<string, unknown>,
	monolithStore: MonolithStore,
	options: { title?: string; description?: string } = {},
): Promise<string> {
	const parsedState = parseTemplateJson(cleanJson);

	const normalizedState = normalizeTemplateState(parsedState);

	const titleFallback =
		typeof normalizedState.title === "string" && normalizedState.title
			? (normalizedState.title as string)
			: "New App";
	const title =
		options.title && options.title.trim() ? options.title : titleFallback;

	const encodedState = JSON.stringify(normalizedState);
	const pixel = `CreateAppFromBlocks ( project = [ "${escapeDoubleQuotesForPixel(
		title,
	)}" ] , json =["<encode>${encodedState}</encode>"]  ) ;`;

	const createResult = await monolithStore.runQuery<[AppMetadata]>(pixel);

	const { errors, pixelReturn } = createResult;

	if (errors && errors.length > 0) {
		throw new Error(`CreateAppFromBlocks failed: ${errors.join(", ")}`);
	}

	if (!pixelReturn || pixelReturn.length === 0) {
		throw new Error("CreateAppFromBlocks returned empty response.");
	}

	const firstReturn = pixelReturn[0];

	if (!firstReturn || !firstReturn.output) {
		throw new Error(
			"CreateAppFromBlocks returned unexpected response shape.",
		);
	}

	const createdApp = firstReturn.output as AppMetadata;
	const appId = createdApp.project_id;

	if (!appId) {
		throw new Error("CreateAppFromBlocks did not return a project_id.");
	}

	if (options.description) {
		const metaPixel = `SetProjectMetadata(project=["${appId}"], meta=[${JSON.stringify(
			{
				description: options.description,
			},
		)}])`;
		const metaResult = await monolithStore.runQuery(metaPixel);

		if (metaResult.errors && metaResult.errors.length > 0) {
			throw new Error(
				`App created (${appId}) but setting metadata failed: ${metaResult.errors.join(
					", ",
				)}`,
			);
		}
	}

	return appId;
}
