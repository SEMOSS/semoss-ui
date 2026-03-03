import type { AxiosResponse } from "axios";
import { Plus, Search, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from "@semoss/ui/next";
import {
	addEnginePermission,
	deleteEnginePermission,
	editEnginePermission,
	getNumEnginesForGroup,
	getTeamEngines,
	getUnassignedTeamEngines,
} from "@/api";
import type { SETTINGS_ROLE } from "@/components/settings/settings.types";

const colors = [
	"#22A4FF",
	"#FA3F20",
	"#FA3F20",
	"#FF9800",
	"#FF9800",
	"#22A4FF",
	"#4CAF50",
];

// maps for permissions,
const permissionMapper = {
	Author: 1, // BE: 'DISPLAY'
	Editor: 2, // BE: 'DISPLAY'
	"Read-Only": 3, // DISPLAY: BE
};

const permissionOptions: {
	label: SETTINGS_ROLE;
	description: string;
	value: string;
}[] = [
	{
		label: "Author",
		description:
			"Ability to edit the model connection details, set the model as discoverable, provision other authors, and all editor abilities.",
		value: "Author",
	},
	{
		label: "Editor",
		description:
			"Ability to edit the model details, provision other users as editors and read only users, and all read only abilities.",
		value: "Editor",
	},
	{
		label: "Read-Only",
		description: "Ability to view model details and usage instructions.",
		value: "Read-Only",
	},
];

interface EnginesTableProps {
	/**
	 * Id of the setting
	 */
	groupId: string;

	/**
	 * group type
	 */
	groupType: string;

	name: string;
}

interface Engine {
	engine_name: string;
	engine_id: string;
	engineid: string;
	engine_type: string;
	engine_date_created: string;
	permission: string;
	type: string;
	color?: string;
}

type EnginePermissionUpdate = Pick<Engine, "engineid" | "permission" | "type">;

export const TeamEnginesTable = (props: EnginesTableProps) => {
	const { groupId, groupType } = props;

	const AUTOCOMPLETE_LIMIT = 10;
	const AUTOCOMPLETE_OFFSET = 0;

	/** Engine Table State */
	const [enginesPage, setEnginesPage] = useState<number>(1);
	const [selectedEngines, setSelectedEngines] = useState<Engine[]>([]);
	const [count, setCount] = useState(0);

	/** Delete Engine */
	const [deleteEnginesModal, setDeleteEnginesModal] =
		useState<boolean>(false);
	const [deleteEngineModal, setDeleteEngineModal] = useState<boolean>(false);
	const [engineToDelete, setEngineToDelete] = useState<Engine | null>(null);

	/** Add Engine State */
	const [addEngineModal, setAddEngineModal] = useState<boolean>(false);
	const [nonCredentialedEngines, setNonCredentialedEngines] = useState<
		Engine[]
	>([]);
	const [selectedNonCredentialedEngines, setSelectedNonCredentialedEngines] =
		useState<Engine[]>([]);
	const [addEngineRole, setAddEngineRole] = useState<SETTINGS_ROLE>();

	const [engines, setEngines] = useState<Engine[]>([]);
	const [enginesCount, setEngineCount] = useState<number>(0);
	const [totalEnginesAll, setTotalEnginesAll] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [hasEngines, setHasEngines] = useState(false);

	const [searchEngineInput, setSearchEngineInput] = useState<string>("");
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [canCollect, setCanCollect] = useState<boolean>(true);
	const [_isLoading, setIsLoading] = useState<boolean>(false);
	const [searchLoading, setSearchLoading] = useState(false);

	const [searchFilter, setSearchFilter] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const isLoadingRef = useRef(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchFilter);
		}, 400);
		return () => clearTimeout(timer);
	}, [searchFilter]);

	const nearBottom = (
		target: {
			scrollHeight?: number;
			scrollTop?: number;
			clientHeight?: number;
		} = {},
	) => {
		const diff = Math.round(target.scrollHeight - target.scrollTop);
		return diff - 25 <= target.clientHeight;
	};

	const getEngines = useCallback(
		async (reset: boolean, nextOffset: number, nextSearch: string) => {
			if (isLoadingRef.current) {
				return;
			}
			isLoadingRef.current = true;
			setIsLoading(true);
			try {
				const response = await getUnassignedTeamEngines(
					groupId,
					groupType,
					AUTOCOMPLETE_LIMIT,
					nextOffset,
					nextSearch,
				);

				if (response) {
					const engines = (response as Engine[]).map(
						(val: Engine) => {
							return {
								...val,
								color: colors[
									Math.floor(Math.random() * colors.length)
								],
							};
						},
					);

					setNonCredentialedEngines((prev) =>
						reset ? engines : prev.concat(engines),
					);
					setCanCollect(engines.length === AUTOCOMPLETE_LIMIT);
					setSearchLoading(false);
				}
			} catch (e) {
				toast.error(String(e));
				setSearchLoading(false);
			} finally {
				isLoadingRef.current = false;
				setIsLoading(false);
			}
		},
		[groupId, groupType],
	);

	const filterEngines = useCallback(() => {
		getTeamEngines(
			groupId,
			groupType,
			rowsPerPage,
			enginesPage * rowsPerPage - rowsPerPage, // offset
			debouncedSearch,
		).then((data: unknown[]) => {
			setEngines(data as Engine[]);
			setHasEngines(data.length > 0);
		});
	}, [groupId, groupType, enginesPage, debouncedSearch, rowsPerPage]);

	useEffect(() => {
		if (count >= 0) {
			filterEngines();
		}
	}, [filterEngines, count]);

	useEffect(() => {
		const refreshToken = count;
		if (refreshToken < 0 || !groupId) {
			return;
		}
		const trimmed = debouncedSearch.trim();
		getNumEnginesForGroup(groupId, groupType, trimmed || undefined)
			.then((nextCount) => {
				if (trimmed) {
					setEngineCount(nextCount);
				} else {
					setTotalEnginesAll(nextCount);
					setEngineCount(nextCount);
				}
			})
			.catch((e) => {
				toast.error(String(e));
				if (trimmed) {
					setEngineCount(0);
				} else {
					setTotalEnginesAll(0);
					setEngineCount(0);
				}
			});
	}, [groupId, groupType, debouncedSearch, count]);

	useEffect(() => {
		if (!addEngineModal) {
			return;
		}
		if (isScrollBottom) {
			if (canCollect) {
				setOffset((prev) => prev + AUTOCOMPLETE_LIMIT);
			}
		}
	}, [addEngineModal, isScrollBottom, canCollect]);

	useEffect(() => {
		if (!addEngineModal) {
			return;
		}
		if (searchEngineInput) {
			setSearchLoading(true);
		}
		const timer = setTimeout(() => {
			if (!offset) {
				getEngines(true, 0, searchEngineInput);
			} else {
				if (canCollect) {
					getEngines(false, offset, searchEngineInput);
				} else {
					getEngines(true, offset, searchEngineInput);
				}
			}
		}, 500);
		return () => clearTimeout(timer);
	}, [addEngineModal, offset, searchEngineInput, canCollect, getEngines]);

	const submitNonGroupEngines = async () => {
		try {
			const requests = selectedNonCredentialedEngines.map((m) => {
				return {
					engine_id: m.engine_id,
					permission: permissionMapper[addEngineRole],
				};
			});

			if (requests.length === 0) {
				toast.warning("No engines to add");
				return;
			}

			for (let i = 0; i < requests.length; i++) {
				let response:
					| AxiosResponse<{ success: boolean }>
					| {
							response: Response;
							data: {
								success: boolean;
							};
					  }
					| null = null;
				response = await addEnginePermission(
					groupId,
					requests[i].engine_id,
					requests[i].permission,
					groupType,
				);

				if (!response) {
					return;
				}

				if (response.data) {
					setAddEngineModal(false);
					setSelectedNonCredentialedEngines([]);
					toast.success("Successfully added engine permission");
				} else {
					toast.error("Error adding engine permission");
				}
			}
		} catch (e) {
			setAddEngineModal(false);
			setSelectedNonCredentialedEngines([]);
			toast.error(String(e));
		} finally {
			setCount((prev) => prev + 1);
			setOffset(0);
		}
	};

	const deleteEngine = async (engine: Engine) => {
		try {
			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await deleteEnginePermission(groupId, groupType, engine);

			if (!response) {
				return;
			}

			toast.success("Successfully removed engine");
		} catch (e) {
			toast.error(String(e));
		} finally {
			setDeleteEngineModal(false);
			setCount((prev) => prev + 1);
		}
	};

	const deleteEngines = async () => {
		try {
			for (let i = 0; i < selectedEngines.length; i++) {
				try {
					let response:
						| AxiosResponse<{ success: boolean }>
						| {
								response: Response;
								data: {
									success: boolean;
								};
						  }
						| null = null;
					response = await deleteEnginePermission(
						groupId,
						groupType,
						selectedEngines[i],
					);

					if (!response) {
						return;
					}
				} catch (e) {
					toast.error(String(e));
				} finally {
					setDeleteEngineModal(false);
				}
			}
		} finally {
			toast.success("Successfully removed engines");
			setCount((prev) => prev + 1);
			setDeleteEnginesModal(false);
			setSelectedEngines([]);
		}
	};

	const updateSelectedEngines = async (engine: EnginePermissionUpdate) => {
		try {
			if (!engine.engineid) {
				toast.warning("No permissions to change");
				return;
			}

			let response:
				| AxiosResponse<{ success: boolean }>
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			response = await editEnginePermission(groupId, engine);

			if (!response) {
				return;
			}

			if (response.data) {
				setEngines((prev) =>
					prev.map((item) =>
						item.engineid === engine.engineid
							? { ...item, permission: engine.permission }
							: item,
					),
				);
				toast.success("Successfully updated permissions");
			} else {
				toast.error("Error changing permissions");
			}
		} catch (e) {
			toast.error(String(e));
		}
	};

	const handleInputChange = (newInputValue) => {
		setSearchFilter(newInputValue);
	};

	const totalPages = Math.max(1, Math.ceil(enginesCount / rowsPerPage));
	const startRow =
		enginesCount === 0 ? 0 : (enginesPage - 1) * rowsPerPage + 1;
	const endRow = Math.min(enginesPage * rowsPerPage, enginesCount);

	useEffect(() => {
		if (enginesPage > totalPages) {
			setEnginesPage(totalPages);
		}
	}, [enginesPage, totalPages]);

	const isAllSelected =
		selectedEngines.length === engines.length && engines.length > 0;

	return (
		<div className="flex w-full flex-col gap-6">
			{(engines && engines.length > 0) ||
			enginesCount > 0 ||
			hasEngines ||
			searchFilter ? (
				<Card>
					<CardHeader className="flex flex-col gap-4">
						<div className="flex flex-wrap items-center gap-3">
							<CardTitle>Engines</CardTitle>
							<span className="text-muted-foreground text-sm">
								{debouncedSearch.trim()
									? `${enginesCount} of ${totalEnginesAll} Engines`
									: `${totalEnginesAll} Engines`}
							</span>
						</div>
						<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
							<InputGroup className="w-full sm:max-w-sm">
								<InputGroupAddon>
									<Search className="size-4" />
								</InputGroupAddon>
								<InputGroupInput
									placeholder="Search Engines"
									value={searchFilter}
									onChange={(e) => {
										handleInputChange(e.target.value);
									}}
								/>
							</InputGroup>
							<div className="flex items-center gap-2 sm:flex-nowrap">
								<Button
									className="shrink-0"
									onClick={() => {
										setAddEngineRole(undefined);
										setOffset(0);
										setNonCredentialedEngines([]);
										setSearchEngineInput("");
										setAddEngineModal(true);
									}}
								>
									<Plus className="size-4" />
									Add Engines
								</Button>
								{selectedEngines.length > 0 && (
									<Button
										variant="outline"
										className="whitespace-nowrap border-destructive text-destructive hover:bg-destructive/10"
										onClick={() =>
											setDeleteEnginesModal(true)
										}
									>
										<Trash2 className="size-4" />
										Delete Selected
									</Button>
								)}
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-12">
											<div className="flex justify-center">
												<Checkbox
													checked={isAllSelected}
													onCheckedChange={() => {
														if (!isAllSelected) {
															setSelectedEngines(
																engines,
															);
														} else {
															setSelectedEngines(
																[],
															);
														}
													}}
												/>
											</div>
										</TableHead>
										<TableHead>Name</TableHead>
										<TableHead className="w-[220px]">
											Access
										</TableHead>
										<TableHead className="w-[180px]">
											Added Date
										</TableHead>
										<TableHead className="text-right">
											Action
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{Array.isArray(engines) &&
									engines.length > 0 ? (
										engines.map((engine, i) => {
											const isSelected =
												selectedEngines.some(
													(value) =>
														value.engineid ===
														engine.engineid,
												);
											return (
												<TableRow
													key={`engine-${engine.engineid}-${i}`}
												>
													<TableCell className="w-12">
														<div className="flex justify-center">
															<Checkbox
																checked={
																	isSelected
																}
																onCheckedChange={() => {
																	if (
																		isSelected
																	) {
																		setSelectedEngines(
																			selectedEngines.filter(
																				(
																					e,
																				) =>
																					e.engineid !==
																					engine.engineid,
																			),
																		);
																	} else {
																		setSelectedEngines(
																			[
																				...selectedEngines,
																				engine,
																			],
																		);
																	}
																}}
															/>
														</div>
													</TableCell>
													<TableCell>
														<div className="min-w-0">
															<div className="truncate font-medium text-sm">
																{
																	engine.engine_name
																}
															</div>
															<div className="text-muted-foreground text-xs">
																{`Engine ID: ${engine.engineid}`}
															</div>
														</div>
													</TableCell>
													<TableCell>
														<Select
															value={String(
																engine.permission ??
																	"3",
															)}
															onValueChange={(
																value,
															) => {
																updateSelectedEngines(
																	{
																		engineid:
																			engine.engineid,
																		type: groupType,
																		permission:
																			value,
																	},
																);
															}}
														>
															<SelectTrigger className="h-8 w-[150px]">
																<SelectValue />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="1">
																	Author
																</SelectItem>
																<SelectItem value="2">
																	Editor
																</SelectItem>
																<SelectItem value="3">
																	Read-Only
																</SelectItem>
															</SelectContent>
														</Select>
													</TableCell>
													<TableCell className="whitespace-nowrap text-sm">
														{
															engine.engine_date_created
														}
													</TableCell>
													<TableCell className="text-right">
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => {
																setEngineToDelete(
																	engine,
																);
																setDeleteEngineModal(
																	true,
																);
															}}
														>
															<Trash2 className="size-4" />
														</Button>
													</TableCell>
												</TableRow>
											);
										})
									) : (
										<TableRow>
											<TableCell
												colSpan={5}
												className="text-center"
											>
												No Engines found.
											</TableCell>
										</TableRow>
									)}
								</TableBody>
								<TableFooter>
									<TableRow>
										<TableCell colSpan={5}>
											<div className="flex flex-wrap items-center justify-end gap-4">
												<div className="flex items-center gap-2 text-sm">
													<span>Rows per page:</span>
													<Select
														value={String(
															rowsPerPage,
														)}
														onValueChange={(
															value,
														) => {
															setRowsPerPage(
																parseInt(
																	value,
																	10,
																),
															);
															setEnginesPage(1);
														}}
													>
														<SelectTrigger className="h-8 w-[70px]">
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{[5, 10, 20]
																.filter(
																	(val) =>
																		val <=
																			enginesCount ||
																		val ===
																			5,
																)
																.map((val) => (
																	<SelectItem
																		key={`rows-${val}`}
																		value={String(
																			val,
																		)}
																	>
																		{val}
																	</SelectItem>
																))}
														</SelectContent>
													</Select>
												</div>
												<div className="text-muted-foreground text-sm">
													{startRow}-{endRow} of{" "}
													{enginesCount}
												</div>
												<div className="flex gap-1">
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setEnginesPage(1)
														}
														disabled={
															enginesPage === 1
														}
													>
														{"<<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setEnginesPage(
																Math.max(
																	1,
																	enginesPage -
																		1,
																),
															)
														}
														disabled={
															enginesPage === 1
														}
													>
														{"<"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setEnginesPage(
																Math.min(
																	totalPages,
																	enginesPage +
																		1,
																),
															)
														}
														disabled={
															enginesPage >=
															totalPages
														}
													>
														{">"}
													</Button>
													<Button
														variant="outline"
														size="icon-sm"
														onClick={() =>
															setEnginesPage(
																totalPages,
															)
														}
														disabled={
															enginesPage >=
															totalPages
														}
													>
														{">>"}
													</Button>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</TableFooter>
							</Table>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>Engines</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed p-8 text-center">
							<p className="text-muted-foreground text-sm">
								No engines present
							</p>
							<Button
								onClick={() => {
									setOffset(0);
									setNonCredentialedEngines([]);
									setSearchEngineInput("");
									setAddEngineModal(true);
								}}
							>
								<Plus className="size-4" />
								Add Engines
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			<Dialog
				open={addEngineModal}
				onOpenChange={(open) => {
					if (!open) {
						setAddEngineModal(false);
						setOffset(0);
						setNonCredentialedEngines([]);
						setSelectedNonCredentialedEngines([]);
						setSearchEngineInput("");
					} else {
						setAddEngineModal(true);
					}
				}}
			>
				<DialogContent className="max-w-4xl">
					<DialogHeader>
						<DialogTitle>Add Engines</DialogTitle>
						<DialogDescription>
							Select engines and assign an access level.
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col gap-4">
						<InputGroup>
							<InputGroupAddon>
								<Search className="size-4" />
							</InputGroupAddon>
							<InputGroupInput
								placeholder="Search engines"
								value={searchEngineInput}
								onChange={(e) => {
									setSearchEngineInput(e.target.value);
									setOffset(0);
								}}
							/>
						</InputGroup>
						<div
							className="max-h-[280px] overflow-auto rounded-md border p-2"
							onScroll={({ currentTarget }) =>
								setIsScrollBottom(nearBottom(currentTarget))
							}
						>
							{nonCredentialedEngines.length === 0 ? (
								<p className="p-4 text-center text-muted-foreground text-sm">
									{searchLoading
										? "Loading engines..."
										: "No engines found"}
								</p>
							) : (
								nonCredentialedEngines.map((engine) => {
									const isSelected =
										selectedNonCredentialedEngines.some(
											(value) =>
												value.engine_id ===
												engine.engine_id,
										);
									return (
										<div
											key={engine.engine_id}
											className="flex items-center gap-3 rounded-md p-3 hover:bg-muted/50"
										>
											<Checkbox
												checked={isSelected}
												onCheckedChange={() => {
													if (isSelected) {
														setSelectedNonCredentialedEngines(
															selectedNonCredentialedEngines.filter(
																(e) =>
																	e.engine_id !==
																	engine.engine_id,
															),
														);
													} else {
														setSelectedNonCredentialedEngines(
															[
																...selectedNonCredentialedEngines,
																engine,
															],
														);
													}
												}}
											/>
											<Avatar className="h-8 w-8">
												<AvatarFallback
													style={{
														backgroundColor:
															engine.color,
													}}
													className="text-xs"
												>
													{engine.engine_name
														? engine.engine_name[0]
														: "E"}
												</AvatarFallback>
											</Avatar>
											<div className="flex-1">
												<div className="font-medium text-sm">
													{engine.engine_name}
												</div>
												<div className="text-muted-foreground text-xs">
													Engine ID:{" "}
													{engine.engine_id}
												</div>
											</div>
										</div>
									);
								})
							)}
						</div>
						{selectedNonCredentialedEngines.length > 0 ? (
							<div className="flex flex-wrap gap-2">
								{selectedNonCredentialedEngines.map(
									(engine) => (
										<Badge
											key={`selected-${engine.engine_id}`}
											variant="secondary"
											className="flex items-center gap-1"
										>
											{engine.engine_name}
											<button
												type="button"
												className="rounded-full p-0.5 hover:bg-muted"
												onClick={() => {
													setSelectedNonCredentialedEngines(
														selectedNonCredentialedEngines.filter(
															(e) =>
																e.engine_id !==
																engine.engine_id,
														),
													);
												}}
											>
												<X className="size-3" />
											</button>
										</Badge>
									),
								)}
							</div>
						) : null}
						<div className="rounded-md border bg-muted/40 p-3">
							<p className="font-medium text-sm">Engine access</p>
							<div className="mt-3 grid gap-3">
								<RadioGroup
									value={addEngineRole}
									onValueChange={(value) => {
										setAddEngineRole(
											value as SETTINGS_ROLE,
										);
									}}
								>
									{permissionOptions.map((option) => (
										<div
											key={option.value}
											className="flex items-start gap-3 rounded-md border bg-background p-3"
										>
											<RadioGroupItem
												value={option.value}
											/>
											<div>
												<p className="font-medium text-sm">
													{option.label}
												</p>
												<p className="text-muted-foreground text-xs">
													{option.description}
												</p>
											</div>
										</div>
									))}
								</RadioGroup>
							</div>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAddEngineModal(false);
								setOffset(0);
								setNonCredentialedEngines([]);
							}}
						>
							Cancel
						</Button>
						<Button
							disabled={
								selectedNonCredentialedEngines.length < 1 ||
								!addEngineRole
							}
							onClick={() => {
								submitNonGroupEngines();
							}}
						>
							Save
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteEngineModal}
				onOpenChange={setDeleteEngineModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							{engineToDelete ? (
								<>
									This will remove{" "}
									<span className="font-medium text-foreground">
										{engineToDelete.engine_name}
									</span>
									.
								</>
							) : (
								"This will remove the selected engine."
							)}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteEngineModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								if (!engineToDelete) {
									console.error("No engine to delete");
									return;
								}
								deleteEngine(engineToDelete);
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog
				open={deleteEnginesModal}
				onOpenChange={setDeleteEnginesModal}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Are you sure?</DialogTitle>
						<DialogDescription>
							Would you like to delete all selected engines?
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeleteEnginesModal(false)}
						>
							Close
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								deleteEngines();
							}}
						>
							Confirm
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
