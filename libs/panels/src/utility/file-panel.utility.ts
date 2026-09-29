import { getFileExplorerAdapter } from "@semoss/shared";
import type { FilePanelMode } from "../types/file-panel.types";

/*
 * Panels used to hand-write their own read/save/download Pixels, which meant
 * the reactor-per-scope table existed twice — once here and once in the
 * explorer's adapter — and drifted. The adapter is the one home; these
 * wrappers exist only so a panel does not have to reach for it by name.
 */

/** Build a scoped asset read pixel. */
export const getFileReadPixel = (
	mode: FilePanelMode,
	path: string,
	base64 = false,
): string => getFileExplorerAdapter(mode).read(path, base64);

/** Build a scoped asset save pixel. */
export const getFileSavePixel = (
	mode: FilePanelMode,
	path: string,
	content: string,
	base64 = false,
): string => getFileExplorerAdapter(mode).save(path, content, base64);

/** Build a scoped asset download pixel. */
export const getFileDownloadPixel = (
	mode: FilePanelMode,
	path: string,
): string => getFileExplorerAdapter(mode).download(path);
