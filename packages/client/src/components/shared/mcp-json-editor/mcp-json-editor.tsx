import { AlertTriangle, RefreshCw, Save } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Badge,
	Button,
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
	Spinner,
	Tabs,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { AddToolDialog } from "./add-tool-dialog";
import { ConfirmDialog } from "./confirm-dialog";
import {
	findToolNameIssues,
	formatMetaKey,
	normalizeTool,
	parseMCPFile,
	titleForPath,
	toolSearchText,
} from "./mcp-json-utils";
import { MCPRawJsonEditor } from "./mcp-raw-json-editor";
import { MCPToolDetail } from "./mcp-tool-detail";
import { MCPToolList } from "./mcp-tool-list";
import { MetadataHelpDialog } from "./metadata-help-dialog";
import type { MCPEditorMode, MCPJsonData, MCPTool } from "./types";
import { useMCPEditor } from "./use-mcp-editor";

const useDebounce = <T,>(value: T, delay = 300): T => {
	const [debounced, setDebounced] = useState(value);

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(timer);
	}, [value, delay]);

	return debounced;
};

export interface MCPJsonEditorProps {
	dataMap: {
		initialData: MCPJsonData;
		onSave?: (data: MCPJsonData, path: string) => void;
		path: string;
		name: string;

		/**
		 * Raw file text as it was read from the server. Supplying it lets the
		 * editor preserve top-level keys it does not model and populate the
		 * JSON surface with the file exactly as written.
		 */
		rawContent?: string;

		/**
		 * Parse failure from loading `rawContent`. When set, the form surface
		 * is disabled and saving is blocked so a malformed file cannot be
		 * silently replaced with an empty one.
		 */
		loadError?: string;

		/** Re-reads the file. Resolves to the raw text, or null if the read failed. */
		onRefresh?: () => Promise<string | null>;
	};

	/** View-only: no save, no structural edits, no field edits. Defaults to false. */
	readOnly?: boolean;
}

/**
 * Editor for a `py_mcp.json` / `pixel_mcp.json` tool definition file.
 *
 * Tools are listed in a rail on the left and edited in full on the right, so
 * adding, duplicating, deleting, and renaming are all one click away and the
 * details of a tool are visible without unfolding nested sections. A raw JSON
 * surface sits alongside the form for anything the form does not model.
 */
