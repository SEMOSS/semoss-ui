import { styled } from "@mui/material";
import { DataGrid, GridToolbarContainer } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { useBlock, useBlocks, useFrame, useFrameHeaders } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";
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
		source?: string | any[][];
	};
}

export const GridBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData } = useBlock<GridBlockDef>(id);
	const { state } = useBlocks();
	const [paginationModel, setPaginationModel] = useState({
		page: 0,
		pageSize: 50,
	});
	
	let maxColCount = 0;
	if (
		Array.isArray(data.source) &&
		data.source.length > 0 &&
		Array.isArray(data.source[0])
	) {
		maxColCount = data.source.reduce(
			(max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max),
			0
		);
		//Generate columns if not present
		if (data.columns.length === 0) {
			const generatedColumns = [];
			for (let i = 0; i < maxColCount; i++) {
			generatedColumns.push({ name: `col${i}` });
			}
			data.columns = generatedColumns;
			
		}
	}

	// Now, map variableRows, padding each row to maxColCount
	let variableRows: any[] | null = null;
	if (
		Array.isArray(data.source) &&
		data.source.length > 0 &&
		Array.isArray(data.source[0])
	) {
	variableRows = data.source.map((rowArr, idx) => {
		const obj: Record<string, unknown> = { id: idx };
		// Pad the row to maxColCount
		const paddedRow = [...rowArr];
		while (paddedRow.length < maxColCount) {
		paddedRow.push(""); // or null, or undefined, as you prefer
		}
		data.columns.forEach((col, cIdx) => {
		obj[col.name] = paddedRow[cIdx];
		});
		return obj;
	});
	} 
	
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

	const columns = data.columns.map((col) => ({
		field: col.name,
		headerName: col.name,
		sortable: false,
		editable: data.source ? true : false,
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

	const rows = variableRows !== null
    ? variableRows
    : frame.data.values.map((r, idx) => {
        const obj: Record<string, unknown> = { id: idx };
        columns.forEach((c, cIdx) => {
            obj[c.field] = r[cIdx];
        });
        return obj;
    });

	const [localRows, setLocalRows] = useState(rows);
	useEffect(() => {
		setLocalRows(rows);
	}, [JSON.stringify(rows)]);

	const handleProcessRowUpdate = (newRow, _oldRow) => {
	  setLocalRows(prev => {
			const updatedRows = prev.map(row => (row.id === newRow.id ? newRow : row));
			const hasColumns = Array.isArray(data.columns) && data.columns.length > 0;
			if (hasColumns) {
				const updatedSource = updatedRows.map(row => data.columns.map(col => row[col.name]));
				setData("source", updatedSource);
				if (id) {
					state.variables[id] = {
						type: "array",
						value: updatedSource,
					};
				}
			}
			return updatedRows;
		});
		return newRow;
	};

	useEffect(() => {
		if (localRows && id) {
			state.variables[id] = {
				type: "array",
				value: localRows.map(row => data.columns.map(col => row[col.name])),
			};
		}
	}, [id, localRows, data.columns]);

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

	return (
		<StyledBlock sx={data.style} {...attrs}>
			<StyledDataGridContainer>
				<DataGrid
					rows={localRows}
					processRowUpdate={handleProcessRowUpdate}
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
