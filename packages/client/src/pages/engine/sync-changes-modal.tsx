/** biome-ignore-all lint/correctness/useUniqueElementIds: <explanation> */
import type React from "react";
import { useMemo, useState } from "react";
import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	P,
	Separator,
} from "@semoss/ui/next";

interface SyncChangesModalProps {
	open: boolean;
	onClose: () => void;
	onApply: (selectedTables: string[], selectedViews: string[]) => void;
	tables: string[];
	views: string[];
}

export const SyncChangesModal: React.FC<SyncChangesModalProps> = ({
	open,
	onClose,
	onApply,
	tables,
	views,
}) => {
	const [tableSearch, setTableSearch] = useState("");
	const [viewSearch, setViewSearch] = useState("");
	const [selectedTables, setSelectedTables] = useState<string[]>([]);
	const [selectedViews, setSelectedViews] = useState<string[]>([]);

	const toggleSelection = (
		id: string,
		list: string[],
		setter: (val: string[]) => void,
	) => {
		if (list.includes(id)) {
			setter(list.filter((i) => i !== id));
		} else {
			setter([...list, id]);
		}
	};

	const filteredTables = useMemo(
		() =>
			tables.filter((t) =>
				t.toLowerCase().includes(tableSearch.toLowerCase()),
			),
		[tables, tableSearch],
	);

	const filteredViews = useMemo(
		() =>
			views.filter((v) =>
				v.toLowerCase().includes(viewSearch.toLowerCase()),
			),
		[views, viewSearch],
	);

	const allTablesSelected =
		filteredTables.length > 0 &&
		filteredTables.every((t) => selectedTables.includes(t));

	const allViewsSelected =
		filteredViews.length > 0 &&
		filteredViews.every((v) => selectedViews.includes(v));

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent className="flex max-h-[85vh] max-w-[650px] flex-col gap-0 p-0">
				{/* Header */}
				<DialogHeader className="relative border-border border-b px-6 py-4">
					<DialogTitle className="pr-8 text-lg">
						Sync Changes
					</DialogTitle>
				</DialogHeader>

				{/* Content */}
				<div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
					{/* Description */}
					<div className="flex flex-col gap-2">
						<P className="text-muted-foreground text-sm">
							Select tables and views below to sync with external
							database changes.
						</P>
						<P className="text-muted-foreground text-sm">
							<span className="font-semibold text-foreground">
								Note:
							</span>{" "}
							any local changes made to selected table and view
							properties will be overwritten by sync.
						</P>
					</div>

					<Separator />

					{/* Two Column Layout */}
					<div className="grid grid-cols-2 gap-6">
						{/* Tables Section */}
						<div className="flex flex-col gap-3">
							<P className="font-semibold text-foreground text-sm">
								Select Tables:
							</P>

							<Input
								placeholder="Search..."
								value={tableSearch}
								onChange={(e) => setTableSearch(e.target.value)}
								className="h-9"
								data-testid="sync-changes-table-search"
							/>

							<div className="flex items-center gap-2 px-1">
								<Checkbox
									id="select-all-tables"
									checked={allTablesSelected}
									onCheckedChange={() =>
										setSelectedTables(
											allTablesSelected
												? []
												: filteredTables,
										)
									}
									data-testid="sync-changes-select-all-tables"
								/>
								<Label
									htmlFor="select-all-tables"
									className="cursor-pointer font-normal text-muted-foreground text-sm"
								>
									(Select searched items)
								</Label>
							</div>

							<div className="flex min-h-[300px] flex-col gap-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
								{filteredTables.length === 0 ? (
									<P className="flex flex-1 items-center justify-center py-8 text-center text-muted-foreground text-sm">
										No tables found
									</P>
								) : (
									filteredTables.map((t) => (
										<div
											key={t}
											className="flex items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-accent/50"
										>
											<Checkbox
												id={`table-${t}`}
												checked={selectedTables.includes(
													t,
												)}
												onCheckedChange={() =>
													toggleSelection(
														t,
														selectedTables,
														setSelectedTables,
													)
												}
												data-testid={`sync-changes-table-${t}`}
											/>
											<Label
												htmlFor={`table-${t}`}
												className="flex-1 cursor-pointer font-normal text-sm"
											>
												{t}
											</Label>
										</div>
									))
								)}
							</div>
						</div>

						{/* Views Section */}
						<div className="flex flex-col gap-3">
							<P className="font-semibold text-foreground text-sm">
								Select Views:
							</P>

							<Input
								placeholder="Search..."
								value={viewSearch}
								onChange={(e) => setViewSearch(e.target.value)}
								className="h-9"
								data-testid="sync-changes-view-search"
							/>

							<div className="flex items-center gap-2 px-1">
								<Checkbox
									id="select-all-views"
									checked={allViewsSelected}
									onCheckedChange={() =>
										setSelectedViews(
											allViewsSelected
												? []
												: filteredViews,
										)
									}
									data-testid="sync-changes-select-all-views"
								/>
								<Label
									htmlFor="select-all-views"
									className="cursor-pointer font-normal text-muted-foreground text-sm"
								>
									(Select all)
								</Label>
							</div>

							<div className="flex min-h-[300px] flex-col gap-1 overflow-y-auto rounded-md border border-border bg-muted/30 p-3">
								{filteredViews.length === 0 ? (
									<P className="flex flex-1 items-center justify-center py-8 text-center text-muted-foreground text-sm">
										No views found
									</P>
								) : (
									filteredViews.map((v) => (
										<div
											key={v}
											className="flex items-center gap-2 rounded-sm px-1 py-1.5 hover:bg-accent/50"
										>
											<Checkbox
												id={`view-${v}`}
												checked={selectedViews.includes(
													v,
												)}
												onCheckedChange={() =>
													toggleSelection(
														v,
														selectedViews,
														setSelectedViews,
													)
												}
												data-testid={`sync-changes-view-${v}`}
											/>
											<Label
												htmlFor={`view-${v}`}
												className="flex-1 cursor-pointer font-normal text-sm"
											>
												{v}
											</Label>
										</div>
									))
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Footer */}
				<DialogFooter className="border-border border-t px-6 py-4">
					<div className="flex w-full justify-end gap-3">
						<Button
							variant="outline"
							onClick={onClose}
							className="min-w-[80px]"
							data-testid="sync-changes-cancel-btn"
						>
							Cancel
						</Button>
						<Button
							variant="default"
							onClick={() =>
								onApply(selectedTables, selectedViews)
							}
							disabled={
								selectedTables.length === 0 &&
								selectedViews.length === 0
							}
							className="min-w-[80px]"
							data-testid="sync-changes-apply-btn"
						>
							Apply
						</Button>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
