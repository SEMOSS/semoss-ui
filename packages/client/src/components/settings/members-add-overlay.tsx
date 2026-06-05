import { Edit, Eye, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { runPixel, useDebouncedValue } from "@semoss/sdk/react";
import {
	addProjectUserPermissions,
	editProjectUserPermissions,
	getProjectUsers,
	getProjectUsersNoCredentials,
} from "@semoss/shared";
import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardDescription,
	CardHeader,
	CardTitle,
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	Input,
	Label,
	P,
	Popover,
	PopoverContent,
	PopoverTrigger,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	addEngineUserPermissions,
	editEngineUserPermissions,
	getEngineUsers,
	getEngineUsersNoCredentials,
} from "@/api";
import { PERMISSION_DESCRIPTION_MAP } from "@/constants";
import { useSettings } from "@/hooks";
import type { ALL_TYPES } from "@/types";
import { permissionPriorityMapper } from "@/utility/general";
import { MembersAddOverlayUser } from "./members-add-overlay-user";
import type { SETTINGS_ROLE } from "./settings.types";

const Setting_Role_Values: SETTINGS_ROLE[] = ["Author", "Editor", "Read-Only"];

const validSetting = (value: unknown) => {
	return Setting_Role_Values.includes(value as SETTINGS_ROLE);
};

const AUTOCOMPLETE_OFFSET = 0;
const AUTOCOMPLETE_LIMIT = 10;

const pixelValue = (value: string | number | boolean) => {
	if (typeof value === "string") {
		return JSON.stringify(value);
	}
	return String(value);
};

const buildPixel = (
	reactorName: string,
	params: Record<string, string | number | boolean | null | undefined>,
) => {
	const args = Object.entries(params)
		.filter(([, value]) => value !== null && value !== undefined)
		.map(
			([key, value]) =>
				`${key}=[${pixelValue(value as string | number | boolean)}]`,
		)
		.join(", ");
	return `${reactorName}(${args});`;
};

const runTokenLimitReactor = async (
	reactorName: string,
	params: Record<string, string | number | boolean | null | undefined>,
) => {
	const response = await runPixel(buildPixel(reactorName, params));
	if (response.errors.length > 0) {
		throw new Error(response.errors.join("\n"));
	}
};

interface MembersAddOverlayProps {
	/**
	 * Type of engine
	 */
	type: ALL_TYPES;

	/**
	 * ID of the app or engine being edited
	 */
	id: string;

	/**
	 * Track if the model is open or close
	 */
	open: boolean;

	/**
	 * User we want to edit
	 */
	user?: User;

	/**
	 * Set Edit user to null
	 *
	 */
	setAddModalUser?: React.Dispatch<React.SetStateAction<User>>;

	/**
	 * User permission of the app or engine being edited
	 */
	userPermission: SETTINGS_ROLE;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
	 */
	onClose: (success: boolean) => void;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
	 */
	onChange?: () => void;
}

interface User {
	id: string;
	type: string;
	name: string;
	email: string;
	permission_granted_by_type: string;
	permission_granted_by: string;
	permission: string;
	date_added: string;
	usage_restriction?: string;
	usage_frequency?: string;
	max_tokens?: number;
	max_response_time?: number;
}

