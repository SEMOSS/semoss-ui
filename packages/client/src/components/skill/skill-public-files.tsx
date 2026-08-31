import { useCallback, useMemo, useRef, useState } from "react";
import {
	FileExplorer,
	FileExplorerHeader,
	FileExplorerRefreshAction,
	type FileItem,
	type FileMode,
	useFileExplorer,
} from "@semoss/shared";
import { SkillFileViewer } from "./skill-file-viewer";

/** Skills publish everything a reader should see under this directory. */
const PUBLIC_ROOT_PATH = "/public";

export interface SkillPublicFilesProps {
	/** The skill's project id, for the asset pixels. */
	projectId: string;
	/** The insight the browse and file-read pixels run against. */
	insightId: string | null;
}

/**
 * A skill's published files: a read-only tree over `/public` plus a viewer for
 * the selected file, with `SKILL.md` selected by default.
 *
 * Shared by the standalone skill page and the navbar-free share view, which
 * present the same thing. Must be rendered inside an `InsightProvider` — the
 * explorer's pixels run against the ambient insight.
 */
export const SkillPublicFiles: React.FC<SkillPublicFilesProps> = ({
	projectId,
	insightId,
}) => {
	const [selectedPath, setSelectedPath] = useState<string | null>(null);
	const hasAutoSelectedRef = useRef(false);

	const mode = useMemo<FileMode>(
		() => ({ type: "APP", app: projectId }),
		[projectId],
	);

	/**
	 * Auto-select SKILL.md the first time the /public root finishes loading.
	 *
	 * Memoized because the explorer reports visible items on every tree
	 * change, and only the first report at the root should select anything.
	 *
	 * @param payload - The directory reported on, and its rendered rows.
	 */
	const handleVisibleItemsChange = useCallback(
		(payload: { path: string; items: FileItem[] }) => {
			if (hasAutoSelectedRef.current) {
				return;
			}
			if (payload.path !== PUBLIC_ROOT_PATH) {
				return;
			}

			const skillMd = payload.items.find(
				(item) => item.type !== "directory" && item.name === "SKILL.md",
			);
			if (skillMd) {
				hasAutoSelectedRef.current = true;
				setSelectedPath(skillMd.path);
			}
		},
		[],
	);

	const explorer = useFileExplorer({
		mode: mode,
		initialPath: PUBLIC_ROOT_PATH,
		readOnly: true,
		onItemSelect: (item) => setSelectedPath(item.path),
		onVisibleItemsChange: handleVisibleItemsChange,
	});

	return (
		<>
			<div className="mb-6 max-h-[35vh] overflow-auto rounded-md border border-border">
				<FileExplorer
					explorer={explorer}
					header={
						<FileExplorerHeader
							explorer={explorer}
							actions={
								<FileExplorerRefreshAction
									explorer={explorer}
								/>
							}
						/>
					}
					newFileOverlay={null}
				/>
			</div>
			<SkillFileViewer
				projectId={projectId}
				insightId={insightId}
				path={selectedPath}
			/>
		</>
	);
};
