import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useServerPagination } from "@/hooks";
import type { ExceptionEntry } from "../types";
import { ExceptionRow } from "./exception-row";

const DIALOG_ROWS_PER_PAGE = 8;

const normalizeSearchValue = (value: string) => value.trim().toLowerCase();

export function ExceptionsSection<
	T extends { id: string; name: string; [key: string]: unknown },
>({
	exceptions,
	entityLabel,
	entityOptions,
	renderEntityDetails,
	onAdd,
	onRemove,
	onUpdate,
}: {
	exceptions: ExceptionEntry[];
	entityLabel: string;
	entityOptions: T[];
	renderEntityDetails: (entity: T) => React.ReactNode;
	onAdd: (entity: T) => void;
	onRemove: (id: string) => void;
	onUpdate: (id: string, updates: Partial<ExceptionEntry>) => void;
}) {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [selectedEntity, setSelectedEntity] = useState("");
	const [searchTerm, setSearchTerm] = useState("");

	const availableOptions = entityOptions.filter(
		(o) => !exceptions.some((e) => e.entityId === o.id),
	);

	const filteredOptions = useMemo(() => {
		const normalizedSearch = normalizeSearchValue(searchTerm);
		if (!normalizedSearch) {
			return availableOptions;
		}
		return availableOptions.filter((entity) =>
			`${entity.name} ${entity.id}`
				.toLowerCase()
				.includes(normalizedSearch),
		);
	}, [availableOptions, searchTerm]);

	const {
		page,
		rowsPerPage,
		setPage,
		setRowsPerPage,
		startRow,
		endRow,
		totalPages,
	} = useServerPagination({
		totalCount: filteredOptions.length,
		initialRowsPerPage: DIALOG_ROWS_PER_PAGE,
		pageIndexBase: 0,
	});

	const pagedOptions = useMemo(
		() =>
			filteredOptions.slice(
				page * rowsPerPage,
				page * rowsPerPage + rowsPerPage,
			),
		[filteredOptions, page, rowsPerPage],
	);

	useEffect(() => {
		if (page > totalPages - 1) {
			setPage(Math.max(0, totalPages - 1));
		}
	}, [page, setPage, totalPages]);

	return (
		<div className="mt-4 rounded-lg border p-4">
			<div className="mb-3 flex items-center justify-between">
				<h4 className="font-medium text-sm">Exceptions</h4>
				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowAddDialog(true)}
					disabled={availableOptions.length === 0}
				>
					<Plus className="mr-1 size-3" /> Add Exception
				</Button>
			</div>
			{exceptions.length === 0 ? (
				<p className="text-muted-foreground text-xs">
					No exceptions configured. The limits above apply to all{" "}
					{entityLabel.toLowerCase()}s.
				</p>
			) : (
				<div className="flex flex-col gap-2">
					{exceptions.map((ex) => (
						<ExceptionRow
							key={ex.entityId}
							exception={ex}
							onRemove={() => onRemove(ex.entityId)}
							onUpdate={(updates) =>
								onUpdate(ex.entityId, updates)
							}
						/>
					))}
				</div>
			)}

			<Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Add {entityLabel} Exception</DialogTitle>
					</DialogHeader>
					<div className="flex flex-col gap-3 py-2">
						<Input
							placeholder={`Search ${entityLabel.toLowerCase()}s...`}
							value={searchTerm}
							onChange={(e) => {
								setSearchTerm(e.target.value);
								setPage(0);
							}}
						/>
						<div className="flex max-h-64 flex-col gap-2 overflow-y-auto">
							{pagedOptions.length === 0 ? (
								<p className="text-muted-foreground text-sm">
									No {entityLabel.toLowerCase()}s match the
									current search.
								</p>
							) : (
								pagedOptions.map((entity) => (
									<button
										type="button"
										key={entity.id}
										className={`w-full cursor-pointer rounded-lg border p-3 text-left transition-colors hover:bg-accent ${
											selectedEntity === entity.id
												? "border-primary bg-accent"
												: ""
										}`}
										onClick={() =>
											setSelectedEntity(entity.id)
										}
									>
										{renderEntityDetails(entity)}
									</button>
								))
							)}
						</div>
						<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border px-3 py-2 text-xs">
							<div>
								Showing {startRow}-{endRow} of{" "}
								{filteredOptions.length}
							</div>
							<div className="flex items-center gap-2">
								<Label className="text-xs">Rows:</Label>
								<Select
									value={String(rowsPerPage)}
									onValueChange={(value) =>
										setRowsPerPage(Number(value))
									}
								>
									<SelectTrigger className="h-8 w-20">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[5, 10, 20, 50].map((value) => (
											<SelectItem
												key={value}
												value={String(value)}
											>
												{value}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage(page - 1)}
									disabled={page <= 0}
								>
									Previous
								</Button>
								<div className="min-w-14 text-center text-xs">
									{page + 1} / {totalPages}
								</div>
								<Button
									variant="outline"
									size="sm"
									onClick={() => setPage(page + 1)}
									disabled={page >= totalPages - 1}
								>
									Next
								</Button>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setShowAddDialog(false);
								setSelectedEntity("");
								setSearchTerm("");
								setPage(0);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={!selectedEntity}
							onClick={() => {
								const entity = entityOptions.find(
									(o) => o.id === selectedEntity,
								);
								if (entity) {
									onAdd(entity);
								}
								setSelectedEntity("");
								setSearchTerm("");
								setPage(0);
								setShowAddDialog(false);
							}}
						>
							Add as Exception
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
