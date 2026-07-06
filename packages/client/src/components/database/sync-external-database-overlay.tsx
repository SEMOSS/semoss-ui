import { AlertCircleIcon } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	AlertTitle,
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Muted,
	ScrollArea,
	Spinner,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

interface SyncExternalDatabaseOverlayProps {
	/** engine to load */
	engine: string;

	/** Selected tables */
	tables: string[];

	/** Selected views */
	views: string[];

	/** Track if open */
	open: boolean;

	/** Callback triggered when the dialog is closed */
	onClose: (
		success: boolean,
		data?: { tables: string[]; views: string[] },
	) => void;
}

export const SyncExternalDatabaseOverlay: React.FC<
	SyncExternalDatabaseOverlayProps
> = ({ engine, tables = [], views = [], open, onClose }) => {
	const { configStore } = useRootStore();

	const [tableSearch, setTableSearch] = useState("");
	const [viewSearch, setViewSearch] = useState("");
	const [selectedTables, setSelectedTables] = useState<string[]>(tables);
	const [selectedViews, setSelectedViews] = useState<string[]>(views);

	const getTablesAndViews = usePixel<{
		tables: string[];
		views: string[];
	}>(
		open
			? `ExternalUpdateJdbcTablesAndViews(database=["${engine}"]);`
			: null,
		{
			onSuccess: (data) => {
				const t = tables.filter((t) => data.tables.includes(t));
				setSelectedTables(t);

				const v = views.filter((v) => data.views.includes(v));
				setSelectedViews(v);
			},
		},
		configStore.store.insightID,
	);

	const filteredTables = useMemo(() => {
		if (getTablesAndViews.status !== "SUCCESS") {
			return [];
		}

		if (tableSearch.length === 0) {
			return getTablesAndViews.data.tables;
		}

		return getTablesAndViews.data.tables.filter((t) =>
			t.toLowerCase().includes(tableSearch.toLowerCase()),
		);
	}, [getTablesAndViews.status, getTablesAndViews.data?.tables, tableSearch]);

	const filteredViews = useMemo(() => {
		if (getTablesAndViews.status !== "SUCCESS") {
			return [];
		}

		if (viewSearch.length === 0) {
			return getTablesAndViews.data.views;
		}

		return getTablesAndViews.data.views.filter((v) =>
			v.toLowerCase().includes(viewSearch.toLowerCase()),
		);
	}, [getTablesAndViews.status, getTablesAndViews.data?.views, viewSearch]);

	const allTablesSelected =
		filteredTables.length > 0 &&
		filteredTables.every((t) => selectedTables.includes(t));

	const allViewsSelected =
		filteredViews.length > 0 &&
		filteredViews.every((v) => selectedViews.includes(v));

	return (
		<Dialog open={open} onOpenChange={() => onClose(false)}>
			<DialogContent
				aria-describedby="sync database changes to the metamodel"
				className="sm:max-w-2xl"
			>
				{/* Header */}

				<DialogHeader>
					<DialogTitle> Sync Changes</DialogTitle>
					<DialogDescription>
						Select tables and views below to sync with external
						database changes.
					</DialogDescription>
				</DialogHeader>

				<Alert className="flex items-start gap-3 text-left">
					<AlertCircleIcon className="mt-0.5 shrink-0" />
					<div className="flex flex-col gap-0.5">
						<AlertTitle>Note</AlertTitle>
						<AlertDescription>
							Local changes will be overwritten by sync.
						</AlertDescription>
					</div>
				</Alert>

				<div className="grid grid-cols-2 gap-6">
					{/* Tables Section */}
					<FieldGroup className="gap-3">
						<Field>
							<FieldLabel>Tables:</FieldLabel>
							<Input
								placeholder="Search"
								value={tableSearch}
								onChange={(e) => setTableSearch(e.target.value)}
								data-testid="sync-changes-table-search"
							/>
						</Field>
						<div className="flex h-64 flex-col rounded-md border border-input bg-transparent">
							{getTablesAndViews.status === "LOADING" && (
								<div className="flex w-full flex-1 items-center justify-center">
									<Spinner />
								</div>
							)}
							{getTablesAndViews.status === "SUCCESS" &&
								filteredTables.length === 0 && (
									<div className="flex w-full flex-1 items-center justify-center">
										<Muted>No tables found</Muted>
									</div>
								)}

							{getTablesAndViews.status === "SUCCESS" &&
								filteredTables.length > 0 && (
									<ScrollArea className="h-full w-full flex-1">
										<FieldGroup className="gap-3 p-3">
											<Field orientation="horizontal">
												<Checkbox
													name="table-select-checkbox"
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
												<FieldLabel
													htmlFor="table-select-checkbox"
													className="text-muted-foreground"
												>
													(Select
													{tableSearch
														? " searched"
														: " all"}
													)
												</FieldLabel>
											</Field>

											{filteredTables.map((t) => {
												const isSelected =
													selectedTables.includes(t);

												return (
													<Field
														key={t}
														orientation="horizontal"
													>
														<Checkbox
															id={`sync-external-database-overlay--table-${t}`}
															checked={isSelected}
															onCheckedChange={() => {
																if (
																	isSelected
																) {
																	setSelectedTables(
																		(
																			prev,
																		) =>
																			prev.filter(
																				(
																					i,
																				) =>
																					i !==
																					t,
																			),
																	);
																} else {
																	setSelectedTables(
																		(
																			prev,
																		) => [
																			...prev,
																			t,
																		],
																	);
																}
															}}
															data-testid={`sync-changes-table-${t}`}
														/>
														<FieldLabel
															className="font-normal"
															htmlFor={`sync-external-database-overlay--table-${t}`}
														>
															{t}
														</FieldLabel>
													</Field>
												);
											})}
										</FieldGroup>
									</ScrollArea>
								)}
						</div>
					</FieldGroup>

					{/* Views Section */}
					<FieldGroup className="gap-3">
						<Field>
							<FieldLabel>Views:</FieldLabel>
							<Input
								placeholder="Search"
								value={viewSearch}
								onChange={(e) => setViewSearch(e.target.value)}
								data-testid="sync-changes-view-search"
							/>
						</Field>
						<div className="flex h-64 flex-col rounded-md border border-input bg-transparent">
							{getTablesAndViews.status === "LOADING" && (
								<div className="flex w-full flex-1 items-center justify-center">
									<Spinner />
								</div>
							)}
							{getTablesAndViews.status === "SUCCESS" &&
								filteredViews.length === 0 && (
									<div className="flex w-full flex-1 items-center justify-center">
										<Muted>No views found</Muted>
									</div>
								)}

							{getTablesAndViews.status === "SUCCESS" &&
								filteredViews.length > 0 && (
									<ScrollArea className="h-full w-full flex-1">
										<FieldGroup className="gap-3 p-3">
											<Field orientation="horizontal">
												<Checkbox
													name="table-select-checkbox"
													checked={allViewsSelected}
													onCheckedChange={() =>
														setSelectedViews(
															allViewsSelected
																? []
																: filteredViews,
														)
													}
													data-testid="sync-changes-select-all-tables"
												/>
												<FieldLabel
													htmlFor="table-select-checkbox"
													className="text-muted-foreground"
												>
													(Select
													{tableSearch
														? " searched"
														: " all"}
													)
												</FieldLabel>
											</Field>

											{filteredViews.map((v) => {
												const isSelected =
													selectedViews.includes(v);

												return (
													<Field
														key={v}
														orientation="horizontal"
													>
														<Checkbox
															id={`sync-external-database-overlay--view-${v}`}
															checked={isSelected}
															onCheckedChange={() => {
																if (
																	isSelected
																) {
																	setSelectedViews(
																		(
																			prev,
																		) =>
																			prev.filter(
																				(
																					i,
																				) =>
																					i !==
																					v,
																			),
																	);
																} else {
																	setSelectedViews(
																		(
																			prev,
																		) => [
																			...prev,
																			v,
																		],
																	);
																}
															}}
															data-testid={`sync-changes-view-${v}`}
														/>
														<FieldLabel
															className="font-normal"
															htmlFor={`sync-external-database-overlay--view-${v}`}
														>
															{v}
														</FieldLabel>
													</Field>
												);
											})}
										</FieldGroup>
									</ScrollArea>
								)}
						</div>
					</FieldGroup>
				</div>

				<DialogFooter>
					<Button
						variant="ghost"
						onClick={() => onClose(false)}
						data-testid="sync-changes-cancel-btn"
					>
						Cancel
					</Button>
					<Button
						variant="default"
						onClick={() =>
							onClose(true, {
								tables: selectedTables,
								views: selectedViews,
							})
						}
						disabled={
							selectedTables.length === 0 &&
							selectedViews.length === 0
						}
						data-testid="sync-changes-apply-btn"
					>
						Sync
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
