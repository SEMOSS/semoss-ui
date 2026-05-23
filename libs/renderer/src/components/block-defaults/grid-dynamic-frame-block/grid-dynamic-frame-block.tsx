// biome-ignore-all lint/a11y/noStaticElementInteractions: table cell context menu — keyboard events not applicable

import {
	ArrowDown,
	ArrowUp,
	ArrowUpDown,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { type CSSProperties, useEffect, useMemo, useState } from "react";
import {
	Button,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@semoss/ui/next";
import { getContextMenuPosition } from "@/components/shared/common";
import { useBlock, useFrame, useFrameHeaders } from "../../../hooks";
import type { BlockComponent, BlockDef } from "../../../store";
import type { GridBlockColumn } from "../grid-block/grid-block.types";
import { GridBlockContextMenu } from "../grid-block/grid-block-context-menu";

const DEFAULT_HEIGHT = "300px";
const DEFAULT_WIDTH = "500px";

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
	// biome-ignore lint/correctness/useExhaustiveDependencies: intentional — sync only on header list change
	useEffect(() => {
		if (data.columns.length === 0 && !frameHeaders.isLoading) {
			// If no columns are defined, fetch the frame headers
			if (frameHeaders.data.list.length > 0) {
				syncBlockDataColumns(frameHeaders);
			}
		}
	}, [frameHeaders?.data?.list]);

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
		const { finalMouseX, finalMouseY } = getContextMenuPosition(
			event.clientX + 2,
			event.clientY - 6,
		);
		// open the menu and save the data
		setContextMenu(
			contextMenu === null
				? {
						mouseX: finalMouseX,
						mouseY: finalMouseY,
						column: column,
						value: value,
					}
				: // repeated contextmenu when it is already open closes it with Chrome 84 on Ubuntu
					// Other native context menus might behave different.
					// With this behavior we prevent contextmenu from the backdrop to re-locale existing context menus.
					null,
		);
	};

	const [sortConfig, setSortConfig] = useState<{
		field: string;
		direction: "asc" | "desc";
	} | null>(null);

	const handleSort = (field: string) => {
		setSortConfig((prev) => {
			if (prev?.field === field) {
				if (prev.direction === "asc") {
					return { field, direction: "desc" };
				}
				return null;
			}
			return { field, direction: "asc" };
		});
	};

	const rows = frame.data.values.map((r, idx) => {
		const obj: Record<string, unknown> = { id: idx };
		data.columns.forEach((c, cIdx) => {
			obj[c.name] = r[cIdx];
		});
		return obj;
	});

	const sortedRows = useMemo(() => {
		if (!sortConfig) return rows;
		return [...rows].sort((a, b) => {
			const aVal = a[sortConfig.field];
			const bVal = b[sortConfig.field];
			if (aVal == null && bVal == null) return 0;
			if (aVal == null) return 1;
			if (bVal == null) return -1;
			if (typeof aVal === "number" && typeof bVal === "number") {
				return sortConfig.direction === "asc"
					? aVal - bVal
					: bVal - aVal;
			}
			const aStr = String(aVal);
			const bStr = String(bVal);
			const cmp = aStr.localeCompare(bStr);
			return sortConfig.direction === "asc" ? cmp : -cmp;
		});
	}, [rows, sortConfig]);

	const handlePaginationModalChange = (newmodel: {
		page: number;
		pageSize: number;
	}) => {
		if (newmodel.pageSize !== paginationModel.pageSize) {
			setPaginationModel({ page: 0, pageSize: newmodel.pageSize });
		} else {
			setPaginationModel(newmodel);
		}
	};

	// Pagination display values
	const totalRows = frame.count ?? 0;
	const startRow =
		totalRows > 0 ? paginationModel.page * paginationModel.pageSize + 1 : 0;
	const endRow = Math.min(
		(paginationModel.page + 1) * paginationModel.pageSize,
		totalRows,
	);
	const totalPages = Math.max(
		1,
		Math.ceil(totalRows / paginationModel.pageSize),
	);

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: DEFAULT_HEIGHT,
				width: DEFAULT_WIDTH,
				...data.style,
			}}
			{...attrs}
		>
			<div
				className="flex flex-col border"
				style={{ flex: 1, width: "100%", height: "100%" }}
			>
				{/* Table */}
				<div className="relative flex-1 overflow-auto">
					<Table className="min-w-full">
						<TableHeader>
							<TableRow className="hover:bg-transparent">
								{data.columns.map((col) => (
									<TableHead
										key={col.name}
										className="sticky top-0 z-10 cursor-pointer select-none bg-background"
										style={{ height: 50, padding: 0 }}
										onClick={() => handleSort(col.name)}
									>
										<div
											className="flex items-center gap-1"
											style={{
												padding: "8px",
												width: "100%",
												fontWeight: "bold",
											}}
										>
											{col.name}
											{sortConfig?.field === col.name ? (
												sortConfig.direction ===
												"asc" ? (
													<ArrowUp className="size-3.5 shrink-0" />
												) : (
													<ArrowDown className="size-3.5 shrink-0" />
												)
											) : (
												<ArrowUpDown className="size-3.5 shrink-0 opacity-30" />
											)}
										</div>
									</TableHead>
								))}
							</TableRow>
						</TableHeader>
						<TableBody>
							{sortedRows.length > 0 &&
								sortedRows.map((row) => (
									<TableRow key={row.id as number}>
										{data.columns.map((col) => {
											const cellValue = row[col.name];
											return (
												<TableCell
													key={col.name}
													className="p-0"
												>
													<div
														style={{
															padding: "8px",
														}}
														onContextMenu={(e) =>
															handleTableCellOnContextMenu(
																e,
																col,
																cellValue,
															)
														}
													>
														{cellValue != null
															? String(cellValue)
															: ""}
													</div>
												</TableCell>
											);
										})}
									</TableRow>
								))}
						</TableBody>
					</Table>
					{sortedRows.length === 0 && (
						<div className="pointer-events-none absolute inset-0 flex items-center justify-center">
							<span className="text-lg text-muted-foreground">
								No rows
							</span>
						</div>
					)}
				</div>

				{/* Pagination */}
				<div className="flex items-center justify-between border-t px-3 py-1.5 text-sm">
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground">
							Rows per page:
						</span>
						<Select
							value={String(paginationModel.pageSize)}
							onValueChange={(val) =>
								handlePaginationModalChange({
									page: 0,
									pageSize: Number(val),
								})
							}
						>
							<SelectTrigger size="sm" className="w-16">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{[10, 50, 100].map((size) => (
									<SelectItem key={size} value={String(size)}>
										{size}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<span className="text-muted-foreground">
						{startRow}–{endRow} of {totalRows}
					</span>
					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={paginationModel.page === 0}
							onClick={() =>
								handlePaginationModalChange({
									page: paginationModel.page - 1,
									pageSize: paginationModel.pageSize,
								})
							}
						>
							<ChevronLeft className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="size-8"
							disabled={paginationModel.page >= totalPages - 1}
							onClick={() =>
								handlePaginationModalChange({
									page: paginationModel.page + 1,
									pageSize: paginationModel.pageSize,
								})
							}
						>
							<ChevronRight className="size-4" />
						</Button>
					</div>
				</div>
				<div style={{ display: "inline" }}>
					<GridBlockContextMenu
						id={id}
						frame={frame}
						contextMenu={contextMenu}
						onClose={() => setContextMenu(null)}
					/>
				</div>
			</div>
		</div>
	);
});