export const MembersAddOverlay = (props: MembersAddOverlayProps) => {
	const {
		type,
		id,
		open = false,
		userPermission,
		onClose = () => null,
		user,
		setAddModalUser,
		onChange = () => null,
	} = props;
	const { adminMode } = useSettings();

	/** Add Member State */
	const [selectedMembers, setSelectedMembers] = useState([]);
	const [commandOpen, setCommandOpen] = useState(false);
	const [selectedRole, setSelectedRole] = useState<SETTINGS_ROLE>(null);
	const [search, setSearch] = useState<string>("");
	const [restriction, setRestriction] = useState<string>("null");
	const [maxTokens, setMaxTokens] = useState<string>("");
	const [maxTime, setMaxTime] = useState<string>("");
	const [frequency, setFrequency] = useState<string>("");

	//modal member logic
	const [isScrollBottom, setIsScrollBottom] = useState(false);
	const [offset, setOffset] = useState(AUTOCOMPLETE_OFFSET);
	const [renderedMembers, setRenderedMembers] = useState([]);
	const [infiniteOn, setInfiniteOn] = useState(true);
	const [searchLoading, setSearchLoading] = useState(false);
	const renderedMembersLengthRef = useRef(0);
	renderedMembersLengthRef.current = renderedMembers.length;

	// debounce the input
	const debouncedSearch = useDebouncedValue(search);

	const usageRestritctionTypes: Record<string, string> = {
		null: "None",
		token: "Token",
		compute: "Compute time",
	};
	const frequencyTypes: Record<string, string> = {
		HOUR: "Hourly",
		DAY: "Daily",
		WEEK: "Weekly",
		MONTH: "Monthly",
		YEAR: "Yearly",
		ALL_TIME: "All time",
	};
	const unitTypes: string[] = ["milliseconds"];

	useEffect(() => {
		setSelectedRole("Read-Only");
		if (user) {
			setSelectedRole(
				permissionPriorityMapper(user?.permission)
					?.permission as SETTINGS_ROLE,
			);
			setRestriction(
				user?.usage_restriction !== undefined
					? user?.usage_restriction
					: "null",
			);
			setMaxTokens(user?.max_tokens?.toString());
			setMaxTime(user?.max_response_time?.toString());
			setFrequency(user?.usage_frequency);
		}

		// reset on open or close
		setSelectedMembers([]);
		setSearch("");
	}, [user]);

	useEffect(() => {
		if (!open) return;
		if (user?.id) {
			setSearchLoading(false);
			return;
		}

		const cancelled = false;
		setSearchLoading(true);

		const fetchUsers = async () => {
			try {
				let all = [];
				if (type === "PROJECT") {
					const [noCred, cred] = await Promise.all([
						getProjectUsersNoCredentials(
							id,
							adminMode,
							debouncedSearch || "",
							AUTOCOMPLETE_LIMIT,
							offset,
						),
						getProjectUsers(
							id,
							adminMode,
							debouncedSearch || "",
							"", // permission
							AUTOCOMPLETE_LIMIT,
							offset,
						),
					]);
					all = [...(noCred || []), ...(cred?.members || [])];
				} else if (
					type === "DATABASE" ||
					type === "STORAGE" ||
					type === "MODEL" ||
					type === "VECTOR" ||
					type === "GUARDRAIL" ||
					type === "FUNCTION"
				) {
					const [noCred, cred] = await Promise.all([
						getEngineUsersNoCredentials(
							adminMode,
							id,
							AUTOCOMPLETE_LIMIT,
							offset,
							debouncedSearch || "",
						),
						getEngineUsers(
							adminMode,
							id,
							debouncedSearch || "",
							"", // permission
							offset,
							AUTOCOMPLETE_LIMIT,
						),
					]);
					all = [...(noCred?.data || []), ...(cred?.members || [])];
				} else {
					setSearchLoading(false);
					return;
				}

				if (!cancelled) {
					if (all.length < AUTOCOMPLETE_LIMIT) setInfiniteOn(false);
					if (
						renderedMembersLengthRef.current >=
							AUTOCOMPLETE_LIMIT &&
						offset > 0
					) {
						setRenderedMembers((prev) => [...prev, ...all]);
					} else {
						setRenderedMembers(all);
					}
					setSearchLoading(false);
				}
			} catch (e) {
				if (!cancelled) {
					toast.error(String(e));
					setSearchLoading(false);
				}
			}
		};

		fetchUsers();
	}, [open, user, debouncedSearch, offset, adminMode, id, type]);

	const isLoading = searchLoading;

	const getAdditionalMembers = useCallback(() => {
		setOffset((prev) => prev + AUTOCOMPLETE_LIMIT);
	}, []);

	const saveModelUserLimits = async (members: Pick<User, "id">[]) => {
		if (restriction === "null") {
			return;
		}
		if (!frequency) {
			throw new Error("Frequency is required when setting model limits");
		}
		await Promise.all(
			members.map((member) =>
				runTokenLimitReactor("SetEngineUserTokenLimit", {
					engineId: id,
					userId: member.id,
					usageFrequency: frequency,
					existingUsageFrequency: frequency,
					maxTokens:
						restriction === "token" && maxTokens
							? Number(maxTokens)
							: -1,
					maxInputTokens: -1,
					maxOutputTokens: -1,
					maxResponseTime:
						restriction === "compute" && maxTime
							? Number(maxTime)
							: -1,
					isActive: true,
				}),
			),
		);
	};

	/**
	 * Update the selected users
	 * @param members
	 * @param quickUpdate
	 * @returns
	 */
	const updateUser = async (members) => {
		let success = false;
		try {
			// construct requests for post data
			const requests = members.map((m) => {
				const json: Record<string, unknown> = {
					userid: m.id,
					permission: validSetting(selectedRole)
						? permissionPriorityMapper(selectedRole)?.permission
						: selectedRole,
				};

				return json;
			});

			if (requests.length === 0) {
				toast.warning("No permissions to change");
				return;
			}

			let response:
				| boolean
				| {
						response: Response;
						data: {
							success: boolean;
						};
				  }
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await editEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await editProjectUserPermissions(
					id,
					requests,
					adminMode,
				);
			}

			if (
				typeof response === "boolean"
					? response
					: response?.data?.success
			) {
				if (type === "MODEL" && restriction !== "null") {
					await saveModelUserLimits(members);
				}
				toast.success("Successfully updated user permissions");
				success = true;
				onChange();
			} else {
				toast.error("Error changing user permissions");
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			closeOverlay(type, success);
		}
	};

	/**
	 * @name addMembers
	 *
	 * Add members to the app or engine
	 */
	const addMembers = async () => {
		let success = false;

		try {
			// construct requests for post data
			let requests: unknown[] = [];
			if (type === "MODEL") {
				requests = selectedMembers.map((m) => {
					return {
						userid: m.id,
						permission:
							permissionPriorityMapper(selectedRole)?.permission,
						email: m.email,
						name: m.name,
						type: m.type,
						username: m.username,
					};
				});
			} else {
				requests = selectedMembers.map((m) => {
					return {
						userid: m.id,
						permission:
							permissionPriorityMapper(selectedRole)?.permission,
						email: m.email,
						name: m.name,
						type: m.type,
						username: m.username,
					};
				});
			}

			if (requests.length === 0) {
				toast.warning("No permissions to change");
				return;
			}

			let response:
				| Awaited<ReturnType<typeof editEngineUserPermissions>>
				| boolean
				| null = null;
			if (
				type === "DATABASE" ||
				type === "STORAGE" ||
				type === "MODEL" ||
				type === "VECTOR" ||
				type === "GUARDRAIL" ||
				type === "FUNCTION"
			) {
				response = await addEngineUserPermissions(
					adminMode,
					id,
					requests,
				);
			} else if (type === "PROJECT") {
				response = await addProjectUserPermissions(
					id,
					requests as string[],
					adminMode,
				);
			}

			// ignore if there is no response
			if (
				typeof response === "boolean"
					? response
					: response?.data?.success
			) {
				if (type === "MODEL" && restriction !== "null") {
					await saveModelUserLimits(selectedMembers);
				}
				toast.success("Successfully added member permissions");
				success = true;
			} else {
				toast.error("Error changing user permissions");
			}
		} catch (e) {
			toast.error(String(e));
		} finally {
			// close the overlay
			closeOverlay(type, success);
		}
	};

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

	const closeOverlay = (type: ALL_TYPES, isSuccess: boolean) => {
		if (type === "MODEL") {
			setRestriction("null");
			setFrequency("");
			setMaxTime("");
			setMaxTokens("");
		}
		setAddModalUser(null);
		onClose(isSuccess);
	};

	useEffect(() => {
		if (isScrollBottom) {
			if (infiniteOn) {
				getAdditionalMembers();
			}
		}
	}, [isScrollBottom, infiniteOn, getAdditionalMembers]);

	const removeMember = (userId: string) => {
		const filtered = selectedMembers.filter((val) => val.id !== userId);
		setSelectedMembers(filtered);
	};

	return (
		<Dialog open={open} onOpenChange={() => closeOverlay(type, false)}>
			<DialogContent
				className="max-h-[90vh] overflow-auto sm:max-w-2xl"
				data-testid="members-add-overlay-modal"
			>
				<DialogHeader>
					<DialogTitle data-testid="members-add-overlay-modal-title">
						{user === null ? "Add Members" : "Edit Member"}
					</DialogTitle>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					{user === null && (
						<Popover
							open={commandOpen}
							onOpenChange={setCommandOpen}
						>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									role="combobox"
									className="w-full justify-between"
									data-testid="members-add-overlay-autocomplete"
								>
									{selectedMembers.length === 0
										? "Search users"
										: selectedMembers.length === 1
											? selectedMembers[0].name
											: `${selectedMembers.length} members selected`}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
								<Command
									shouldFilter={false}
									className="overflow-visible"
								>
									<CommandInput
										placeholder="Search users..."
										value={search}
										onValueChange={(value) => {
											setSearch(value);
											setOffset(0);
											setInfiniteOn(true);
											setRenderedMembers([]);
											setSearchLoading(true);
										}}
									/>
									<div
										className="max-h-[300px] overflow-y-auto"
										onWheel={(e) => e.stopPropagation()}
										onScroll={({ currentTarget }) => {
											setIsScrollBottom(
												nearBottom({
													scrollHeight:
														currentTarget.scrollHeight,
													scrollTop:
														currentTarget.scrollTop,
													clientHeight:
														currentTarget.clientHeight,
												}),
											);
										}}
									>
										<CommandList className="max-h-none overflow-visible">
											{isLoading ? (
												<div className="flex items-center justify-center p-4">
													<Spinner />
												</div>
											) : (
												<>
													<CommandEmpty>
														No users found.
													</CommandEmpty>
													<CommandGroup>
														{renderedMembers.map(
															(option) => {
																const hasPermission =
																	!!option.permission;
																const isSelected =
																	selectedMembers.some(
																		(m) =>
																			m.id ===
																			option.id,
																	);
																return (
																	<CommandItem
																		key={
																			option.id
																		}
																		disabled={
																			hasPermission
																		}
																		onSelect={() => {
																			if (
																				!hasPermission
																			) {
																				if (
																					isSelected
																				) {
																					removeMember(
																						option.id,
																					);
																				} else {
																					setSelectedMembers(
																						[
																							...selectedMembers,
																							option,
																						],
																					);
																				}
																			}
																		}}
																		className="justify-between"
																	>
																		<div className="max-w-[85%] overflow-auto">
																			<MembersAddOverlayUser
																				name={
																					option.name
																				}
																				id={
																					option.id
																				}
																				email={
																					option.email
																				}
																				type={
																					option.type
																				}
																			/>
																		</div>
																		{hasPermission && (
																			<span className="whitespace-nowrap text-muted-foreground text-xs">
																				Already
																				Added
																			</span>
																		)}
																		{isSelected &&
																			!hasPermission && (
																				<span className="text-primary text-xs">
																					✓
																				</span>
																			)}
																	</CommandItem>
																);
															},
														)}
													</CommandGroup>
												</>
											)}
										</CommandList>
									</div>
								</Command>
							</PopoverContent>
						</Popover>
					)}

					<div
						className="flex max-h-[200px] flex-col gap-4 overflow-auto"
						data-testid="members-add-overlay-outerbox"
					>
						{user === null &&
							selectedMembers.map((selectedUser) => (
								<MembersAddOverlayUser
									key={selectedUser.id}
									name={selectedUser.name}
									id={selectedUser.id}
									email={selectedUser.email}
									type={selectedUser.type}
									action={
										<Button
											variant="ghost"
											size="icon"
											onClick={() => {
												removeMember(selectedUser.id);
											}}
										>
											<X className="h-4 w-4" />
										</Button>
									}
								/>
							))}

						{user !== null && (
							<MembersAddOverlayUser
								key={user.id}
								name={user.name}
								id={user.id}
								email={user.email}
								type={user.type}
							/>
						)}
					</div>

					<div className="flex flex-col gap-2">
						<P
							className="font-medium"
							data-testid="members-permissions"
						>
							Permissions
						</P>
						<div className="rounded-lg bg-muted/30">
							<RadioGroup
								value={selectedRole}
								onValueChange={(val) => {
									if (val) {
										setSelectedRole(val as SETTINGS_ROLE);
									}
								}}
								className="flex flex-col gap-4"
							>
								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<Avatar className="h-5 w-5 font-bold text-xs">
														<AvatarFallback className="bg-black/50 text-white">
															A
														</AvatarFallback>
													</Avatar>
													<CardTitle
														className="text-base"
														data-testid="author-role"
													>
														Author
													</CardTitle>
												</div>
												<RadioGroupItem
													value="Author"
													disabled={
														!adminMode &&
														permissionPriorityMapper(
															userPermission,
														)?.priority > 1
													}
													data-testid="author-role-radio"
												/>
											</div>
											<CardDescription className="ml-8 text-sm">
												{PERMISSION_DESCRIPTION_MAP[
													type
												].author ||
													`Error: update key in test-editor.constants to "${name}"`}
											</CardDescription>
										</div>
									</CardHeader>
								</Card>

								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center text-black/50">
														<Edit className="h-5 w-5" />
													</div>
													<CardTitle
														className="text-base"
														data-testid="editor-role"
													>
														Editor
													</CardTitle>
												</div>
												<RadioGroupItem
													value="Editor"
													disabled={
														!adminMode &&
														permissionPriorityMapper(
															userPermission,
														)?.priority > 2
													}
													data-testid="editor-role-radio"
												/>
											</div>
											<CardDescription className="ml-9 text-sm">
												{PERMISSION_DESCRIPTION_MAP[
													type
												].editor ||
													`Error: update key in test-editor.constants to "${name}"`}
											</CardDescription>
										</div>
									</CardHeader>
								</Card>

								<Card className="m-2 rounded-xl p-2">
									<CardHeader className="px-2">
										<div className="flex flex-col gap-2">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3">
													<div className="flex h-6 w-6 items-center justify-center text-black/50">
														<Eye className="h-5 w-5" />
													</div>
													<CardTitle
														className="text-base"
														data-testid="readonly-role"
													>
														Read-Only
													</CardTitle>
												</div>
												<RadioGroupItem
													value="Read-Only"
													disabled={
														!adminMode &&
														permissionPriorityMapper(
															userPermission,
														)?.priority > 3
													}
													data-testid="readonly-role-radio"
												/>
											</div>
											<CardDescription className="ml-9 text-sm">
												{PERMISSION_DESCRIPTION_MAP[
													type
												].readonly ||
													`Error: update key in test-editor.constants to "${name}"`}
											</CardDescription>
										</div>
									</CardHeader>
								</Card>
							</RadioGroup>
						</div>
					</div>

					{type === "MODEL" && (
						<>
							<P
								className="font-medium"
								data-testid="model-limit-restrictions"
							>
								Model Limit Restrictions
							</P>
							<div className="flex flex-col gap-4">
								<Field>
									<Label>Limit Type</Label>
									<Select
										value={restriction}
										onValueChange={(value) => {
											setRestriction(value);
										}}
									>
										<SelectTrigger data-testid="model-limit-restrictions-select">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{Object.entries(
												usageRestritctionTypes,
											).map((option) => {
												return (
													<SelectItem
														value={option[0]}
														key={`usageRestrictionType-${option[0]}`}
													>
														{option[1]}
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</Field>
								{restriction === "token" && (
									<Field>
										<Label>Max Tokens</Label>
										<Input
											value={maxTokens}
											type="number"
											onChange={(e) => {
												setMaxTokens(e.target.value);
											}}
											data-testid="model-max-tokens"
										/>
									</Field>
								)}
								{restriction === "compute" && (
									<div className="flex gap-4">
										<Field className="flex-1">
											<Label>Max Response Time</Label>
											<Input
												value={maxTime}
												type="number"
												onChange={(e) => {
													setMaxTime(e.target.value);
												}}
												data-testid="model-max-response-time"
											/>
										</Field>
										<Field className="w-40">
											<Label>Unit</Label>
											<Select value={unitTypes[0]}>
												<SelectTrigger>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{unitTypes.map((option) => {
														return (
															<SelectItem
																value={option}
																key={`unitType-${option}`}
															>
																{option}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</Field>
									</div>
								)}
								{restriction !== "null" && (
									<Field>
										<Label>Frequency</Label>
										<Select
											value={frequency}
											onValueChange={(value) => {
												setFrequency(value);
											}}
										>
											<SelectTrigger data-testid="model-frequency-select">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{Object.entries(
													frequencyTypes,
												).map((option) => {
													return (
														<SelectItem
															value={option[0]}
															key={`frequencyType-${option[0]}`}
														>
															{option[1]}
														</SelectItem>
													);
												})}
											</SelectContent>
										</Select>
									</Field>
								)}
							</div>
						</>
					)}
				</div>

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => closeOverlay(type, false)}
						data-testid="members-add-overlay-cancel-button"
					>
						Cancel
					</Button>
					{user === null && (
						<Button
							variant="default"
							disabled={
								!selectedRole || selectedMembers.length < 1
							}
							onClick={() => {
								addMembers();
							}}
							data-testid="members-add-overlay-add-button"
						>
							Save
						</Button>
					)}

					{user !== null && (
						<Button
							variant="default"
							disabled={!selectedRole}
							onClick={() => {
								updateUser([user]);
							}}
							data-testid="members-add-overlay-update-button"
						>
							Update
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
