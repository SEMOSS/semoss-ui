import {
	Braces,
	ChevronLeft,
	ChevronRight,
	Database,
	FolderClock,
	Search,
	Workflow,
} from "lucide-react";
import { useId, useMemo, useState } from "react";
import { CellOutputBlock } from "@semoss/shared";
import {
	Button,
	cn,
	Input,
	Muted,
	Small,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { formatDurationMs } from "@semoss/utility/date";
import type {
	AutomationNodeResult,
	AutomationRunDetail,
	AutomationSavedResultReference,
} from "../../../domain/automation.types";
import { StatusBadge } from "../../status-badge";
import { buildRunDataItems, runtimeNodeId } from "./run-data-browser-data";
import { RunNodeDataViewer } from "./run-node-data-viewer";
import {
	findSavedResultForOccurrence,
	getRunNodeDataSource,
} from "./run-node-view-state";

interface RunDataBrowserProps {
	appId: string;
	run: AutomationRunDetail;
	onOutputPopout: (output: string) => void;
	onOpenRunFiles?: () => void;
}

type DataTab =
	| "input"
	| "output"
	| "variables"
	| "metadata"
	| "files"
	| "errors";

const ITEM_PAGE_SIZE = 50;

/**
 * Presents retained run data using a message-browser model: logical work items,
 * the selected item's execution path, and the selected step's data.
 */
export function RunDataBrowser({
	appId,
	run,
	onOutputPopout,
	onOpenRunFiles,
}: RunDataBrowserProps) {
	const [query, setQuery] = useState("");
	const [pageIndex, setPageIndex] = useState(0);
	const [selectedItemKey, setSelectedItemKey] = useState("root");
	const [selectedNodeKey, setSelectedNodeKey] = useState<string | null>(null);
	const [dataTab, setDataTab] = useState<DataTab>("output");
	const searchId = useId();
	const items = useMemo(() => buildRunDataItems(run), [run]);
	const filteredItems = useMemo(() => {
		const normalized = query.trim().toLocaleLowerCase();
		if (!normalized) return items;
		return items.filter((item) =>
			item.searchText.toLocaleLowerCase().includes(normalized),
		);
	}, [items, query]);
	const pageCount = Math.ceil(filteredItems.length / ITEM_PAGE_SIZE);
	const visiblePageIndex = Math.min(pageIndex, Math.max(pageCount - 1, 0));
	const visibleItems = filteredItems.slice(
		visiblePageIndex * ITEM_PAGE_SIZE,
		(visiblePageIndex + 1) * ITEM_PAGE_SIZE,
	);
	const selectedItem =
		visibleItems.find((item) => item.key === selectedItemKey) ??
		visibleItems[0] ??
		null;
	const selectedResult = selectedItem
		? (selectedItem.results.find(
				(result) => runtimeNodeId(result) === selectedNodeKey,
			) ?? lastRelevantResult(selectedItem.results))
		: null;
	const selectedSavedResult = selectedResult
		? findSavedResultForOccurrence(
				run.savedResults ?? [],
				selectedResult.NODE_ID,
				selectedItem?.loopNodeId !== undefined &&
					selectedItem.iterationIndex !== undefined
					? {
							parentNodeId: selectedItem.loopNodeId,
							iterationIndex: selectedItem.iterationIndex,
						}
					: null,
			)
		: undefined;
	const selectedDataSource = selectedResult
		? getRunNodeDataSource(
				selectedSavedResult,
				run.executionInsightId,
				selectedResult.OUTPUT_FRAME,
			)
		: { kind: "preview" as const };

	const handleSelectItem = (itemKey: string) => {
		setSelectedItemKey(itemKey);
		setSelectedNodeKey(null);
		setDataTab("output");
	};

	const handleSelectNode = (result: AutomationNodeResult) => {
		setSelectedNodeKey(runtimeNodeId(result));
		setDataTab("output");
	};

	const handleSearch = (value: string) => {
		setQuery(value);
		setPageIndex(0);
		setSelectedItemKey("root");
		setSelectedNodeKey(null);
	};

	return (
		<section
			className="flex min-h-0 flex-1 overflow-x-auto rounded-lg border bg-card focus-visible:outline-2 focus-visible:outline-ring"
			aria-label="Run data browser"
		>
			<section className="flex w-64 shrink-0 flex-col border-r">
				<div className="space-y-2 border-b p-3">
					<div className="flex items-center justify-between gap-2">
						<Small>Processed items</Small>
						<Muted>{items.length}</Muted>
					</div>
					<label htmlFor={searchId} className="sr-only">
						Search processed items
					</label>
					<div className="relative">
						<Search
							className="-translate-y-1/2 absolute top-1/2 left-2 size-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<Input
							id={searchId}
							value={query}
							onChange={(event) =>
								handleSearch(event.target.value)
							}
							placeholder="Search items or outputs"
							className="pl-8"
						/>
					</div>
					<Muted>Searches retained run metadata and previews.</Muted>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{filteredItems.length === 0 ? (
						<div className="space-y-1 p-4 text-center">
							<Small>No processed items found</Small>
							<Muted>Try a different search.</Muted>
						</div>
					) : (
						visibleItems.map((item) => {
							const isSelected = item.key === selectedItem?.key;
							return (
								<button
									key={item.key}
									type="button"
									onClick={() => handleSelectItem(item.key)}
									aria-pressed={isSelected}
									className={cn(
										"flex min-h-11 w-full items-start gap-2 border-b px-3 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
										isSelected &&
											"bg-accent text-accent-foreground",
									)}
								>
									<Braces
										className="mt-1 size-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-sm">
											{item.label}
										</span>
										<span className="block truncate text-muted-foreground text-xs">
											{item.description}
										</span>
									</span>
									{item.status ? (
										<StatusBadge status={item.status} />
									) : null}
								</button>
							);
						})
					)}
				</div>
				{filteredItems.length > 0 ? (
					<div className="flex items-center justify-between gap-2 border-t p-2">
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={visiblePageIndex === 0}
							onClick={() =>
								setPageIndex((current) =>
									Math.max(current - 1, 0),
								)
							}
						>
							<ChevronLeft aria-hidden="true" />
							Previous
						</Button>
						<Muted>
							{visiblePageIndex + 1} of {pageCount}
						</Muted>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							disabled={visiblePageIndex >= pageCount - 1}
							onClick={() =>
								setPageIndex((current) =>
									Math.min(current + 1, pageCount - 1),
								)
							}
						>
							Next
							<ChevronRight aria-hidden="true" />
						</Button>
					</div>
				) : null}
			</section>

			<section className="flex w-64 shrink-0 flex-col border-r">
				<div className="border-b p-3">
					<Small>Execution path</Small>
					<Muted>
						{selectedItem?.label ?? "Select a processed item"}
					</Muted>
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{!selectedItem || selectedItem.results.length === 0 ? (
						<div className="space-y-1 p-4 text-center">
							<Small>No executed steps</Small>
							<Muted>
								This item has no retained step results.
							</Muted>
						</div>
					) : (
						selectedItem.results.map((result) => {
							const nodeKey = runtimeNodeId(result);
							const isSelected =
								nodeKey === runtimeNodeId(selectedResult);
							return (
								<button
									key={nodeKey}
									type="button"
									onClick={() => handleSelectNode(result)}
									aria-pressed={isSelected}
									className={cn(
										"flex min-h-11 w-full items-start gap-2 border-b px-3 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring",
										isSelected &&
											"bg-accent text-accent-foreground",
									)}
								>
									<Workflow
										className="mt-1 size-4 shrink-0 text-muted-foreground"
										aria-hidden="true"
									/>
									<span className="min-w-0 flex-1">
										<span className="block truncate font-medium text-sm">
											{result.NODE_LABEL ||
												result.NODE_ID}
										</span>
										<span className="block truncate text-muted-foreground text-xs">
											{result.OUTPUT_VAR_NAME ||
												"No output variable"}{" "}
											·{" "}
											{formatDurationMs(
												result.DURATION_MS,
											)}
										</span>
									</span>
									<StatusBadge status={result.STATUS} />
								</button>
							);
						})
					)}
				</div>
			</section>

			<section className="flex min-w-96 flex-1 flex-col overflow-hidden">
				<div className="border-b p-3">
					<div className="flex items-center gap-2">
						<Database
							className="size-4 text-muted-foreground"
							aria-hidden="true"
						/>
						<Small>
							{selectedResult?.NODE_LABEL ?? "Step data"}
						</Small>
					</div>
					<Muted>
						{selectedResult
							? `${selectedItem?.label ?? "Run"} · ${selectedResult.OUTPUT_VAR_NAME || "No output variable"}`
							: "Select an executed step to inspect its retained data."}
					</Muted>
				</div>

				<Tabs
					value={dataTab}
					onValueChange={(value) => {
						if (isDataTab(value)) setDataTab(value);
					}}
					className="flex min-h-0 flex-1 flex-col"
				>
					<TabsList className="mx-3 mt-3 w-fit max-w-full justify-start overflow-x-auto">
						<TabsTrigger value="input">Input</TabsTrigger>
						<TabsTrigger value="output">Output</TabsTrigger>
						<TabsTrigger value="variables">Variables</TabsTrigger>
						<TabsTrigger value="metadata">Metadata</TabsTrigger>
						<TabsTrigger value="files">Files</TabsTrigger>
						<TabsTrigger value="errors">Errors</TabsTrigger>
					</TabsList>

					<TabsContent
						value="input"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						<CellOutputBlock
							output={
								selectedItem?.input ||
								"No item input was retained."
							}
							onOutputPopout={() =>
								onOutputPopout(
									selectedItem?.input ||
										"No item input was retained.",
								)
							}
						/>
					</TabsContent>

					<TabsContent
						value="files"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						<div className="space-y-3 rounded-lg border p-4">
							<div className="flex items-start gap-3">
								<FolderClock
									className="mt-0.5 size-5 text-muted-foreground"
									aria-hidden="true"
								/>
								<div className="space-y-1">
									<Small>Live run files</Small>
									<Muted>
										Files are not retained in Automation
										history. They can be opened only while
										this run&apos;s execution workspace is
										still available.
									</Muted>
								</div>
							</div>
							<Button
								type="button"
								variant="outline"
								disabled={!onOpenRunFiles}
								onClick={onOpenRunFiles}
							>
								<FolderClock aria-hidden="true" />
								Open Run files
							</Button>
						</div>
					</TabsContent>

					<TabsContent
						value="output"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						{selectedResult &&
						selectedDataSource.kind !== "preview" ? (
							<RunNodeDataViewer
								appId={appId}
								insightId={run.executionInsightId}
								frame={selectedResult.OUTPUT_FRAME}
								savedResult={selectedSavedResult}
								outputPreview={displayValue(selectedResult)}
								onOutputPopout={onOutputPopout}
							/>
						) : (
							<CellOutputBlock
								output={
									selectedResult
										? displayValue(selectedResult)
										: "No step is selected."
								}
								onOutputPopout={() =>
									onOutputPopout(
										selectedResult
											? displayValue(selectedResult)
											: "No step is selected.",
									)
								}
							/>
						)}
					</TabsContent>

					<TabsContent
						value="variables"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						<div className="space-y-2">
							{selectedItem?.results.filter(
								(result) => result.OUTPUT_VAR_NAME,
							).length ? (
								selectedItem.results
									.filter((result) => result.OUTPUT_VAR_NAME)
									.map((result) => (
										<button
											key={runtimeNodeId(result)}
											type="button"
											onClick={() =>
												handleSelectNode(result)
											}
											className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
										>
											<span className="min-w-0">
												<span className="block truncate font-medium text-sm">
													{result.OUTPUT_VAR_NAME}
												</span>
												<span className="block truncate text-muted-foreground text-xs">
													{result.NODE_LABEL ||
														result.NODE_ID}
												</span>
											</span>
											<span className="max-w-48 truncate text-muted-foreground text-xs">
												{displayValue(result)}
											</span>
										</button>
									))
							) : (
								<div className="space-y-1 text-center">
									<Small>No retained variables</Small>
									<Muted>
										This item did not publish named outputs.
									</Muted>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent
						value="metadata"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
							{metadataRows(
								selectedResult,
								selectedSavedResult,
							).map(([label, value]) => (
								<div
									key={label}
									className="min-w-0 border-b pb-2"
								>
									<dt className="text-muted-foreground text-xs">
										{label}
									</dt>
									<dd className="break-words text-sm">
										{value}
									</dd>
								</div>
							))}
						</dl>
					</TabsContent>

					<TabsContent
						value="errors"
						className="min-h-0 flex-1 overflow-y-auto p-3"
					>
						<CellOutputBlock
							output={
								selectedResult?.ERROR_MESSAGE ||
								"No error was retained for this step."
							}
							onOutputPopout={() =>
								onOutputPopout(
									selectedResult?.ERROR_MESSAGE ||
										"No error was retained for this step.",
								)
							}
						/>
					</TabsContent>
				</Tabs>
			</section>
		</section>
	);
}

function isDataTab(value: string): value is DataTab {
	return [
		"input",
		"output",
		"variables",
		"metadata",
		"files",
		"errors",
	].includes(value);
}

function lastRelevantResult(
	results: AutomationNodeResult[],
): AutomationNodeResult | null {
	return (
		[...results]
			.reverse()
			.find(
				(result) =>
					result.STATUS === "FAILED" || result.STATUS === "SUCCESS",
			) ??
		results[results.length - 1] ??
		null
	);
}

function displayValue(result: AutomationNodeResult): string {
	return (
		result.OUTPUT_PREVIEW ??
		result.ERROR_MESSAGE ??
		"No value was retained."
	);
}

function metadataRows(
	result: AutomationNodeResult | null,
	savedResult: AutomationSavedResultReference | undefined,
): Array<[string, string]> {
	if (!result) return [["Selection", "No step is selected."]];
	return [
		["Status", result.STATUS],
		["Duration", formatDurationMs(result.DURATION_MS)],
		["Node", result.NODE_LABEL || result.NODE_ID],
		["Node ID", result.NODE_ID],
		["Output variable", result.OUTPUT_VAR_NAME || "None"],
		[
			"Durable data",
			savedResult
				? `${savedResult.RESULT_KIND} retained until ${savedResult.RETAIN_UNTIL}`
				: result.OUTPUT_FRAME
					? "Live frame available"
					: "Not available",
		],
		["Rows", savedResult?.ROW_COUNT?.toLocaleString() ?? "Not tabular"],
	];
}
