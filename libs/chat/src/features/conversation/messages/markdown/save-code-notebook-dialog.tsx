import { CheckIcon, ChevronDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useDebouncedValue, usePixel } from "@semoss/sdk/react";
import {
	createCodeCellFromExecution,
	type FileItem,
	insertCell,
	type JupyterNotebook,
	nextExecutionCount,
	toCellOutputs,
	validateNotebook,
} from "@semoss/shared";
import {
	Button,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	cn,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Spinner,
	toast,
} from "@semoss/ui/next";
import type { RoomStore } from "../../../room/store/room.store";

/** Props for {@link SaveCodeNotebookDialog}. */
interface SaveCodeNotebookDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Called when the dialog opens or closes, and after a save. */
	onOpenChange: (open: boolean) => void;
	/** Source code to store as the notebook cell's input. */
	code: string;
	/** Last execution result; used to populate the cell's outputs. */
	result:
		| {
				/** Plain-text display string shown in the output panel. */
				output: string;
				/** Streaming console lines captured during execution. */
				logs: string[];
				/** Whether the run failed, so the cell's output is an error. */
				isError: boolean;
				/** Whether the run is still going. */
				pending: boolean;
				/** Unwrapped pixel value used to build rich notebook cell outputs. */
				rawOutput?: unknown;
		  }
		| undefined;

	/** The current room context, used for executing pixels and opening files. */
	room?: RoomStore;
}

/** Sentinel value used as the Select item for creating a new notebook. */
const NEW_NOTEBOOK_VALUE = "__new__";

/**
 * Sanitises user input into a safe `.ipynb` filename.
 *
 * @param name - The typed name, with or without `.ipynb`.
 * @returns The file name; a timestamped one when nothing usable was typed.
 */
