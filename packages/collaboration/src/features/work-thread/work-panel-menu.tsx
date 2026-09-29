import {
	ChevronDown,
	Download,
	FilePlus2,
	FolderOpen,
	FolderPlus,
	RefreshCw,
	Save,
	Upload,
} from "lucide-react";
import { type ComponentProps, useId, useRef, useState } from "react";
import {
	FILE_PANEL_EVENTS,
	type FilePanelMode,
	getFilePanelScope,
} from "@semoss/panels";
import { NewFileOverlay } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Small,
} from "@semoss/ui/next";
import { useWorkbench } from "@semoss/workbench";
import { useToolWorkbench } from "@/features/tools/tool-workbench.context";
import { useWorkFileActions } from "./use-work-file-actions";
import { useWorkPanelActions } from "./use-work-panel-actions";
import { WorkViewMenu } from "./work-view-menu";

interface CreationRequest
	extends Pick<ComponentProps<typeof NewFileOverlay>, "path" | "action"> {
	mode: FilePanelMode;
}
interface RefreshRequest {
	id: string;
	name: string;
	path?: string;
	refresh: () => void;
}

/** Thread file actions and panel navigation, kept reachable when the conversation is concealed. */
export function WorkPanelMenu() {
	const panelActions = useWorkPanelActions();
	const workbench = useToolWorkbench();
	const file = useWorkFileActions();
	const layoutActions = useWorkbench((state) => state.layout.actions);
	const emit = useWorkbench((state) => state.events.actions.emit);
	const [isOpen, setIsOpen] = useState(false);
	const [creation, setCreation] = useState<CreationRequest | null>(null);
	const [refreshRequest, setRefreshRequest] = useState<RefreshRequest | null>(
		null,
	);
	const trigger = useRef<HTMLButtonElement>(null);
	const isOpeningOverlay = useRef(false);
	const descriptionId = useId();
	const browse = panelActions.find((action) => action.id === "files");
	const returnFocus = () =>
		requestAnimationFrame(() => trigger.current?.focus());
	const openCreation = (action: CreationRequest["action"]) => {
		if (!file.isReady) return;
		isOpeningOverlay.current = true;
		setCreation({ action, mode: file.mode, path: file.destination });
	};
	const closeCreation = (success: boolean) => {
		if (success && creation)
			emit(FILE_PANEL_EVENTS.FILES_CHANGED, {
				scope: getFilePanelScope(creation.mode),
			});
		setCreation(null);
		returnFocus();
	};
	const closeRefresh = () => {
		setRefreshRequest(null);
		returnFocus();
	};
	return (
		<>
			<DropdownMenu
				open={isOpen && workbench.isOpen}
				onOpenChange={setIsOpen}
			>
				<DropdownMenuTrigger asChild>
					<Button
						ref={trigger}
						type="button"
						variant="ghost"
						size="sm"
						className="h-11 gap-1 px-2 text-xs md:h-6"
					>
						File{" "}
						<ChevronDown aria-hidden="true" className="size-3" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent
					align="start"
					className="w-56"
					onCloseAutoFocus={(event) => {
						if (isOpeningOverlay.current) event.preventDefault();
						isOpeningOverlay.current = false;
					}}
				>
					<DropdownMenuGroup>
						<DropdownMenuLabel className="py-1 text-muted-foreground text-xs">
							Browse and create
						</DropdownMenuLabel>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={browse?.disabled || !file.isReady}
							onSelect={browse?.onSelect}
						>
							<FolderOpen aria-hidden="true" />
							Browse files…
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.isReady}
							onSelect={() => openCreation("add_file")}
						>
							<FilePlus2 aria-hidden="true" />
							New file…
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.isReady}
							onSelect={() => openCreation("add_directory")}
						>
							<FolderPlus aria-hidden="true" />
							New folder…
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.isReady}
							onSelect={() => openCreation("upload")}
						>
							<Upload aria-hidden="true" />
							Upload files…
						</DropdownMenuItem>
					</DropdownMenuGroup>
					<DropdownMenuSeparator />
					<DropdownMenuGroup aria-describedby={descriptionId}>
						<DropdownMenuLabel className="py-1 text-muted-foreground text-xs">
							Current file
						</DropdownMenuLabel>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.canSave}
							onSelect={file.save}
							aria-describedby={descriptionId}
						>
							<Save aria-hidden="true" />
							Save file
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.canDownload}
							onSelect={file.download}
							aria-describedby={descriptionId}
						>
							<Download aria-hidden="true" />
							{file.isDirty
								? "Download saved version"
								: "Download file"}
						</DropdownMenuItem>
						<DropdownMenuItem
							className="min-h-8 py-1 text-xs md:min-h-7"
							disabled={!file.canRefresh}
							aria-describedby={descriptionId}
							onSelect={() => {
								if (file.isDirty) {
									isOpeningOverlay.current = true;
									setRefreshRequest({
										id: file.selectedId,
										name: file.name,
										path: file.path,
										refresh: file.refresh,
									});
								} else file.refresh();
							}}
						>
							<RefreshCw aria-hidden="true" />
							{file.refreshLabel}
						</DropdownMenuItem>
						<Small
							id={descriptionId}
							className="block px-2 py-1 text-muted-foreground text-xs"
						>
							{file.description}
						</Small>
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
			<WorkViewMenu />
			{creation && workbench.isOpen && (
				<NewFileOverlay {...creation} open onClose={closeCreation} />
			)}
			<Dialog
				open={Boolean(refreshRequest && workbench.isOpen)}
				onOpenChange={(open) => {
					if (!open) closeRefresh();
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Discard edits and refresh?</DialogTitle>
						<DialogDescription>
							Your unsaved changes to {refreshRequest?.name} will
							be replaced with the saved file.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={closeRefresh}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (
									refreshRequest &&
									layoutActions.findPanels(
										(panel) =>
											panel.id === refreshRequest.id &&
											panel.config?.path ===
												refreshRequest.path,
									).length
								)
									refreshRequest.refresh();
								closeRefresh();
							}}
						>
							Discard and refresh
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