export const MCPJsonEditor = ({
	dataMap,
	readOnly = false,
}: MCPJsonEditorProps) => {
	const { initialData, onSave, path, rawContent, loadError, onRefresh } =
		dataMap;

	const initialExtras = useMemo(
		() => (rawContent ? parseMCPFile(rawContent).extras : {}),
		[rawContent],
	);

	const editor = useMCPEditor(initialData, path, initialExtras);

	const [mode, setMode] = useState<MCPEditorMode>(
		loadError ? "json" : "form",
	);
	const [fileError, setFileError] = useState<string | undefined>(loadError);
	const [rawText, setRawText] = useState(
		() => rawContent ?? JSON.stringify(initialData, null, 2),
	);
	const [rawError, setRawError] = useState<string | undefined>(loadError);
	const [searchQuery, setSearchQuery] = useState("");
	const [addOpen, setAddOpen] = useState(false);
	const [refreshConfirmOpen, setRefreshConfirmOpen] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	/**
	 * Serialized tools as of the last save or load. Compared by content rather
	 * than by id because a reload or a raw-JSON edit mints new ids.
	 */
	const [savedBaseline, setSavedBaseline] = useState<Set<string>>(() =>
		baselineOf(editor.tools.map((entry) => entry.tool)),
	);

	const debouncedSearch = useDebounce(searchQuery);
	const isBlocked = Boolean(fileError) || Boolean(rawError);
	const canSave = !readOnly && editor.hasChanges && !isBlocked;

	/**
	 * Audited on every render rather than only at the point of edit, because
	 * the raw JSON surface, a git-committed file, and a remote MCP server can
	 * all introduce a name the form editor never had a chance to reject.
	 */
	const nameIssues = useMemo(
		() => findToolNameIssues(editor.savedTools),
		[editor.savedTools],
	);

	const filteredTools = useMemo(() => {
		const query = debouncedSearch.trim().toLowerCase();
		if (!query) return editor.tools;
		return editor.tools.filter((entry) =>
			toolSearchText(entry.tool).includes(query),
		);
	}, [editor.tools, debouncedSearch]);

	/** Ids whose tool differs from what was last written to disk. */
	const dirtyIds = useMemo(() => {
		const dirty = new Set<string>();
		for (const entry of editor.tools) {
			if (!savedBaseline.has(JSON.stringify(entry.tool))) {
				dirty.add(entry.id);
			}
		}
		return dirty;
	}, [editor.tools, savedBaseline]);

	const otherToolNames = useMemo(
		() =>
			editor.tools
				.filter((entry) => entry.id !== editor.selectedId)
				.map((entry) => entry.tool.name),
		[editor.tools, editor.selectedId],
	);

	const handleSave = useCallback(() => {
		if (!canSave) return;
		const fileData = editor.buildFileData();
		onSave?.(fileData, path);
		editor.markSaved();
		setSavedBaseline(baselineOf(fileData.tools));
	}, [canSave, editor, onSave, path]);

	// Cmd/Ctrl+S saves from either surface.
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "s") {
				e.preventDefault();
				handleSave();
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [handleSave]);

	// Unsaved edits live only in this component, so leaving the page loses them.
	useEffect(() => {
		if (!editor.hasChanges) return;
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handleBeforeUnload);
		return () =>
			window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [editor.hasChanges]);

	/**
	 * Every valid keystroke on the raw surface is adopted into the form state,
	 * so the two views never disagree and Save behaves the same from either.
	 */
	const handleRawChange = useCallback(
		(text: string) => {
			setRawText(text);

			const { data, extras, error } = parseMCPFile(text);
			setRawError(error);
			if (error) return;

			setFileError(undefined);
			editor.adoptFrom(data, extras, Math.max(editor.selectedIndex, 0));
		},
		[editor],
	);

	const handleModeChange = useCallback(
		(next: string) => {
			if (next === mode) return;

			if (next === "json") {
				setRawText(JSON.stringify(editor.buildFileData(), null, 2));
				setRawError(undefined);
				setMode("json");
				return;
			}

			if (rawError || fileError) {
				toast.error("Fix the JSON errors before using the form editor");
				return;
			}
			setMode("form");
		},
		[mode, rawError, fileError, editor],
	);

	const handleFormatRaw = useCallback(() => {
		try {
			setRawText(JSON.stringify(JSON.parse(rawText), null, 2));
		} catch {
			// the error banner is already showing; nothing to format
		}
	}, [rawText]);

	const runRefresh = useCallback(async () => {
		if (!onRefresh) return;

		setIsRefreshing(true);
		try {
			const content = await onRefresh();
			if (content === null) {
				toast.error("Could not reload the file");
				return;
			}

			const { data, extras, error } = parseMCPFile(content);
			setRawText(content);

			if (error) {
				setFileError(error);
				setRawError(error);
				setMode("json");
				toast.error("Reloaded, but the file is not valid JSON");
				return;
			}

			setFileError(undefined);
			setRawError(undefined);
			editor.resetFrom(data, extras);
			setSavedBaseline(baselineOf(data.tools));
			setMode("form");
			toast.success("Reloaded from disk");
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Could not reload the file",
			);
		} finally {
			setIsRefreshing(false);
		}
	}, [onRefresh, editor]);

	const handleRefreshClick = useCallback(() => {
		if (editor.hasChanges) {
			setRefreshConfirmOpen(true);
			return;
		}
		void runRefresh();
	}, [editor.hasChanges, runRefresh]);

	const metaEntries = Object.entries(editor.fileMeta ?? {});

	return (
		<div className="flex h-full min-h-0 w-full flex-col bg-background">
			<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-2">
				<div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
					<h2 className="truncate font-semibold text-base text-foreground">
						{titleForPath(path)}
					</h2>
					<Badge variant="outline" className="text-xs">
						{editor.savedTools.length}{" "}
						{editor.savedTools.length === 1 ? "tool" : "tools"}
					</Badge>
					{editor.deletedCount > 0 && (
						<Badge variant="destructive" className="text-xs">
							{editor.deletedCount} pending deletion
						</Badge>
					)}
					{editor.hasChanges && (
						<Badge variant="secondary" className="text-xs">
							Unsaved changes
						</Badge>
					)}
					{metaEntries.map(([key, value]) => (
						<span
							key={key}
							className="whitespace-nowrap text-muted-foreground text-xs"
						>
							{formatMetaKey(key)}:{" "}
							<span className="font-medium text-foreground">
								{String(value)}
							</span>
						</span>
					))}
				</div>

				<div className="flex flex-shrink-0 items-center gap-2">
					<Tabs value={mode} onValueChange={handleModeChange}>
						<TabsList>
							<TabsTrigger value="form" disabled={isBlocked}>
								Form
							</TabsTrigger>
							<TabsTrigger value="json">JSON</TabsTrigger>
						</TabsList>
					</Tabs>

					<MetadataHelpDialog />

					{onRefresh && (
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant="outline"
									size="icon-sm"
									onClick={handleRefreshClick}
									disabled={isRefreshing}
									aria-label="Reload from disk"
								>
									{isRefreshing ? (
										<Spinner className="size-3.5" />
									) : (
										<RefreshCw size={14} />
									)}
								</Button>
							</TooltipTrigger>
							<TooltipContent>Reload from disk</TooltipContent>
						</Tooltip>
					)}

					{!readOnly && (
						<Button
							size="sm"
							onClick={handleSave}
							disabled={!canSave}
							title="Ctrl+S / Cmd+S"
							className="flex items-center gap-1.5"
						>
							<Save size={14} />
							<span>Save</span>
						</Button>
					)}
				</div>
			</div>

			{nameIssues.length > 0 && (
				<div className="flex items-start gap-2 border-destructive/40 border-b bg-destructive/10 px-4 py-2 text-destructive text-xs">
					<AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
					<div className="flex flex-col gap-0.5">
						<span className="font-medium">
							{nameIssues.length === 1
								? "1 tool name will break this room's chat requests."
								: `${nameIssues.length} tool names will break this room's chat requests.`}{" "}
							The model provider rejects the whole request, not
							just the offending tool.
						</span>
						{nameIssues.slice(0, 4).map((issue) => (
							<span key={`${issue.name}-${issue.reason}`}>
								<code className="font-mono">{issue.name}</code>{" "}
								{issue.reason}
							</span>
						))}
						{nameIssues.length > 4 && (
							<span>and {nameIssues.length - 4} more</span>
						)}
					</div>
				</div>
			)}

			<div className="min-h-0 flex-1">
				{mode === "json" ? (
					<MCPRawJsonEditor
						value={rawText}
						error={rawError}
						loadError={fileError}
						readOnly={readOnly}
						onChange={handleRawChange}
						onFormat={handleFormatRaw}
					/>
				) : (
					<ResizablePanelGroup direction="horizontal">
						<ResizablePanel
							defaultSize={26}
							minSize={18}
							maxSize={45}
						>
							<MCPToolList
								tools={filteredTools}
								totalCount={editor.tools.length}
								selectedId={editor.selectedId}
								dirtyIds={dirtyIds}
								searchQuery={searchQuery}
								readOnly={readOnly}
								onSelect={editor.setSelectedId}
								onSearchChange={setSearchQuery}
								onAddTool={() => setAddOpen(true)}
								onRestore={editor.restoreTool}
							/>
						</ResizablePanel>
						<ResizableHandle withHandle />
						<ResizablePanel defaultSize={74}>
							{editor.selectedTool ? (
								<MCPToolDetail
									key={editor.selectedTool.id}
									entry={editor.selectedTool}
									otherToolNames={otherToolNames}
									readOnly={readOnly}
									onUpdateTool={editor.updateTool}
									onUpdateProperty={editor.updateProperty}
									onAddProperty={editor.addProperty}
									onDeleteProperty={editor.deleteProperty}
									onRenameProperty={editor.renamePropertyKey}
									onToggleRequired={editor.toggleRequired}
									onChangePropertyType={
										editor.changePropertyType
									}
									onDuplicate={editor.duplicateTool}
									onDelete={editor.deleteTool}
									onRestore={editor.restoreTool}
								/>
							) : (
								<div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
									<p className="text-muted-foreground text-sm">
										{editor.tools.length === 0
											? "This file has no tools yet."
											: "Select a tool to edit it."}
									</p>
									{!readOnly && editor.tools.length === 0 && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => setAddOpen(true)}
										>
											Add the first tool
										</Button>
									)}
								</div>
							)}
						</ResizablePanel>
					</ResizablePanelGroup>
				)}
			</div>

			<AddToolDialog
				open={addOpen}
				takenNames={editor.takenNames}
				toolType={editor.toolType}
				onOpenChange={setAddOpen}
				onCreate={editor.addTool}
			/>

			<ConfirmDialog
				open={refreshConfirmOpen}
				title="Discard unsaved changes?"
				description="Reloading reads the file from disk. Your unsaved edits in this editor will be lost."
				confirmLabel="Reload and discard"
				destructive
				onOpenChange={setRefreshConfirmOpen}
				onConfirm={() => void runRefresh()}
			/>
		</div>
	);
};

/**
 * Serializes tools the same way the editor holds them, so a freshly loaded
 * file and an in-editor tool compare equal when nothing has been touched.
 */
const baselineOf = (tools: MCPTool[]): Set<string> =>
	new Set((tools ?? []).map((tool) => JSON.stringify(normalizeTool(tool))));
