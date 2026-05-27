import { Check, ChevronsUpDown, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	getLoginProviderInitials,
	getLoginProviderKey,
	loadLoginProviderLogos,
} from "@semoss/shared";
import {
	Button,
	Checkbox,
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
	FieldDescription,
	FieldError,
	FieldLabel,
	Input,
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
	Textarea,
	toast,
} from "@semoss/ui/next";
import { addEnginePermission, addProject } from "@/api";
import { getAllUsers } from "@/api/auth";
import { addTeam, addTeamUser, editTeam, getTeams } from "@/api/teams";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

type TeamReturn = {
	id: string;
	type: string;
	description: string;
	previousTeamName?: string;
};

type NewTeamForm = {
	TEAM_MODE: "EXISTING_TEAM" | "NEW_TEAM";
	TEAM_EXISTING_TEAM: string;
	TEAM_NAME: string;
	TEAM_DESCRIPTION: string;
	TEAM_TYPE: string;
	TEAM_PERMISSION: string;
	TEAM_MEMBERS: string[];
};

type ExistingTeamOption = {
	id: string;
	type: string;
};

type MemberOption = {
	id: string;
	name: string;
	type: string;
};

const parseExistingTeams = (response: unknown): ExistingTeamOption[] => {
	if (!Array.isArray(response)) {
		return [];
	}

	return response
		.map((item) => {
			if (!item || typeof item !== "object") {
				return null;
			}

			const groupId =
				typeof (item as { id?: unknown }).id === "string"
					? (item as { id: string }).id
					: typeof (item as { ID?: unknown }).ID === "string"
						? (item as { ID: string }).ID
						: "";

			if (!groupId) {
				return null;
			}

			const groupType =
				typeof (item as { type?: unknown }).type === "string"
					? (item as { type: string }).type
					: typeof (item as { TYPE?: unknown }).TYPE === "string"
						? (item as { TYPE: string }).TYPE
						: "CUSTOM";

			return {
				id: groupId,
				type: groupType,
			};
		})
		.filter((item): item is ExistingTeamOption => item !== null);
};

const getErrorMessage = (error: unknown, fallback: string) => {
	return error instanceof Error && error.message ? error.message : fallback;
};

interface AddTeamModalProps {
	/**
	 * Open state
	 */
	open: boolean;

	/**
	 * What happens when team is created
	 * @param team
	 * @returns
	 */
	// eslint-disable-next-line no-unused-vars
	onClose: (team?: TeamReturn) => void;
	isEdit?: boolean;
	id?: string;
	type?: string;
	description?: string;
	showTeamModeSwitch?: boolean;
	showMembersField?: boolean;
	showPermissionField?: boolean;
	projectId?: string;
	engineId?: string;
}