const createNotebookFilePath = (name: string): string => {
	const baseName = name.trim().replace(/\.ipynb$/i, "");
	const safeName = baseName
		.replace(/[\\/:*?"<>|]/g, "-")
		.replace(/\s+/g, "-");
	return `${safeName || `notebook-${Date.now()}`}.ipynb`;
};

/**
 * Adds a code block, with its last run's output, as a cell of a notebook in
 * the room's files: an existing one the user searches for, or a new one they
 * name.
 */
export const SaveCodeNotebookDialog = ({
	open,
	onOpenChange,
	code,
	result,
	room,
}: SaveCodeNotebookDialogProps) => {
	const { t } = useTranslation("chat");
	const [selectedValue, setSelectedValue] = useState("");
	const [newNotebookName, setNewNotebookName] = useState("");
	const [notebookSearch, setNotebookSearch] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const [isPopoverOpen, setIsPopoverOpen] = useState(false);

	const debouncedSearch = useDebouncedValue(notebookSearch, 300);

	// Disabled (empty pixel) while the dialog is closed to avoid background fetches.
	const getNotebooks = usePixel<FileItem[]>(
		open
			? `SearchInsightAssets(filePath=[""], search=[${JSON.stringify(debouncedSearch.trim() || ".ipynb")}]);`
			: "",
		{ data: [] },
		room?.insightId,
	);

	const notebooks = (getNotebooks.data ?? []).filter(
		(item) =>
			item.type !== "directory" &&
			item.path.toLowerCase().endsWith(".ipynb"),
	);

	// True when the typed name matches an existing notebook — creating would duplicate it.
	const doesNameExist =
		notebookSearch.trim().length > 0 &&
		notebooks.some(
			(item) =>
				(item.path.split("/").pop() ?? item.path).toLowerCase() ===
				createNotebookFilePath(notebookSearch).toLowerCase(),
		);

	const isNew = selectedValue === NEW_NOTEBOOK_VALUE;
	const canSave = isNew
		? newNotebookName.trim().length > 0
		: selectedValue.length > 0;

	/** Label shown on the combobox trigger for the current selection. */
	const triggerLabel = isNew
		? createNotebookFilePath(newNotebookName)
		: selectedValue || t("blocks.selectNotebook");

	/** Persists `content` to `path` and opens/refeshes its editor tab. */
	const saveToPath = async (path: string, content: string) => {
		if (!room) return;
		await room.runRoomPixel(
			`SaveInsightAssets(filePath=[${JSON.stringify(path)}], content=["<encode>${content}</encode>"]);`,
			false,
			false,
		);
		room.openFileSidebarPanel(path, undefined, { refresh: true });
	};

	/** Appends the code (with its execution outputs) as a new cell to the target notebook. */
	const handleSave = async () => {
		if (!room || !code || !canSave) return;

		const targetPath = isNew
			? createNotebookFilePath(newNotebookName)
			: selectedValue;

		try {
			setIsSaving(true);

			let notebook: JupyterNotebook = {
				nbformat: 4,
				nbformat_minor: 5,
				metadata: {},
				cells: [],
			};

			if (!isNew) {
				// Explicitly selected from the list — must load successfully.
				const loadResponse = await room.runRoomPixel<[string]>(
					`GetInsightAssets(filePath=[${JSON.stringify(targetPath)}]);`,
					false,
					false,
				);
				const existingContent =
					loadResponse.pixelReturn[0]?.output ?? "";
				try {
					notebook = validateNotebook(existingContent);
				} catch (error) {
					const message =
						error instanceof Error && error.message
							? error.message
							: t("blocks.error");

					toast.error(message);
					return;
				}
			} else {
				// Guard against silently overwriting a collision with the generated name.
				try {
					const loadResponse = await room.runRoomPixel<[string]>(
						`GetInsightAssets(filePath=[${JSON.stringify(targetPath)}]);`,
						false,
						false,
					);
					const existingContent =
						loadResponse.pixelReturn[0]?.output ?? "";
					if (existingContent.trim()) {
						try {
							notebook = validateNotebook(existingContent);
						} catch {
							// Not a valid notebook — start fresh.
						}
					}
				} catch {
					// Path doesn't exist yet — proceed with a brand-new notebook.
				}
			}

			const executionCount = nextExecutionCount(notebook);
			let outputs: ReturnType<typeof toCellOutputs> = [];
			if (result) {
				outputs = toCellOutputs(
					result.logs,
					result.rawOutput ?? result.output,
					result.isError,
					executionCount,
				);
			}
			const cell = createCodeCellFromExecution(
				code,
				outputs,
				executionCount,
			);
			const content = JSON.stringify(insertCell(notebook, cell), null, 2);

			await saveToPath(targetPath, content);
			onOpenChange(false);
			toast.success(
				t(
					isNew
						? "blocks.createdNotebook"
						: "blocks.appendedToNotebook",
					{
						name: targetPath.split("/").pop() ?? targetPath,
					},
				),
			);
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: t("blocks.error");

			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	};

	/** Resets transient dialog state on close so the next open starts clean. */
	const handleOpenChange = (next: boolean) => {
		if (!next) {
			setSelectedValue("");
			setNewNotebookName("");
			setNotebookSearch("");
			setIsPopoverOpen(false);
		}
		onOpenChange(next);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>{t("blocks.addToNotebook")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-3">
					<Popover
						open={isPopoverOpen}
						onOpenChange={setIsPopoverOpen}
					>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								role="combobox"
								aria-expanded={isPopoverOpen}
								aria-label={t("blocks.selectOrCreateNotebook")}
								className="w-full justify-between font-normal hover:bg-transparent hover:text-foreground"
							>
								<span
									className={cn(
										"min-w-0 truncate",
										!selectedValue &&
											"text-muted-foreground",
									)}
								>
									{triggerLabel}
								</span>
								<ChevronDownIcon className="size-4 shrink-0 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="start"
							className="w-(--radix-popover-trigger-width) p-0"
						>
							<Command shouldFilter={false}>
								<CommandInput
									value={notebookSearch}
									onValueChange={setNotebookSearch}
									placeholder={t("blocks.searchNotebook")}
								/>
								<CommandList>
									<CommandEmpty>
										{getNotebooks.status === "LOADING" ? (
											<div className="flex items-center justify-center py-4">
												<Spinner />
											</div>
										) : (
											t("blocks.noNotebooks")
										)}
									</CommandEmpty>
									<CommandGroup>
										{notebooks.map((item) => (
											<CommandItem
												key={item.path}
												value={item.path}
												onSelect={() => {
													setSelectedValue(item.path);
													setNewNotebookName("");
													setIsPopoverOpen(false);
												}}
											>
												<span className="min-w-0 truncate">
													{item.path}
												</span>
												{selectedValue ===
													item.path && (
													<CheckIcon className="ms-auto size-4 shrink-0" />
												)}
											</CommandItem>
										))}
										{notebookSearch.trim().length > 0 && (
											<CommandItem
												value={NEW_NOTEBOOK_VALUE}
												disabled={doesNameExist}
												onSelect={() => {
													setSelectedValue(
														NEW_NOTEBOOK_VALUE,
													);
													setNewNotebookName(
														notebookSearch,
													);
													setIsPopoverOpen(false);
												}}
											>
												<PlusIcon className="size-3.5" />
												{t(
													"blocks.createNotebookOption",
													{
														name: createNotebookFilePath(
															notebookSearch,
														),
													},
												)}
											</CommandItem>
										)}
									</CommandGroup>
								</CommandList>
							</Command>
						</PopoverContent>
					</Popover>
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
					>
						{t("common:buttons.cancel")}
					</Button>
					<Button
						onClick={() => void handleSave()}
						disabled={isSaving || !canSave}
					>
						{isSaving
							? t("response.savingToRoom")
							: isNew
								? t("common:buttons.create")
								: t("blocks.append")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
