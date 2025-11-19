import { styled } from "@mui/material";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { Button, CircularProgress } from "@semoss/ui";
import { useBlock, useBlocks, useFrame, useFrameHeaders } from "../../../hooks";
import {
	ActionMessages,
	type BlockComponent,
	type BlockDef,
} from "../../../store";
import { GridBlockContextMenu } from "./GridBlockContextMenu";
import type { GridBlockColumn } from "./grid-block.types";

// Type for query import cell parameters
interface QueryImportCellParams {
	frameVariableName?: string;
	enableBatching?: boolean;
	batchSize?: number;
	currentOffset?: number;
}

const DEFAULT_HEIGHT = "300px";
const DEFAULT_WIDTH = "500px";

const StyledBlock = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	minHeight: DEFAULT_HEIGHT,
	width: DEFAULT_WIDTH,
}));

const StyledTitle = styled("div")(() => ({
	width: "100%",
	display: "flex",
	justifyContent: "center",
}));

const StyledDataGridContainer = styled("div")(() => ({
	flex: 1,
	width: "100%",
	height: "100%",
}));

export interface HeaderBackgroundSettings {
	backgroundColor: string;
	fontSize: string;
	fontColor: string;
	selectedColumn: string[];
}

export interface CellBackgroundSettings {
	backgroundColor: string;
	fontSize: string;
	fontColor: string;
	selectedColumn: string[];
}

export interface ChartTitleSettings {
	chartTitle: string;
	fontSize: string;
	fontColor: string;
}

export interface WrapTextSettings {
	selectedColumn: string[];
	textWrap: boolean;
}

export interface ColorRule {
	id: string;
	column: string;
	comparator: string;
	value: string;
	valueColumn: string;
	color: string;
	colorEntireRow: boolean;
}

export interface GridBlockDef extends BlockDef<"grid"> {
	widget: "grid";

	/** data associated with the block */
	data: {
		/** Bind the grid to a frame */
		frame: {
			name: string;
		};

		/** Column Definitions */
		columns: GridBlockColumn[];

		/** */
		style: {
			height: string | undefined;
			width: string | undefined;
			display: string | undefined;
			flexDirection: string | undefined;
			padding: string | undefined;
			gap: string | undefined;
			flexWrap: string | undefined;
		};
		option: {
			headerBackgroundSettings?: HeaderBackgroundSettings;
			cellBackgroundSettings?: CellBackgroundSettings;
			chartTitleSettings?: ChartTitleSettings;
			wrapTextSettings?: WrapTextSettings;
			rowSpanning?: boolean;
			colorByValue?: ColorRule[];
		};
		variation: undefined | string;
		show: boolean;

		/** Context Menu */
		contextMenu?: {
			/** Show the unfilter related options */
			hideUnfilter: boolean;

			/** Show the filter related options */
			hideFilter: boolean;
		};

		view?: {
			//TODO: Include limit + offset?

			/** Enable the pagination */
			pagination: boolean;
		};
	};
}

