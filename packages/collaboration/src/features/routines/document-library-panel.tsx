import { Library } from "lucide-react";
import { createContext, type ReactNode, useContext } from "react";
import { FILE_PANEL_TYPES } from "@semoss/panels";
import type { FileExplorerApi } from "@semoss/shared";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfig,
} from "@semoss/workbench";

/** A dock's landing view can open native previews through its mounted explorer. */
export type RenderDocumentOverview = (
	explorer: FileExplorerApi | undefined,
) => ReactNode;

export const DocumentOverviewContext = createContext<
	RenderDocumentOverview | undefined
>(undefined);

export const DOCUMENT_LIBRARY = "document-library";

function DocumentLibraryPanel() {
	const renderOverview = useContext(DocumentOverviewContext);
	const { value } = useWorkbenchPanel<unknown, FileExplorerApi>(
		FILE_PANEL_TYPES.FILE_EXPLORER,
	);
	return renderOverview?.(value);
}

export const DOCUMENT_LIBRARY_PANEL: WorkbenchPanelConfig = {
	name: "Library",
	icon: Library,
	content: DocumentLibraryPanel,
	canClose: false,
	canDrag: false,
	canRename: false,
	mount: "keepAlive",
};
