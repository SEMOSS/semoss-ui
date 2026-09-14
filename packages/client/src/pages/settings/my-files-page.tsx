import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { observer } from "mobx-react-lite";
import type { PowerPointViewerHandle } from "pptx-react-viewer";
import {
	lazy,
	Suspense,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import {
	InsightProvider,
	runPixel,
	useInsight,
	usePixel,
} from "@semoss/sdk/react";
import {
	FileEditor,
	FileExplorer,
	FileExplorerHeader,
	type FileExplorerMovedItem,
	type FileItem,
	type FileMode,
	NewFileOverlay,
	useFileExplorer,
} from "@semoss/shared";
import {
	Button,
	Muted,
	Spinner,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import {
	decodeBase64Asset,
	encodeBase64Asset,
} from "@/components/workbench/files/file-panel.utility";
import { useSession } from "@/hooks";

const FilePptxViewerContent = lazy(
	() => import("@/components/workbench/files/file-pptx-viewer-content"),
);

const USER_MODE: FileMode = { type: "USER" };

const CenteredSpinner = () => (
	<div className="flex h-full items-center justify-center">
		<Spinner className="size-6" />
	</div>
);

/**
 * PowerPoint editor for a user-space file. The shared FileEditor only offers
 * a download view for office formats, so pptx routes to the same lazy viewer
 * the workbench panels use, fed by the user-scoped base64 asset pixel.
 *
 * Edits stay in browser memory until the explicit save, which serialises the
 * deck back to .pptx bytes and overwrites the file via SaveUserAssetsBase64.
 */
const UserPptxViewer = ({ path, name }: { path: string; name: string }) => {
	const insight = useInsight();
	const viewerRef = useRef<PowerPointViewerHandle>(null);
	const [isDirty, setIsDirty] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const pptx = usePixel<string>(
		`GetUserAssetsBase64(filePath=[${JSON.stringify(path)}]);`,
		{ data: "" },
	);
	const content = useMemo(() => decodeBase64Asset(pptx.data), [pptx.data]);

	const save = useCallback(async () => {
		const handle = viewerRef.current;
		if (!handle || isSaving) return;

		setIsSaving(true);
		try {
			const bytes = await handle.getContent();
			const base64 = encodeBase64Asset(bytes);
			const relativePath = path.replace(/^\/+/, "");
			const response = await runPixel(
				`SaveUserAssetsBase64(filePath=[${JSON.stringify(relativePath)}], content=["<encode>${base64}</encode>"]);`,
				insight.insightId,
			);
			if (response.errors.length > 0) {
				throw new Error(response.errors[0]);
			}
			setIsDirty(false);
			toast.success(`Saved ${name}`);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to save the presentation",
			);
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	}, [insight.insightId, isSaving, name, path]);

	// Ctrl/Cmd+S saves while the editor is open with unsaved changes.
	useEffect(() => {
		if (!isDirty) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if ((event.metaKey || event.ctrlKey) && event.key === "s") {
				event.preventDefault();
				void save();
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [isDirty, save]);

	if (pptx.status === "LOADING" || pptx.status === "INITIAL") {
		return <CenteredSpinner />;
	}

	if (pptx.status === "ERROR" || !content) {
		return (
			<div className="flex h-full items-center justify-center p-4">
				<Muted className="text-destructive" role="alert">
					{pptx.error?.message || "Failed to load the presentation"}
				</Muted>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between gap-2 border-border border-b px-3 py-1.5">
				<Muted className="truncate text-xs" title={path}>
					{isDirty ? "Unsaved changes" : "All changes saved"}
				</Muted>
				<Button
					size="sm"
					onClick={() => void save()}
					disabled={!isDirty || isSaving}
					data-testid="pptx-save-button"
				>
					{isSaving ? <Spinner className="size-4" /> : null}
					{isSaving ? "Saving" : "Save"}
				</Button>
			</div>
			<div className="min-h-0 flex-1">
				<Suspense fallback={<CenteredSpinner />}>
					<FilePptxViewerContent
						ref={viewerRef}
						content={content}
						fileName={name}
						canEdit
						onDirtyChange={setIsDirty}
					/>
				</Suspense>
			</div>
		</div>
	);
};

/**
 * Browse the current user's asset space (BrowseUserAssets and friends) with a
 * preview/editor pane for the selected file.
 */
const MyFilesExplorer = () => {
	const [selected, setSelected] = useState<FileItem | null>(null);
	const [isExplorerCollapsed, setIsExplorerCollapsed] = useState(false);

	const explorer = useFileExplorer({
		mode: USER_MODE,
		onItemSelect: (item) => setSelected(item),
		onItemsMoved: (moved: FileExplorerMovedItem[]) => {
			setSelected((current) => {
				if (!current) {
					return current;
				}
				const match = moved.find((m) => m.oldPath === current.path);
				if (!match) {
					return current;
				}
				return {
					...current,
					path: match.newPath,
					name:
						match.newPath.split("/").filter(Boolean).pop() ??
						current.name,
				};
			});
		},
		onItemsDeleted: (items) => {
			setSelected((current) =>
				current && items.some((item) => item.path === current.path)
					? null
					: current,
			);
		},
	});

	return (
		<div className="flex w-full flex-col gap-4 lg:flex-row">
			{isExplorerCollapsed ? (
				<div className="flex rounded-md border border-border p-1 lg:h-[70vh] lg:w-11 lg:flex-col">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="ghost"
								size="icon-sm"
								aria-label="Expand file explorer"
								onClick={() => setIsExplorerCollapsed(false)}
								data-testid="my-files-expand-explorer"
							>
								<PanelLeftOpen className="size-4" />
							</Button>
						</TooltipTrigger>
						<TooltipContent>Expand file explorer</TooltipContent>
					</Tooltip>
				</div>
			) : (
				<div className="h-[40vh] overflow-auto rounded-md border border-border lg:h-[70vh] lg:w-2/5">
					<FileExplorer
						explorer={explorer}
						header={
							<FileExplorerHeader
								explorer={explorer}
								actions={
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon-sm"
												className="flex-none text-muted-foreground"
												aria-label="Collapse file explorer"
												onClick={() =>
													setIsExplorerCollapsed(true)
												}
												data-testid="my-files-collapse-explorer"
											>
												<PanelLeftClose className="size-4" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											Collapse file explorer
										</TooltipContent>
									</Tooltip>
								}
							/>
						}
						newFileOverlay={NewFileOverlay}
					/>
				</div>
			)}
			<div className="h-[40vh] overflow-hidden rounded-md border border-border lg:h-[70vh] lg:flex-1">
				{selected ? (
					selected.path.split(".").pop()?.toLowerCase() === "pptx" ? (
						<UserPptxViewer
							key={selected.path}
							path={selected.path}
							name={selected.name}
						/>
					) : (
						<FileEditor
							key={selected.path}
							mode={USER_MODE}
							path={selected.path}
						/>
					)
				) : (
					<div className="flex h-full items-center justify-center">
						<Muted>Select a file to preview</Muted>
					</div>
				)}
			</div>
		</div>
	);
};

export const MyFilesPage = observer(() => {
	const insightId = useSession((state) => state.insightID);

	if (!insightId) {
		return (
			<div className="flex h-[40vh] w-full items-center justify-center">
				<Spinner className="size-6" />
			</div>
		);
	}

	return (
		<InsightProvider
			options={{ insightId: insightId }}
			destroyOnUnmount={false}
		>
			<MyFilesExplorer />
		</InsightProvider>
	);
});
