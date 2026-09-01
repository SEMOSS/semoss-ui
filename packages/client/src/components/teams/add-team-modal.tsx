import { Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	getLoginProviderInitials,
	getLoginProviderKey,
	loadLoginProviderLogos,
} from "@semoss/shared";
import {
	Button,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { addTeam, editTeam } from "@/api/teams";
import { useRootStore } from "@/hooks";
import { useNavigate } from "@/hooks/useNavigate";

type TeamReturn = {
	id: string;
	type: string;
	description: string;
	previousTeamName?: string;
};

type NewTeamForm = {
	TEAM_NAME: string;
	TEAM_DESCRIPTION: string;
	TEAM_TYPE: string;
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
}

export const AddTeamModal = (props: AddTeamModalProps) => {
	const { open, onClose, isEdit, id, type, description } = props;

	const navigate = useNavigate();
	const { configStore } = useRootStore();
	const [providerLogos, setProviderLogos] = useState<Record<string, string>>(
		{},
	);

	// State to track the previous team name, type
	const [previousTeamName, setPreviousTeamName] = useState<
		string | undefined
	>(id);
	const [_previousType, setPreviousType] = useState<string | undefined>(id);
	const {
		handleSubmit,
		control,
		reset,
		formState: { isValid },
		watch,
	} = useForm<NewTeamForm>({
		defaultValues: {
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: type,
		},
		mode: "onChange", // Ensures validation updates on field changes
	});

	useEffect(() => {
		reset({
			TEAM_NAME: id || "",
			TEAM_DESCRIPTION: description || "",
			TEAM_TYPE: type,
		});

		// Update the previous team name when the modal is opened
		setPreviousTeamName(id);
		setPreviousType(type);
	}, [id, type, description, reset]);

	const selectedTeamType = watch("TEAM_TYPE");

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
				toast.error("Error updating team");
			}
		} else {
			// Logic for creating a new team
			try {
				const response = await addTeam(
					data.TEAM_NAME,
					data.TEAM_DESCRIPTION,
					false,
					data.TEAM_TYPE,
				);
				if (response.data) {
					onClose({
						id: data.TEAM_NAME,
						type: data.TEAM_TYPE,
						description: data.TEAM_DESCRIPTION,
					});
					reset();
					toast.success("Successfully added team");
					navigate(
						`${encodeURIComponent(data.TEAM_TYPE)}/${encodeURIComponent(data.TEAM_NAME)}`,
					);
				} else {
					throw new Error("Failed to add team");
				}
			} catch (e) {
				console.error(e);
				toast.error("Error adding team");
			}
		}
	});

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
							<Controller
								name="TEAM_TYPE"
								control={control}
								rules={{
									required: "Please select a team type",
								}}
								render={({ field, fieldState: { error } }) => {
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
												onValueChange={(value) =>
													field.onChange(value)
												}
												disabled={isEdit}
											>
												<SelectTrigger
													className="w-full"
													aria-invalid={!!error}
												>
													<SelectValue placeholder="Select a team type">
														{field.value
															? loginTypes.find(
																	(p) =>
																		p.provider ===
																		field.value,
																)?.name
															: "Select a team type"}
													</SelectValue>
												</SelectTrigger>
												<SelectContent>
													{(() => {
														const filteredTypes = [
															...loginTypes,
														]
															.sort((a, b) =>
																a.name.localeCompare(
																	b.name,
																),
															)
															.filter(
																(p) =>
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
								rules={{ required: "Team name is required" }}
								render={({ field, fieldState: { error } }) => {
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
											{selectedTeamType !== "CUSTOM" &&
											selectedTeamType !== "" ? (
												<FieldDescription className="pl-3.5 text-[12px] text-muted-foreground leading-[20px] tracking-[0.4px]">
													Must be the name of the
													group/team from your IdP
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

						<Field>
							<Controller
								name="TEAM_DESCRIPTION"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<>
											<FieldLabel>Description</FieldLabel>
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
