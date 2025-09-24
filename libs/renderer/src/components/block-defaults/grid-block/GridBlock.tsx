import { styled } from "@mui/material";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useBlock, useBlocks, useFrame, useFrameHeaders } from "../../../hooks";
import {
	ActionMessages,
	type BlockComponent,
	type BlockDef,
} from "../../../store";
import { GridBlockContextMenu } from "./GridBlockContextMenu";
import type { GridBlockColumn } from "./grid-block.types";

const DEFAULT_HEIGHT = "300px";
const DEFAULT_WIDTH = "500px";

const StyledBlock = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	height: DEFAULT_HEIGHT,
	width: DEFAULT_WIDTH,
}));

const StyledTitle = styled("div")(() => ({
	width: "100%",
	display: "flex",
	justifyContent: "center",
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
		notebookId?: string; // <-- add this
		cellId?: string;
	};
}

export const GridBlock: BlockComponent = observer(({ id }) => {
	const { state } = useBlocks();
	const { attrs, data, setData } = useBlock<GridBlockDef>(id);
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 50,
	});
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number;
		mouseY: number;
		column: GridBlockColumn;
		value: unknown;
	} | null>(null);

	// create the selector
	const selector = `Select(${data.columns
		.map((c) => {
			return c.selector;
		})
		.join(", ")}).as([${data.columns
		.map((c) => {
			return c.name;
		})
		.join(", ")}])`;

	// get the frame
	const frame = useFrame(data.frame.name, {
		selector: selector,
		offset: paginationModel.page * paginationModel.pageSize,
		limit: paginationModel.pageSize,
		enableCount: true,
	});

	// When headers come from user upload
	const frameHeaders = useFrameHeaders(data.frame.name);

	/**
	 * Anytime our Frame Headers, we need to sync our column block data with our source of truth ^
	 */
	useEffect(() => {
		if (data.columns.length === 0 && !frameHeaders.isLoading) {
			// If no columns are defined, fetch the frame headers
			if (frameHeaders.data.list.length > 0) {
				syncBlockDataColumns(frameHeaders);
			}
		}
	}, [frameHeaders.data.list]);

	useEffect(() => {
		if (data.notebookId && data.cellId && state) {
			state.dispatch({
				message: ActionMessages.RUN_CELL, // or RUN_CELL if that's your action
				payload: {
					queryId: data.notebookId,
					cellId: data.cellId,
				},
			});
		}
	}, [data.notebookId, data.cellId, state]);

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
				return a == b;
			case "!=":
				return a != b;
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

	const columns = data.columns.map((col) => ({
		field: col.name,
		headerName: col.name,
		sortable: false,
		editable: data.notebookId && data.cellId ? true : false,
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
				<div
					onContextMenu={(e) =>
						handleTableCellOnContextMenu(e, col, params.value)
					}
					style={{
						...style,
					}}
				>
					{params.value}
				</div>
			);
		},
	}));

	const cellOutput =
		data.notebookId && data.cellId
			? state.queries?.[data.notebookId]?.cells?.[data.cellId]?.output
			: undefined;

	const maxLenRow =
		Array.isArray(cellOutput) && cellOutput.length > 0
			? cellOutput.reduce((a, b) => (b.length > a.length ? b : a), [])
			: [];

	const notebookColumns =
		maxLenRow.length > 0
			? maxLenRow.map((_, idx) => ({
					field: columns[idx]?.field || `Column${idx + 1}`,
					headerName: columns[idx]?.headerName || `Column ${idx + 1}`,
					sortable: false,
					editable: true,
				}))
			: columns;

	const rows =
		Array.isArray(cellOutput) && cellOutput.length > 0
			? cellOutput.map((r, idx) => {
					const obj: Record<string, any> = { id: idx };
					notebookColumns.forEach((c, cIdx) => {
						obj[c.field] = r[cIdx];
					});
					return obj;
				})
			: frame.data.values.map((r, idx) => {
					const obj: Record<string, any> = { id: idx };
					columns.forEach((c, cIdx) => {
						obj[c.field] = r[cIdx];
					});
					return obj;
				});

	const [localRows, setLocalRows] = useState(rows);
	useEffect(() => {
		setLocalRows(rows);
	}, [JSON.stringify(rows)]);

	useEffect(() => {
		if (localRows && localRows.length > 0 && id && state) {
			// Update the block's data.value
			state.dispatch({
				message: ActionMessages.SET_BLOCK_DATA,
				payload: {
					id,
					path: "value",
					value: localRows,
				},
			});

			// Register or update the variable as before
			if (!state.variables[id]) {
				state.dispatch({
					message: ActionMessages.ADD_VARIABLE,
					payload: {
						id,
						to: id,
						type: "block",
						value: JSON.stringify(localRows),
					},
				});
			} else {
				state.dispatch({
					message: ActionMessages.MODIFY_VARIABLE,
					payload: {
						blockId: id,
						variable: id,
						value: JSON.stringify(localRows),
					},
				});
			}
		}
	}, [localRows, id, state]);

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

	const getRowHeight = (params: any) => {
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

	return (
		<StyledBlock sx={data.style} {...attrs}>
			<div
				style={{
					flex: 1,
					width: "100%",
					height: "100%",
				}}
			>
				<DataGrid
					rows={localRows}
					columns={
						Array.isArray(cellOutput) && cellOutput.length > 0
							? notebookColumns
							: columns
					}
					editMode="cell"
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
					processRowUpdate={(newRow, oldRow) => {
						const updatedRows = localRows.map((row) =>
							row.id === newRow.id ? newRow : row,
						);
						setLocalRows(updatedRows);
						// Update block data and variable as before
						state.dispatch({
							message: ActionMessages.SET_BLOCK_DATA,
							payload: {
								id,
								path: "value",
								value: updatedRows,
							},
						});

						if (state.variables[id]) {
							state.dispatch({
								message: ActionMessages.MODIFY_VARIABLE,
								payload: {
									blockId: id,
									variable: id,
									value: JSON.stringify(updatedRows),
								},
							});
						} else {
							state.dispatch({
								message: ActionMessages.ADD_VARIABLE,
								payload: {
									id,
									to: id,
									type: "block",
									value: JSON.stringify(updatedRows),
								},
							});
						}

						return newRow;
					}}
				/>
			</div>
			<GridBlockContextMenu
				id={id}
				frame={frame}
				contextMenu={contextMenu}
				onClose={() => setContextMenu(null)}
			/>
		</StyledBlock>
	);
});
