import type { StateStore } from "@semoss/renderer";
import { Blocks } from "@semoss/renderer";
import {
	Spinner,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
} from "@semoss/ui/next";

export type PreviewMode = "query" | "block";

export interface PreviewPanelProps {
	mode: PreviewMode;
	title?: string;
	subtitle?: string;

	// Query mode
	queryData?: {
		headers: string[];
		rows: unknown[][];
		loading: boolean;
		error: string | null;
		emptyMessage?: string;
	};

	// Block mode
	blockData?: {
		blockState: StateStore;
		blockId: string;
		// biome-ignore lint/suspicious/noExplicitAny: Block registry type is complex and varies
		registry: Record<string, any>; // Block registry (DefaultBlocks, DefaultCells, etc.)
	};

	// Height customization
	height?: string; // e.g., "25vh", "35%", "300px"

	// Custom empty message
	emptyMessage?: string;

	// Show message when query is invalid (query mode only)
	showInvalidQueryMessage?: boolean;
	invalidQueryMessage?: string;

	// Center block vertically in preview (block mode only)
	centerBlock?: boolean;
}

export const PreviewPanel = (props: PreviewPanelProps) => {
	const {
		mode,
		title = "Preview",
		subtitle,
		queryData,
		blockData,
		height,
		emptyMessage = "No data available",
		showInvalidQueryMessage = false,
		invalidQueryMessage = "Enter a valid query to view preview",
		centerBlock = false,
	} = props;

	// Validate required props based on mode
	if (mode === "query" && !queryData) {
		console.error("PreviewPanel: queryData is required for query mode");
		return null;
	}

	if (mode === "block" && !blockData) {
		console.error("PreviewPanel: blockData is required for block mode");
		return null;
	}

	// Query Preview Mode
	if (mode === "query" && queryData) {
		// Remove top margin when height is explicitly set (vh, %, px, or 100%)
		const hasExplicitHeight =
			height &&
			(height.includes("vh") ||
				height.includes("%") ||
				height.includes("px") ||
				height === "100%");

		return (
			<div
				className={`flex flex-col overflow-hidden ${hasExplicitHeight ? "" : "mt-4"}`}
				style={height ? { height } : { height: "35%" }}
			>
				<div className="flex h-full min-h-0 flex-col bg-white">
					<h6 className="mt-[15px] mb-5 ml-[15px] font-semibold text-xl">
						{title}
					</h6>
					{subtitle && (
						<p className="mb-1 ml-2 text-muted-foreground text-sm">
							{subtitle}
						</p>
					)}

					{/* Invalid Query Message */}
					{showInvalidQueryMessage ? (
						<div className="mx-4 mb-4 rounded border border-gray-300 bg-gray-100 p-4 text-center">
							<p className="text-muted-foreground text-sm">
								{invalidQueryMessage}
							</p>
						</div>
					) : queryData.loading ? (
						/* Loading State */
						<div className="flex min-h-[200px] items-center justify-center">
							<Spinner />
						</div>
					) : queryData.error ? (
						/* Error State */
						<div className="mx-4 mb-4 rounded border border-red-300 bg-red-50 p-4">
							<p className="text-destructive text-sm">
								<strong>Error:</strong> {queryData.error}
							</p>
						</div>
					) : queryData.headers?.length === 0 ||
						queryData.rows?.length === 0 ? (
						/* Empty State */
						<h6 className="p-10 text-center font-bold text-xl">
							{queryData.emptyMessage || emptyMessage}
						</h6>
					) : (
						/* Data Table */
						<div className="min-h-0 max-w-none flex-1 overflow-auto">
							<Table>
								<TableBody>
									{/* Header Row */}
									<TableRow>
										{queryData.headers?.map(
											(header, headerIdx) => (
												<TableHead
													key={`${headerIdx}-${header}`}
													className="sticky top-0 bg-white"
												>
													<strong>{header}</strong>
												</TableHead>
											),
										)}
									</TableRow>
									{/* Data Rows */}
									{queryData.rows?.map((row, rowIdx) => (
										<TableRow
											// biome-ignore lint/suspicious/noArrayIndexKey: Row data may not have unique identifiers
											key={`row-${rowIdx}`}
										>
											{row.map((value, valueIdx) => (
												<TableCell
													// biome-ignore lint/suspicious/noArrayIndexKey: Cell data may not have unique identifiers
													key={`${rowIdx}-${valueIdx}`}
												>
													{typeof value ===
														"object" &&
													value !== null
														? JSON.stringify(value)
														: String(value ?? "")}
												</TableCell>
											))}
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
				</div>
			</div>
		);
	}

	// Block Preview Mode
	if (mode === "block" && blockData) {
		const { blockState, blockId, registry } = blockData;
		// Remove top margin when height is explicitly set (vh, %, px, or 100%)
		const hasExplicitHeight =
			height &&
			(height.includes("vh") ||
				height.includes("%") ||
				height.includes("px") ||
				height === "100%");

		return (
			<div
				className={`flex flex-col overflow-hidden ${hasExplicitHeight ? "" : "mt-4"}`}
				style={height ? { height } : { height: "35%" }}
			>
				<p className="mb-2 ml-2 font-medium text-sm">{title}</p>
				{subtitle && (
					<p className="mb-1 ml-2 text-muted-foreground text-xs">
						{subtitle}
					</p>
				)}
				<div className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-300 bg-white p-2">
					<Blocks state={blockState} registry={registry}>
						<div
							className={`h-full w-full overflow-auto ${
								centerBlock
									? "flex flex-col items-center justify-center"
									: ""
							}`}
						>
							{(() => {
								const block = blockState.blocks[blockId];
								if (!block) {
									return (
										<p className="text-destructive text-sm">
											Block not found: {blockId}
										</p>
									);
								}

								const widget = block.widget;
								const BlockComponent = registry[widget]?.render;

								if (!BlockComponent) {
									return (
										<p className="text-destructive text-sm">
											Widget not found: {widget}
										</p>
									);
								}

								return <BlockComponent id={blockId} />;
							})()}
						</div>
					</Blocks>
				</div>
			</div>
		);
	}

	return null;
};