export const AddTeamModal = (props: AddTeamModalProps) => {
	const {
		open,
		onClose,
		isEdit,
		id,
		type,
		description,
		showTeamModeSwitch,
		showMembersField,
		showPermissionField,
		projectId,
		engineId,
	} = props;

	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const [providerLogos, setProviderLogos] = useState<Record<string, string>>(
		{},
	);
	const [existingTeams, setExistingTeams] = useState<ExistingTeamOption[]>(
		[],
	);
	const [isLoadingExistingTeams, setIsLoadingExistingTeams] = useState(false);
	const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
	const [isLoadingMembers, setIsLoadingMembers] = useState(false);
	const [membersPopoverOpen, setMembersPopoverOpen] = useState(false);

	// State to track the previous team name, type
	const [previousTeamName, setPreviousTeamName] = useState<
		string | undefined
	>(id);
	const [_previousType, setPreviousType] = useState<string | undefined>(id);
	const {
		handleSubmit,
		control,
		reset,
		setValue,
		formState: { isValid },
		watch,
	} = useForm<NewTeamForm>({
		defaultValues: {
			TEAM_MODE: "EXISTING_TEAM",
			TEAM_EXISTING_TEAM: "",
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: isEdit ? type || "" : "",
			TEAM_PERMISSION: "3",
			TEAM_MEMBERS: [],
		},
		mode: "onChange", // Ensures validation updates on field changes
	});

	useEffect(() => {
		reset({
			TEAM_MODE: "EXISTING_TEAM",
			TEAM_EXISTING_TEAM: "",
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: isEdit ? type || "" : "",
			TEAM_PERMISSION: "3",
			TEAM_MEMBERS: [],
		});

		// Update the previous team name when the modal is opened
		setPreviousTeamName(id);
		setPreviousType(type);
	}, [id, type, description, isEdit, reset]);

	const selectedTeamMode = watch("TEAM_MODE");
	const selectedTeamType = watch("TEAM_TYPE");
	const isExistingTeamMode =
		showTeamModeSwitch && !isEdit && selectedTeamMode === "EXISTING_TEAM";
	const isNewTeamMode = !showTeamModeSwitch || isEdit || !isExistingTeamMode;

	const loginTypes = useMemo(() => {
		return [
			{
				provider: "CUSTOM",
				name: "Custom",
				description: "Directly manage users in the team",
				isOauth: false,
			},
			...configStore.store.config.availableProviders,
		] as {
			provider: string;
			name: string;
			isOauth: boolean;
			description?: string;
		}[];
	}, [configStore.store.config.availableProviders]);

	const loginTypesSignature = useMemo(() => {
		return loginTypes
			.map((provider) => getLoginProviderKey(provider.provider))
			.sort()
			.join("|");
	}, [loginTypes]);

	useEffect(() => {
		if (!open || !showTeamModeSwitch || isEdit) {
			return;
		}

		let isMounted = true;

		const loadExistingTeams = async () => {
			setIsLoadingExistingTeams(true);
			try {
				const response = await getTeams(true);
				if (!isMounted) {
					return;
				}

				const parsedTeams = parseExistingTeams(response).sort((a, b) =>
					a.id.localeCompare(b.id),
				);
				setExistingTeams(parsedTeams);
			} catch (error) {
				console.error(error);
				if (isMounted) {
					setExistingTeams([]);
				}
			} finally {
				if (isMounted) {
					setIsLoadingExistingTeams(false);
				}
			}
		};

		void loadExistingTeams();

		return () => {
			isMounted = false;
		};
	}, [open, showTeamModeSwitch, isEdit]);

	useEffect(() => {
		if (!showTeamModeSwitch || isEdit) {
			return;
		}

		if (selectedTeamMode === "EXISTING_TEAM") {
			setValue("TEAM_NAME", "", { shouldValidate: true });
			setValue("TEAM_DESCRIPTION", "", { shouldValidate: true });
			setValue("TEAM_MEMBERS", [], { shouldValidate: false });
		} else {
			setValue("TEAM_EXISTING_TEAM", "", { shouldValidate: true });
		}
	}, [selectedTeamMode, showTeamModeSwitch, isEdit, setValue]);

	useEffect(() => {
		if (
			!open ||
			!showMembersField ||
			isEdit ||
			(showTeamModeSwitch && selectedTeamMode === "EXISTING_TEAM")
		) {
			return;
		}

		let isMounted = true;

		const loadMembers = async () => {
			setIsLoadingMembers(true);
			try {
				const response = await getAllUsers(true, "", 0, 500);
				if (!isMounted) {
					return;
				}

				const users = Array.isArray(response?.users)
					? response.users
					: [];
				const parsedMembers = users
					.map((user) => {
						const userId =
							typeof user.id === "string"
								? user.id
								: typeof user.username === "string"
									? user.username
									: "";
						if (!userId) {
							return null;
						}

						return {
							id: userId,
							name:
								typeof user.name === "string" && user.name
									? user.name
									: userId,
							type:
								typeof user.type === "string"
									? user.type
									: "UNKNOWN",
						};
					})
					.filter((member): member is MemberOption => member !== null)
					.sort((a, b) => a.name.localeCompare(b.name));

				setMemberOptions(parsedMembers);
			} catch (error) {
				console.error(error);
				if (isMounted) {
					setMemberOptions([]);
				}
			} finally {
				if (isMounted) {
					setIsLoadingMembers(false);
				}
			}
		};

		void loadMembers();

		return () => {
			isMounted = false;
		};
	}, [open, showMembersField, isEdit, selectedTeamMode, showTeamModeSwitch]);

	useEffect(() => {
		if (!open || !loginTypesSignature) return;

		const providers = loginTypesSignature
			.split("|")
			.filter(
				(provider) =>
					!["custom", "native", "registration"].includes(provider),
			);

		if (providers.length === 0) return;

		let isMounted = true;

		const loadProviderLogos = async () => {
			const loadedLogos = await loadLoginProviderLogos(providers);

			if (!isMounted || Object.keys(loadedLogos).length === 0) return;

			setProviderLogos((previous) => {
				const next = { ...previous };
				let hasChanged = false;

				for (const [provider, logo] of Object.entries(loadedLogos)) {
					if (next[provider] === logo) continue;
					next[provider] = logo;
					hasChanged = true;
				}

				return hasChanged ? next : previous;
			});
		};

		void loadProviderLogos();

		return () => {
			isMounted = false;
		};
	}, [open, loginTypesSignature]);

	/**
	 * Method that is called to create the team
	 */
	const onSubmit = handleSubmit(async (data: NewTeamForm) => {
		const shouldAssignProjectPermission =
			showPermissionField && !!projectId && !isEdit;
		const shouldAssignEnginePermission =
			showPermissionField && !!engineId && !isEdit;
		const shouldAssignResourcePermission =
			shouldAssignProjectPermission || shouldAssignEnginePermission;
		const permissionValue = Number(data.TEAM_PERMISSION || "0");

		if (isEdit) {
			// Logic for editing the team
			try {
				const response = await editTeam(
					data.TEAM_NAME,
					data.TEAM_DESCRIPTION,
					data.TEAM_TYPE,
					previousTeamName,
					data.TEAM_TYPE,
				);
				if (response.data) {
					onClose({
						id: data.TEAM_NAME,
						type: data.TEAM_TYPE,
						description: data.TEAM_DESCRIPTION,
						previousTeamName: previousTeamName,
					});
					reset();
					toast.success("Successfully updated team");
				} else {
					throw new Error("Failed to update team");
				}
			} catch (e) {
				console.error(e);
				toast.error(getErrorMessage(e, "Error updating team"));
			}
		} else {
			if (showTeamModeSwitch && data.TEAM_MODE === "EXISTING_TEAM") {
				try {
					const selectedTeam = existingTeams.find(
						(team) => team.id === data.TEAM_EXISTING_TEAM,
					);

					if (!selectedTeam) {
						toast.error("Please select a team");
						return;
					}

					if (
						showMembersField &&
						Array.isArray(data.TEAM_MEMBERS) &&
						data.TEAM_MEMBERS.length > 0
					) {
						const memberResults = await Promise.allSettled(
							data.TEAM_MEMBERS.map((memberId) =>
								addTeamUser(
									selectedTeam.id,
									"NATIVE",
									memberId,
									true,
								),
							),
						);

						const failedMembers = memberResults.filter(
							(result) => result.status === "rejected",
						).length;

						if (failedMembers > 0) {
							toast.error(
								`Failed to add ${failedMembers} member${failedMembers > 1 ? "s" : ""}`,
							);
						}
					}

					if (shouldAssignResourcePermission) {
						if (
							!Number.isFinite(permissionValue) ||
							permissionValue < 1
						) {
							toast.error("Please select a valid permission");
							return;
						}

						if (shouldAssignProjectPermission) {
							await addProject(
								selectedTeam.id,
								projectId,
								permissionValue,
								selectedTeam.type,
							);
						} else if (shouldAssignEnginePermission) {
							await addEnginePermission(
								selectedTeam.id,
								engineId,
								permissionValue,
								selectedTeam.type,
							);
						}
					}

					onClose({
						id: selectedTeam.id,
						type: selectedTeam.type,
						description: "",
					});
					reset();
					toast.success(
						shouldAssignResourcePermission ||
							(showMembersField &&
								Array.isArray(data.TEAM_MEMBERS) &&
								data.TEAM_MEMBERS.length > 0)
							? "Successfully added team"
							: "Team selected",
					);
					return;
				} catch (e) {
					console.error(e);
					toast.error(getErrorMessage(e, "Error adding team"));
					return;
				}
			}

			// Logic for creating a new team
			try {
				const response = await addTeam(
					data.TEAM_NAME,
					data.TEAM_DESCRIPTION,
					false,
					data.TEAM_TYPE,
				);
				if (response.data) {
					if (
						showMembersField &&
						Array.isArray(data.TEAM_MEMBERS) &&
						data.TEAM_MEMBERS.length > 0
					) {
						const memberResults = await Promise.allSettled(
							data.TEAM_MEMBERS.map((memberId) =>
								addTeamUser(
									data.TEAM_NAME,
									"NATIVE",
									memberId,
									true,
								),
							),
						);

						const failedMembers = memberResults.filter(
							(result) => result.status === "rejected",
						).length;

						if (failedMembers > 0) {
							toast.error(
								`Team created, but failed to add ${failedMembers} member${failedMembers > 1 ? "s" : ""}`,
							);
						}
					}

					if (shouldAssignResourcePermission) {
						if (
							!Number.isFinite(permissionValue) ||
							permissionValue < 1
						) {
							toast.error("Please select a valid permission");
							return;
						}

						if (shouldAssignProjectPermission) {
							await addProject(
								data.TEAM_NAME,
								projectId,
								permissionValue,
								data.TEAM_TYPE,
							);
						} else if (shouldAssignEnginePermission) {
							await addEnginePermission(
								data.TEAM_NAME,
								engineId,
								permissionValue,
								data.TEAM_TYPE,
							);
						}
					}

					onClose({
						id: data.TEAM_NAME,
						type: data.TEAM_TYPE,
						description: data.TEAM_DESCRIPTION,
					});
					reset();
					toast.success(
						shouldAssignResourcePermission
							? "Successfully added team and permission"
							: "Successfully added team",
					);
					if (!showTeamModeSwitch) {
						navigate(
							`${encodeURIComponent(data.TEAM_TYPE)}/${encodeURIComponent(data.TEAM_NAME)}`,
						);
					}
				} else {
					throw new Error("Failed to add team");
				}
			} catch (e) {
				console.error(e);
				toast.error(getErrorMessage(e, "Error adding team"));
			}
		}
	});

	const selectedMembers = watch("TEAM_MEMBERS");
	const selectedMembersLabel =
		selectedMembers.length === 0
			? "Select members"
			: selectedMembers.length === 1
				? memberOptions.find(
						(member) => member.id === selectedMembers[0],
					)?.name || selectedMembers[0]
				: `${selectedMembers.length} members selected`;

	return (
		<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
			<DialogContent
				className="max-w-[550px] gap-6 rounded-xl"
				showCloseButton={false}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="text-foreground">
							{isEdit ? "Edit Team" : "Create New Team"}
						</DialogTitle>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => {
								reset();
								onClose();
							}}
							className="hover:bg-accent"
						>
							<X className="size-4" />
						</Button>
					</div>
				</DialogHeader>
				<form onSubmit={onSubmit}>
					<div className="flex flex-col gap-6 pb-6">
						<Field>
							{showTeamModeSwitch && !isEdit ? (
								<Controller
									name="TEAM_MODE"
									control={control}
									render={({ field }) => {
										return (
											<>
												<FieldLabel>
													Team Option
												</FieldLabel>
												<RadioGroup
													value={field.value}
													onValueChange={(value) =>
														field.onChange(value)
													}
													className="grid grid-cols-2 gap-3"
												>
													<div className="flex items-center gap-3 rounded-md border bg-background p-3">
														<RadioGroupItem
															value="EXISTING_TEAM"
															className="focus-visible:ring-0 focus-visible:ring-offset-0"
														/>
														<span className="font-medium text-sm">
															Existing Team
														</span>
													</div>
													<div className="flex items-center gap-3 rounded-md border bg-background p-3">
														<RadioGroupItem
															value="NEW_TEAM"
															className="focus-visible:ring-0 focus-visible:ring-offset-0"
														/>
														<span className="font-medium text-sm">
															New Team
														</span>
													</div>
												</RadioGroup>
											</>
										);
									}}
								/>
							) : null}
						</Field>

						{isExistingTeamMode ? (
							<Field>
								<Controller
									name="TEAM_EXISTING_TEAM"
									control={control}
									rules={{
										required: "Please select a team",
									}}
									render={({
										field,
										fieldState: { error },
									}) => {
										return (
											<>
												<FieldLabel>
													Team
													<span className="text-destructive">
														*
													</span>
												</FieldLabel>
												<Select
													value={
														field.value
															? field.value
															: ""
													}
													onValueChange={(value) =>
														field.onChange(value)
													}
													disabled={
														isLoadingExistingTeams
													}
												>
													<SelectTrigger
														className="w-full"
														aria-invalid={!!error}
													>
														<SelectValue placeholder="Select a team" />
													</SelectTrigger>
													<SelectContent>
														{existingTeams.map(
															(team) => (
																<SelectItem
																	key={`existing-team-${team.id}`}
																	value={
																		team.id
																	}
																>
																	{team.id}
																</SelectItem>
															),
														)}
													</SelectContent>
												</Select>
												{error && (
													<FieldError>
														{error.message}
													</FieldError>
												)}
											</>
										);
									}}
								/>
							</Field>
						) : null}

						{isNewTeamMode ? (
							<>
								<Field>
									<Controller
										name="TEAM_TYPE"
										control={control}
										rules={{
											required: isNewTeamMode
												? "Please select a team type"
												: false,
										}}
										render={({
											field,
											fieldState: { error },
										}) => {
											return (
												<>
													<FieldLabel>
														Type
														<span className="text-destructive">
															*
														</span>
													</FieldLabel>
													<Select
														value={
															field.value
																? field.value
																: ""
														}
														onValueChange={(
															value,
														) =>
															field.onChange(
																value,
															)
														}
														disabled={isEdit}
													>
														<SelectTrigger
															className="w-full"
															aria-invalid={
																!!error
															}
														>
															<SelectValue placeholder="Select a team type">
																{field.value
																	? loginTypes.find(
																			(
																				p,
																			) =>
																				p.provider ===
																				field.value,
																		)?.name
																	: "Select a team type"}
															</SelectValue>
														</SelectTrigger>
														<SelectContent>
															{(() => {
																const filteredTypes =
																	[
																		...loginTypes,
																	]
																		.sort(
																			(
																				a,
																				b,
																			) =>
																				a.name.localeCompare(
																					b.name,
																				),
																		)
																		.filter(
																			(
																				p,
																			) =>
																				![
																					"native",
																					"registration",
																				].includes(
																					getLoginProviderKey(
																						p.provider,
																					),
																				),
																		);
																const hasMultipleTypes =
																	filteredTypes.length >
																	1;
																return filteredTypes.map(
																	(p) => {
																		const providerKey =
																			getLoginProviderKey(
																				p.provider,
																			);
																		const providerLogo =
																			providerLogos[
																				providerKey
																			];
																		const providerInitials =
																			getLoginProviderInitials(
																				p.name ||
																					p.provider,
																			);

																		return (
																			<SelectItem
																				key={`logintype-${p.provider}`}
																				value={
																					p.provider
																				}
																				className={
																					providerKey ===
																						"custom" &&
																					hasMultipleTypes
																						? "border-border border-b"
																						: ""
																				}
																			>
																				<div className="flex flex-row items-center gap-6">
																					{providerKey ===
																					"custom" ? (
																						<Users className="h-6 w-6 text-muted-foreground" />
																					) : providerLogo ? (
																						<img
																							src={
																								providerLogo
																							}
																							className="h-6 w-6"
																							alt="login provider icon"
																							loading="lazy"
																							decoding="async"
																						/>
																					) : (
																						<div className="flex h-6 w-6 items-center justify-center rounded-md border border-border/70 bg-muted/60 font-semibold text-[9px] text-muted-foreground">
																							{
																								providerInitials
																							}
																						</div>
																					)}
																					<span>
																						{
																							p.name
																						}
																					</span>
																					{p.description && (
																						<span className="text-muted-foreground text-xs italic">
																							{
																								p.description
																							}
																						</span>
																					)}
																				</div>
																			</SelectItem>
																		);
																	},
																);
															})()}
														</SelectContent>
													</Select>
													{error && (
														<FieldError>
															{error.message}
														</FieldError>
													)}
												</>
											);
										}}
									/>
								</Field>

								<Field>
									<Controller
										name="TEAM_NAME"
										control={control}
										rules={{
											required: isNewTeamMode
												? "Team name is required"
												: false,
										}}
										render={({
											field,
											fieldState: { error },
										}) => {
											return (
												<>
													<FieldLabel>
														Name
														<span className="text-destructive">
															*
														</span>
													</FieldLabel>
													<Input
														value={
															field.value
																? field.value
																: ""
														}
														onChange={(e) =>
															field.onChange(
																e.target.value,
															)
														}
														disabled={
															isEdit &&
															selectedTeamType !==
																"CUSTOM"
														}
														aria-invalid={!!error}
													/>
													{selectedTeamType !==
														"CUSTOM" &&
													selectedTeamType !== "" ? (
														<FieldDescription className="pl-3.5 text-[#666666] text-[12px] leading-[20px] tracking-[0.4px]">
															Must be the name of
															the group/team from
															your IdP
														</FieldDescription>
													) : null}
													{error && (
														<FieldError>
															{error.message}
														</FieldError>
													)}
												</>
											);
										}}
									/>
								</Field>
							</>
						) : null}

						{isNewTeamMode ? (
							<Field>
								<Controller
									name="TEAM_DESCRIPTION"
									control={control}
									rules={{}}
									render={({ field }) => {
										return (
											<>
												<FieldLabel>
													Description
												</FieldLabel>
												<Textarea
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value,
														)
													}
													rows={2}
													className="max-h-[150px] resize-none"
												/>
											</>
										);
									}}
								/>
							</Field>
						) : null}

						{showPermissionField ? (
							<Field>
								<Controller
									name="TEAM_PERMISSION"
									control={control}
									rules={{
										required: "Please select a permission",
									}}
									render={({
										field,
										fieldState: { error },
									}) => {
										return (
											<>
												<FieldLabel>
													Permission
													<span className="text-destructive">
														*
													</span>
												</FieldLabel>
												<Select
													value={field.value || ""}
													onValueChange={(value) =>
														field.onChange(value)
													}
												>
													<SelectTrigger
														className="w-full"
														aria-invalid={!!error}
													>
														<SelectValue placeholder="Select a permission" />
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
												{error ? (
													<FieldError>
														{error.message}
													</FieldError>
												) : null}
											</>
										);
									}}
								/>
							</Field>
						) : null}

						{showMembersField && isNewTeamMode ? (
							<Field>
								<Controller
									name="TEAM_MEMBERS"
									control={control}
									rules={{}}
									render={({ field }) => {
										const selectedValues = Array.isArray(
											field.value,
										)
											? field.value
											: [];

										const toggleMember = (
											memberId: string,
										) => {
											if (
												selectedValues.includes(
													memberId,
												)
											) {
												field.onChange(
													selectedValues.filter(
														(selectedId) =>
															selectedId !==
															memberId,
													),
												);
												return;
											}

											field.onChange([
												...selectedValues,
												memberId,
											]);
										};

										return (
											<>
												<FieldLabel>Members</FieldLabel>
												<Popover
													open={membersPopoverOpen}
													onOpenChange={
														setMembersPopoverOpen
													}
												>
													<PopoverTrigger asChild>
														<Button
															type="button"
															variant="outline"
															role="combobox"
															aria-expanded={
																membersPopoverOpen
															}
															className="w-full justify-between font-normal"
															disabled={
																isLoadingMembers
															}
														>
															<span className="truncate">
																{
																	selectedMembersLabel
																}
															</span>
															<ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
														</Button>
													</PopoverTrigger>
													<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
														<Command>
															<CommandInput placeholder="Search members..." />
															<CommandList>
																<CommandEmpty>
																	No members
																	found.
																</CommandEmpty>
																<CommandGroup>
																	{memberOptions.map(
																		(
																			member,
																		) => (
																			<CommandItem
																				key={`member-${member.id}`}
																				value={`${member.name} ${member.id} ${member.type}`}
																				onSelect={() =>
																					toggleMember(
																						member.id,
																					)
																				}
																			>
																				<Checkbox
																					checked={selectedValues.includes(
																						member.id,
																					)}
																					className="mr-2"
																				/>
																				<div className="flex min-w-0 flex-col">
																					<span className="truncate">
																						{
																							member.name
																						}
																					</span>
																					<span className="text-muted-foreground text-xs">
																						{
																							member.id
																						}
																					</span>
																				</div>
																				{selectedValues.includes(
																					member.id,
																				) ? (
																					<Check className="ml-auto size-4" />
																				) : null}
																			</CommandItem>
																		),
																	)}
																</CommandGroup>
															</CommandList>
														</Command>
													</PopoverContent>
												</Popover>
											</>
										);
									}}
								/>
							</Field>
						) : null}
					</div>
					<DialogFooter>
						<div className="flex flex-row gap-2">
							<Button
								type="button"
								variant="ghost"
								onClick={() => {
									reset();
									onClose();
								}}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={!isValid}>
								{isEdit ? "Update" : "Add"}
							</Button>
						</div>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