export const GridBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData } = useBlock<GridBlockDef>(id);
	const { state } = useBlocks();
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 50,
	});
	const [loadingMore, setLoadingMore] = useState(false);
	const [accumulatedData, setAccumulatedData] = useState<unknown[][]>([]);
	const accumulatedDataRef = useRef<unknown[][]>([]);
	const lastProcessedOffsetRef = useRef<number>(-1);
	const lastFrameDataRef = useRef<unknown[][]>([]);

	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		column: GridBlockColumn;
		value: unknown;
	} | null>(null);

	// Find the source QueryImportCell that created this frame
	// The GridBlock is bound to data.frame.name (e.g., "FRAME_80690")
	// When batching is enabled, actual frames are named "FRAME_80690_BATCH_0", etc.
	// We need to find the cell whose frameVariableName matches our base name
	const sourceCell = Object.values(state.queries)
		.flatMap((q) => Object.values(q.cells))
		.find((cell) => {
			if (cell.widget !== "query-import") return false;
			const frameVar = (cell.parameters as QueryImportCellParams)
				.frameVariableName;
			// Match if frameVar equals the GridBlock's frame name exactly
			return frameVar === data.frame.name;
		});

	// Check if batching is enabled
	const isBatchingEnabled =
		(sourceCell?.parameters as QueryImportCellParams)?.enableBatching ??
		false;
	const batchSize =
		(sourceCell?.parameters as QueryImportCellParams)?.batchSize ?? 100;

	// Always fetch from the original frame (merging happens on backend)
	const currentOffset =
		(sourceCell?.parameters as QueryImportCellParams)?.currentOffset ?? 0;
	const frameName = data.frame.name;

	// get the frame - when batching is enabled, don't apply pagination (SQL query handles it)
	const frame = useFrame(frameName, {
		selector: undefined,
		offset: isBatchingEnabled
			? undefined
			: paginationModel.page * paginationModel.pageSize,
		limit: isBatchingEnabled ? undefined : paginationModel.pageSize,
		enableCount: true,
	});

	// When headers come from user upload - always use the base frame name
	const frameHeaders = useFrameHeaders(data.frame.name);

	/**
	 * Sync columns when batching is enabled to ensure all columns are visible
	 */
	useEffect(() => {
		if (
			isBatchingEnabled &&
			data.columns.length > 0 &&
			data.columns.length < 10
		) {
			console.log(
				"[GridBlock] Batching enabled with partial columns - clearing to force re-sync",
			);
			setData("columns", []);
		}
	}, [isBatchingEnabled, data.columns.length]);

	/**
	 * Anytime our Frame Headers change, we need to sync our column block data with our source of truth
	 * This ensures all columns are present, especially important for batching scenarios
	 */
	useEffect(() => {
		if (!frameHeaders.isLoading && frameHeaders.data.list.length > 0) {
			// When batching is enabled, always sync to get all columns
			// When batching is disabled, only sync if columns are empty
			const shouldSync = isBatchingEnabled
				? data.columns.length !== frameHeaders.data.list.length
				: data.columns.length === 0;

			if (shouldSync) {
				console.log(
					`[GridBlock SYNC] Syncing columns: ${data.columns.length} → ${frameHeaders.data.list.length}`,
				);
				syncBlockDataColumns(frameHeaders);
			}
		}
	}, [
		frameHeaders.data.list,
		frameHeaders.isLoading,
		data.columns.length,
		isBatchingEnabled,
	]);

	/**
	 * Handle data accumulation when batching is enabled
	 * Use ref to store actual data and prevent duplicate processing
	 */
	useEffect(() => {
		if (!isBatchingEnabled) {
			accumulatedDataRef.current = [];
			lastProcessedOffsetRef.current = -1;
			lastFrameDataRef.current = [];
			setAccumulatedData([]);
			return;
		}

		// Wait for frame data to be available
		if (!frame.data.values.length) return;

		// Don't process if cell is still loading
		const isCurrentlyLoading = sourceCell?.isLoading ?? false;
		if (isCurrentlyLoading) return;

		console.log(
			"[GridBlock Accumulation] currentOffset:",
			currentOffset,
			"lastProcessed:",
			lastProcessedOffsetRef.current,
			"frameDataLength:",
			frame.data.values.length,
			"accumulatedLength:",
			accumulatedDataRef.current.length,
		);

		// Check if we've already processed this offset
		if (currentOffset === lastProcessedOffsetRef.current) {
			console.log(
				"[GridBlock Accumulation] SKIPPING - already processed offset",
				currentOffset,
			);
			return; // Already processed this batch
		}

		// Check if frame data has actually changed (prevent appending stale data)
		if (
			lastFrameDataRef.current.length > 0 &&
			frame.data.values === lastFrameDataRef.current
		) {
			console.log(
				"[GridBlock Accumulation] SKIPPING - frame data reference unchanged",
			);
			return;
		}

		// For offset 0: reset and start fresh
		if (currentOffset === 0) {
			console.log(
				"[GridBlock Accumulation] RESET - offset 0, setting data to",
				frame.data.values.length,
				"rows",
			);
			accumulatedDataRef.current = frame.data.values;
			lastProcessedOffsetRef.current = 0;
			lastFrameDataRef.current = frame.data.values;
			setAccumulatedData([...frame.data.values]);
			if (loadingMore) setLoadingMore(false);
		} else if (currentOffset > lastProcessedOffsetRef.current) {
			// Loading more - append new data to ref
			console.log(
				"[GridBlock Accumulation] APPEND - adding",
				frame.data.values.length,
				"rows to existing",
				accumulatedDataRef.current.length,
			);
			accumulatedDataRef.current = [
				...accumulatedDataRef.current,
				...frame.data.values,
			];
			lastProcessedOffsetRef.current = currentOffset;
			lastFrameDataRef.current = frame.data.values;
			setAccumulatedData([...accumulatedDataRef.current]);
			if (loadingMore) setLoadingMore(false);
		}
	}, [
		isBatchingEnabled,
		sourceCell?.isLoading,
		loadingMore,
		currentOffset,
		frame.data.values,
	]);

	/**
	 * Updates data.columns
	 * @param synData
	 */
	const syncBlockDataColumns = (cols) => {
		const columns: GridBlockColumn[] = cols.data.list.map((h) => {
			return {
				name: h.alias,
				width: undefined,
				selector: h.header,
			};
		});
		// update the data
		setData("columns", columns);
	};

	// When batching is enabled and columns don't match frame headers, use frame headers directly for rendering
	// This ensures we always show all columns even if the state update hasn't propagated yet
	const columnsToDisplay =
		isBatchingEnabled &&
		frameHeaders.data.list.length > 0 &&
		data.columns.length !== frameHeaders.data.list.length
			? frameHeaders.data.list.map((h) => ({
					name: h.alias,
					width: undefined,
					selector: h.header,
				}))
			: data.columns;

	/**
	 * Handle Load More button click
	 */
	const handleLoadMore = () => {
		if (!sourceCell) return;
		if (loadingMore || sourceCell.isLoading) return; // Prevent multiple clicks while loading

		setLoadingMore(true);

		// Update the offset in the source cell
		const newOffset =
			((sourceCell.parameters as QueryImportCellParams).currentOffset ??
				0) + batchSize;
		state.dispatch({
			message: ActionMessages.UPDATE_CELL,
			payload: {
				queryId: sourceCell.query.id,
				cellId: sourceCell.id,
				path: "parameters.currentOffset",
				value: newOffset,
			},
		});

		// Run the cell to fetch next batch
		setTimeout(() => {
			state.dispatch({
				message: ActionMessages.RUN_CELL,
				payload: {
					queryId: sourceCell.query.id,
					cellId: sourceCell.id,
				},
			});
		}, 100);
	};

	/**
	 * Handle the callback for the context menu
	 * @param event - triggered event
	 * @param column - selected column
	 * @param row - value
	 */
	const handleTableCellOnContextMenu = (
		event: React.MouseEvent,
		column: GridBlockColumn,
		value: unknown,
	) => {
		// prevent the default interaction
		event.preventDefault();

		// open the menu and save the data
		setContextMenu(
			contextMenu === null
				? {
						mouseX: event.clientX + 2,
						mouseY: event.clientY - 6,
						column: column,
						value: value,
					}
				: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
					// Other native context menus might behave different.
					// With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
					null,
		);
	};

	function evaluate(
		cellValue: string,
		comparator: string,
		target: string,
	): boolean {
		const a =
			typeof cellValue === "number" ? cellValue : parseFloat(cellValue);
		const b = typeof target === "number" ? target : parseFloat(target);
		switch (comparator) {
			case "==":
				return a === b;
			case "!=":
				return a !== b;
			case ">":
				return a > b;
			case "<":
				return a < b;
			case ">=":
				return a >= b;
			case "<=":
				return a <= b;
			default:
				return false;
		}
	}

	const columns = columnsToDisplay.map((col) => ({
		field: col.name,
		headerName: col.name,
		sortable: false,
		renderHeader: () => (
			<div
				style={{
					// Apply style if the column is selected
					backgroundColor: headerSettings.selectedColumn.includes(
						col.name,
					)
						? headerSettings.backgroundColor
						: "inherit",
					color: headerSettings.selectedColumn.includes(col.name)
						? headerSettings.fontColor
						: "inherit",
					fontSize: headerSettings.selectedColumn.includes(col.name)
						? `${headerSettings.fontSize}px`
						: "inherit",
					padding: "8px",
					width: "100%",
					whiteSpace:
						wrapTextSettings.textWrap &&
						wrapTextSettings.selectedColumn.includes(col.name)
							? "normal"
							: "nowrap",
					wordBreak:
						wrapTextSettings.textWrap &&
						wrapTextSettings.selectedColumn.includes(col.name)
							? "break-word"
							: "normal",
				}}
			>
				{col.name}
			</div>
		),

		renderCell: (params) => {
			const isWrapEnabled =
				wrapTextSettings.textWrap &&
				wrapTextSettings.selectedColumn.includes(col.name);

			const origionalStyle: React.CSSProperties = {
				// Apply style if the column is selected
				backgroundColor: cellSettings.selectedColumn.includes(col.name)
					? cellSettings.backgroundColor
					: "inherit",
				color: cellSettings.selectedColumn.includes(col.name)
					? cellSettings.fontColor
					: "inherit",
				fontSize: cellSettings.selectedColumn.includes(col.name)
					? `${cellSettings.fontSize}px`
					: "inherit",
				padding: "8px",
				width: "100%",
				lineHeight: isWrapEnabled ? "1.5" : "normal",
				whiteSpace:
					wrapTextSettings.textWrap &&
					wrapTextSettings.selectedColumn.includes(col.name)
						? "normal"
						: "nowrap",
				wordBreak:
					wrapTextSettings.textWrap &&
					wrapTextSettings.selectedColumn.includes(col.name)
						? "break-word"
						: "normal",
			};

			const matchingRowRules = colorRules.filter((rule) => {
				return evaluate(
					params.row[rule.column],
					rule.comparator,
					rule.value,
				);
			});

			const style = { ...origionalStyle };
			for (const rule of matchingRowRules) {
				if (rule.colorEntireRow) {
					style.backgroundColor = rule.color;
					style.color = "#fff";
					break;
				}

				if (rule.valueColumn === col.name) {
					style.backgroundColor = rule.color;
					style.color = "#fff";
					break;
				}
			}

			return (
				<td
					onContextMenu={(e) =>
						handleTableCellOnContextMenu(e, col, params.value)
					}
					style={{
						...style,
					}}
				>
					{params.value}
				</td>
			);
		},
	}));

	// When batching is enabled, use accumulated data; otherwise use frame data directly
	const dataToDisplay = isBatchingEnabled
		? accumulatedData
		: frame.data.values;

	// Build a mapping from column name to data index using frame headers
	// This ensures data aligns correctly with columns regardless of order
	const columnIndexMap = new Map<string, number>();
	if (frameHeaders.data.list.length > 0) {
		frameHeaders.data.list.forEach((header, index) => {
			columnIndexMap.set(header.alias, index);
		});
	}

	const rows = dataToDisplay.map((r, rIdx) => {
		const obj: Record<string, unknown> = { id: rIdx };
		columns.forEach((col) => {
			// Use the column field name to find the correct index in the data array
			const dataIndex = columnIndexMap.get(col.field);
			if (dataIndex !== undefined) {
				obj[col.field] = r[dataIndex];
			} else {
				// Fallback: if no mapping found, the data might be in the same order as columns
				const fallbackIndex = columns.findIndex(
					(c) => c.field === col.field,
				);
				obj[col.field] = r[fallbackIndex];
			}
		});
		return obj;
	});

	const handlePaginationModalChange = (newmodel) => {
		// if the page size has changed reset the page
		if (newmodel.pageSize !== paginationModel.pageSize) {
			setPaginationModel({
				page: 0,
				pageSize: newmodel.pageSize,
			});
		} else {
			setPaginationModel(newmodel);
		}
	};

	const headerSettings = {
		fontSize: "16",
		fontColor: "#000000",
		selectedColumn: [],
		backgroundColor: "white",
		...data.option?.headerBackgroundSettings,
	};

	const cellSettings = {
		fontSize: "16",
		fontColor: "#000000",
		selectedColumn: [],
		backgroundColor: "white",
		...data.option?.cellBackgroundSettings,
	};

	const titleSettings = data.option?.chartTitleSettings || {
		chartTitle: "",
		fontSize: "16",
		fontColor: "#000000",
	};

	const wrapTextSettings = {
		selectedColumn: [],
		textWrap: false,
		...data.option?.wrapTextSettings,
	};

	const colorRules: ColorRule[] = data.option?.colorByValue || [];

	const getRowHeight = () => {
		if (data.option?.rowSpanning) {
			return 50;
		}
		return "auto";
	};

	const GridToolbar = () => {
		return (
			<GridToolbarContainer sx={{ justifyContent: "center" }}>
				<StyledTitle
					sx={{
						fontSize: `${titleSettings.fontSize}px`,
						color: titleSettings.fontColor,
					}}
				>
					{titleSettings.chartTitle}
				</StyledTitle>
			</GridToolbarContainer>
		);
	};

	// Disable Load More button if:
	// 1. Currently loading more data
	// 2. Source cell is currently running
	// 3. Last batch returned fewer rows than batchSize (no more data available)
	// 4. Last batch returned 0 rows
	// Disable Load More if currently loading, or if last batch was partial (less than batchSize rows)
	const lastBatchWasPartial =
		frame.data.values.length > 0 && frame.data.values.length < batchSize;
	const shouldDisableLoadMore =
		loadingMore || sourceCell?.isLoading || lastBatchWasPartial;

	return (
		<StyledBlock sx={data.style} {...attrs}>
			{isBatchingEnabled && (
				<div
					style={{
						padding: "8px",
						display: "flex",
						justifyContent: "flex-start",
					}}
				>
					<Button
						variant="outlined"
						size="small"
						onClick={handleLoadMore}
						disabled={shouldDisableLoadMore}
						startIcon={
							loadingMore ? <CircularProgress size={16} /> : null
						}
					>
						{loadingMore ? "Loading..." : "Load More"}
					</Button>
				</div>
			)}
			<StyledDataGridContainer
				style={{
					maxHeight: isBatchingEnabled ? "calc(100% - 50px)" : "100%",
				}}
			>
				<DataGrid
					rows={rows}
					columns={columns}
					pagination
					density="compact"
					paginationMode="server"
					rowCount={frame.count}
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationModalChange}
					pageSizeOptions={[10, 50, 100]}
					getRowHeight={getRowHeight}
					columnHeaderHeight={50}
					disableColumnMenu
					disableRowSelectionOnClick
					disableColumnSorting
					slots={{
						toolbar: titleSettings.chartTitle && GridToolbar,
					}}
					showCellVerticalBorder={
						data.option?.rowSpanning ? true : false
					}
					showColumnVerticalBorder={
						data.option?.rowSpanning ? true : false
					}
					unstable_rowSpanning={data.option?.rowSpanning}
					sx={{
						borderRadius: "0",
						"& .MuiDataGrid-columnHeaderTitleContainer": {
							fontWeight: "bold",
						},
						"& .MuiDataGrid-columnHeader": {
							padding: "0px",
						},
						"& .MuiDataGrid-columnHeaderTitleContainerContent": {
							width: "100%",
						},
						"& .MuiDataGrid-cell": {
							padding: "0px",
						},
					}}
				/>
			</StyledDataGridContainer>
			<GridBlockContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				onClose={() => setContextMenu(null)}
			/>
		</StyledBlock>
	);
});
