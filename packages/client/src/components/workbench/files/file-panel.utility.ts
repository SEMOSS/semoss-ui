import type { FileMode } from "@semoss/shared";
import { getFileExplorerAdapter } from "@semoss/shared";

interface FilePanelPathParams {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
	path: string;
}

/** Translate workbench resource params into the shared file API's scope. */
export const getFileMode = ({
	type,
	id,
}: {
	type: "ENGINE" | "PROJECT" | "INSIGHT";
	id: string;
}): FileMode => {
	switch (type) {
		case "PROJECT":
			return { type: "APP", app: id };
		case "ENGINE":
			return { type: "ENGINE", engine: id };
		case "INSIGHT":
			return { type: "INSIGHT", insightId: id };
	}
};

/**
 * The shared adapter for a panel's scope.
 *
 * Panels used to hand-write their own read/save/download Pixels, which meant
 * the reactor-per-scope table existed twice — once here and once in the
 * explorer's adapter — and drifted. The adapter is the one home; these wrappers
 * only translate the panel's `{ type, id }` vocabulary into a `FileMode`.
 *
 * @param params - The panel's resource scope.
 * @return That scope's adapter.
 */
const adapterFor = (params: FilePanelPathParams) =>
	getFileExplorerAdapter(getFileMode(params));

/** Build a scoped asset read pixel. */
export const getFileReadPixel = (
	params: FilePanelPathParams,
	base64 = false,
): string => adapterFor(params).read(params.path, base64);

/** Build a scoped asset save pixel. */
export const getFileSavePixel = (
	params: FilePanelPathParams,
	content: string,
): string => adapterFor(params).save(params.path, content);

/** Build a scoped asset download pixel. */
export const getFileDownloadPixel = (params: FilePanelPathParams): string =>
	adapterFor(params).download(params.path);
