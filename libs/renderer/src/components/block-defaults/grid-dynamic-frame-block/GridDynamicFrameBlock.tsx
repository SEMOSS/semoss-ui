import { styled } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useState } from "react";
import { useBlock, useFrame, useFrameHeaders } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";
import { GridBlockContextMenu } from "../grid-block/GridBlockContextMenu";
import type { GridBlockColumn } from "../grid-block/grid-block.types";

const DEFAULT_HEIGHT = "300px";
const DEFAULT_WIDTH = "500px";

const StyledBlock = styled("div")(() => ({
	display: "flex",
	flexDirection: "column",
	height: DEFAULT_HEIGHT,
	width: DEFAULT_WIDTH,
}));

const StyledHeader = styled("div")(({ theme }) => ({
	padding: theme.spacing(1),
}));

const StyledRow = styled("div")(({ theme }) => ({
	padding: theme.spacing(1),
}));

export interface GridDynamicFrameBlockDef
	extends BlockDef<"grid-dynamic-frame"> {
	widget: "grid-dynamic-frame";

	/** data associated with the block */
	data: {
		/** Bind the grid to a frame */
		frame: {
			name: string;
		};

		/** Column Definitions */
		columns: GridBlockColumn[];

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

		/**
		 * Hide or show block
		 */
		show: boolean;

		/**
		 * width and height
		 */
		style: CSSProperties;
	};
}

export const GridDynamicFrameBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, setData } = useBlock<GridDynamicFrameBlockDef>(id);
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

	const columns = data.columns.map((col) => ({
		field: col.name,
		headerName: col.name,
		sortable: false,
		renderHeader: () => <StyledHeader>{col.name}</StyledHeader>,
		renderCell: (params) => {
			return (
				<StyledRow
					onContextMenu={(e) =>
						handleTableCellOnContextMenu(e, col, params.value)
					}
				>
					{params.value}
				</StyledRow>
			);
		},
	}));

	const rows = frame.data.values.map((r, idx) => {
		const obj: Record<string, unknown> = { id: idx };
		columns.forEach((c, cIdx) => {
			obj[c.field] = r[cIdx];
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
					rows={rows}
					columns={columns}
					pagination
					density="compact"
					paginationMode="server"
					rowCount={frame.count}
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationModalChange}
					pageSizeOptions={[10, 50, 100]}
					columnHeaderHeight={50}
					disableColumnMenu
					disableRowSelectionOnClick
					disableColumnSorting
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
