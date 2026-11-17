import { FilesIcon, FolderPlusIcon } from "lucide-react";
import { useState } from "react";
import {
	FILE_PANEL_COMPONENTS,
	FILE_PANEL_TYPES,
	useAccess,
} from "@semoss/panels";
import { useInsight, useInsightPixel } from "@semoss/sdk/react";
import { type FileMode, getFileExplorerAdapter } from "@semoss/shared";
import { Button, Muted, Small, Spinner, toast } from "@semoss/ui/next";
import {
	useWorkbenchPanel,
	type WorkbenchPanelConfigAny,
	WorkbenchPanelError,
	WorkbenchPanelLoading,
	type WorkbenchPanelProps,
} from "@semoss/workbench";

/**
 * The folder of an agent's project that a chat reads the agent's own files
 * from. It is the project's public assets folder, the one part of a project
 * that someone with only view access may read, so the server offers a run
 * nothing else.
 */
export const AGENT_FILES_PATH = "/public";

/** The folder's name as the listing of the project's top folder gives it. */
const AGENT_FILES_FOLDER = AGENT_FILES_PATH.slice(1);

/** What an Agent Files panel is opened with; the file explorer reads the same. */
export interface AgentFilesParams {
	/** The agent's project. */
	mode: Extract<FileMode, { type: "APP" }>;
	/** The folder the explorer is kept to: {@link AGENT_FILES_PATH}. */
	rootPath: string;
}

const FILE_EXPLORER = FILE_PANEL_COMPONENTS[FILE_PANEL_TYPES.FILE_EXPLORER];
const FileExplorer = FILE_EXPLORER.content;

/**
 * The agent's own files: the shared file explorer, kept to the folder a chat
 * reads them from, so nothing can be uploaded where the agent would not see
 * it. The explorer needs that folder to exist, so it mounts only once it does;
 * until then someone who can edit the agent is offered to add it, and anyone
 * else is told there are no files.
 */
const AgentFilesPanel = ({ id }: WorkbenchPanelProps) => {
	const { config } = useWorkbenchPanel<AgentFilesParams>(id);
	const { actions } = useInsight();
	const access = useAccess("PROJECT", config.mode.app);
	const adapter = getFileExplorerAdapter(config.mode);
	// the project's top folder rather than the files folder itself, so that a
	// folder that is not there yet is an answer and not a failed read
	const topFolder = useInsightPixel<unknown[]>(adapter.browse("/"), {
		data: [],
	});
	const [isAdding, setIsAdding] = useState(false);

	const handleAddFolder = async () => {
		setIsAdding(true);
		try {
			await actions.run(adapter.createDirectory(AGENT_FILES_PATH));
			topFolder.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "The agent files folder could not be added",
			);
		} finally {
			setIsAdding(false);
		}
	};

	if (access.status === "error") {
		return (
			<WorkbenchPanelError
				message={access.error}
				onRetry={() => void access.refresh()}
			/>
		);
	}

	if (topFolder.status === "ERROR") {
		return (
			<WorkbenchPanelError
				message={topFolder.error?.message ?? ""}
				onRetry={topFolder.refresh}
			/>
		);
	}

	if (access.status === "loading" || topFolder.status !== "SUCCESS") {
		return <WorkbenchPanelLoading label="Loading agent files" />;
	}

	const hasFolder = adapter
		.mapEntries(topFolder.data, "/")
		.some(
			(item) =>
				item.type === "directory" && item.name === AGENT_FILES_FOLDER,
		);

	if (!hasFolder) {
		return (
			<div className="flex size-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
				<Small>No agent files yet</Small>
				<Muted className="font-normal">
					{access.readOnly
						? "This agent has no files of its own."
						: "Files added here can be read by the agent in every chat, and by anyone who can use the agent."}
				</Muted>
				{access.readOnly ? null : (
					<Button
						size="sm"
						disabled={isAdding}
						onClick={handleAddFolder}
					>
						{isAdding ? (
							<Spinner className="size-4" />
						) : (
							<FolderPlusIcon aria-hidden />
						)}
						{isAdding ? "Adding..." : "Add Files"}
					</Button>
				)}
			</div>
		);
	}

	return (
		<div className="flex size-full flex-col bg-background">
			<Muted className="block border-b px-3 py-2 font-normal">
				The agent can read these files in every chat. Anyone who can use
				the agent can read them too.
			</Muted>
			<div className="relative min-h-0 flex-1">
				<FileExplorer id={id} />
			</div>
		</div>
	);
};

/**
 * Blueprint for the agent's own files: the shared file explorer under its own
 * type, the only file panel the agent workbench has.
 */
export const AGENT_FILES_PANEL: WorkbenchPanelConfigAny = {
	...FILE_EXPLORER,
	name: "Agent Files",
	helpText: "Files the agent can read in every chat",
	icon: ({ className }) => <FilesIcon className={className} />,
	content: AgentFilesPanel,
};
