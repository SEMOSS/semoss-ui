import type { AxiosResponse } from "axios";
import { Download, Shield, Upload } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
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
	Switch,
	toast,
} from "@semoss/ui/next";
import { createUser, editMemberInfo } from "@/api";
import { useRootStore, useSettings } from "@/hooks";

interface User {
	id: string;
	type: string;
	name?: string;
	admin?: boolean;
	publisher?: boolean;
	exporter?: boolean;
	email?: string;
	phone?: string;
	phoneextension?: string;
	username?: string;
	model_usage_restriction?: string;
	model_usage_frequency?: string;
	model_max_tokens?: number;
	model_max_response_time?: number;
	unit?: string;
}

interface EditUserForm {
	id: string;
	newId: string;
	username: string;
	newUsername: string;
	name: string;
	password: string;
	email: string;
	newEmail: string;
	phone: string;
	phoneextension: string;
	countrycode: string;
	admin: boolean;
	exporter: boolean;
	publisher: boolean;
	type: string;
	model_usage_restriction?: string;
	model_usage_frequency?: string;
	model_max_tokens?: number;
	model_max_response_time?: number;
	unit?: string;
}

const passwordValidate = (password: string) => {
	if (!password) {
		return true;
	}
	if (!password.match(/[a-z]/g)) {
		return false;
	}

	if (!password.match(/[A-Z]/g)) {
		return false;
	}

	if (!password.match(/[0-9]/g)) {
		return false;
	}

	if (!password.match(/[!@#$%^&*]/g)) {
		return false;
	}

	return true;
};

const numberValidate = (number: string) => {
	if (!number) {
		return false;
	}

	const formatOne = /^\(\d{3}\) \d{3}-\d{4}$/;
	const formatTwo = /^\d{3}-\d{3}-\d{4}$/;
	const formatThree = /^\d{10}$/;

	return (
		formatOne.test(number) ||
		formatTwo.test(number) ||
		formatThree.test(number)
	);
};

const emailValidate = (email: string) => {
	if (!email) {
		return true;
	}

	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	return emailRegex.test(email);
};

interface UserAddOverlayProps {
	/**
	 * Track if the model is open or close
	 */
	open: boolean;

	/**
	 * User that is being edited
	 */
	user: User | null;

	/**
	 * Called on close
	 *
	 * @returns - method that is called onClose
	 */
	onClose: (success: boolean) => void;
}

export const UserAddOverlay = observer((props: UserAddOverlayProps) => {
	const { open = false, user = null, onClose = () => null } = props;

	const { configStore } = useRootStore();
	const { adminMode } = useSettings();

	const isNewUser = user === null;

	const {
		control,
		reset,
		handleSubmit,
		watch,
		formState: { errors },
	} = useForm<EditUserForm>({
		defaultValues: {
			id: user?.id,
			username: user?.username,
			name: user?.name,
			email: user?.email,
			phone: user?.phone,
			phoneextension: user?.phoneextension,
			admin: user?.admin,
			exporter: user?.exporter,
			publisher: user?.exporter,
			type: user?.type,
			model_usage_restriction: user?.model_usage_restriction
				? user?.model_usage_restriction
				: "null",
			model_usage_frequency: user?.model_usage_frequency,
			model_max_tokens: user?.model_max_tokens,
			model_max_response_time: user?.model_max_response_time,
		},
	});

	useEffect(() => {
		// reset on open or close
		reset({
			...(user || {}),
			model_usage_restriction: user?.model_usage_restriction ?? "null", // always set default for new user
		});
	}, [user, reset]);

	const type = watch("type", "");
	const limitType = watch("model_usage_restriction", "");
	const email = watch("email");
	const userId = watch("id", "");
	const userName = watch("name", "");
	const isSaveDisabled = !userId?.trim() || !userName?.trim();

	const usageRestritctionTypes: Record<string, string> = {
		null: "None",
		token: "Token",
		compute: "Compute time",
	};
	const frequencyTypes: Record<string, string> = {
		DAY: "Daily",
		WEEK: "Weekly",
		MONTH: "Monthly",
	};
	const unitTypes: string[] = ["milliseconds"];

	/**
	 * Create / edit the user
	 */
	const editUser = handleSubmit(
		async (data: EditUserForm) => {
			if (email !== user?.email) {
				data.newEmail = email;
			}
			let success = false;

			try {
				let response:
					| AxiosResponse<boolean>
					| {
							response: Response;
							data: boolean;
					  }
					| null = null;

				if (data.model_usage_restriction === "token") {
					data.model_max_response_time = null;
				}
				if (data.model_usage_restriction === "compute") {
					data.model_max_tokens = null;
				}
				if (data.model_usage_restriction === "null") {
					data.model_usage_restriction = null;
					data.model_max_response_time = null;
					data.model_max_tokens = null;
					data.model_usage_frequency = null;
				}

				if (isNewUser) {
					response = await createUser(
						adminMode,
						data as unknown as Record<string, unknown>,
					);
				} else {
					if (
						data.exporter === undefined ||
						data.publisher === undefined
					) {
						if (data.exporter) {
							data.publisher = false;
						} else if (data.publisher) {
							data.exporter = false;
						} else {
							data.publisher = false;
							data.exporter = false;
						}
					}
					response = await editMemberInfo(adminMode, data);
				}

				if (!response) {
					return;
				}

				// ignore if there is no response
				if (response.data) {
					toast.success(
						isNewUser
							? "Successfully added user"
							: "Successfully editted user",
					);

					success = true;
				} else {
					toast.error(
						isNewUser ? "Error adding user" : "Error editting user",
					);
				}
			} catch (e) {
				toast.error(String(e));
			} finally {
				// close the overlay
				onClose(success);
			}
		},
		(e) => {
			console.warn(e);

			const errorMessages = [];
			for (const error in e) {
				if (
					Object.hasOwn(e[error], "message") &&
					e[error].message !== ""
				) {
					errorMessages.push(`${e[error].message}.`);
				} else if (
					Object.hasOwn(e[error], "type") &&
					e[error].type === "required"
				) {
					errorMessages.push(`${error} is a required field.`);
				}
			}

			toast.error(`Form is Invalid. ${errorMessages.join(" ")}`);
		},
	);

	return (
		<Dialog
			open={open}
			onOpenChange={(isOpen) => !isOpen && onClose(false)}
		>
			<DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle>
						{isNewUser ? "Add Member" : "Edit Member"}
					</DialogTitle>
				</DialogHeader>
				<form onSubmit={editUser} className="space-y-6">
					<section className="space-y-3">
						<p className="font-medium text-sm">Credentials</p>
						<div className="grid gap-4">
							<Controller
								name="type"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>Type</Label>
											<Select
												disabled={!isNewUser}
												value={
													field.value
														? field.value
														: ""
												}
												onValueChange={(value) => {
													field.onChange(value);
												}}
											>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
												<SelectContent>
													{configStore.store.config.availableProviders.map(
														(option, i) => {
															return (
																<SelectItem
																	value={
																		option.label
																	}
																	key={`type-${option.label}-${i}`}
																>
																	{
																		option.label
																	}
																</SelectItem>
															);
														},
													)}
												</SelectContent>
											</Select>
										</div>
									);
								}}
							/>
							<Controller
								name="id"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>User Id *</Label>
											<Input
												disabled={!isNewUser}
												value={
													field.value
														? field.value
														: ""
												}
												onChange={(e) => {
													field.onChange(
														e.target.value,
													);
												}}
											/>
										</div>
									);
								}}
							/>
							<Controller
								name="username"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>Username</Label>
											<Input
												disabled={
													!!(
														user?.type ===
															"NATIVE" ||
														type === "NATIVE"
													)
												}
												value={
													isNewUser &&
													type === "NATIVE"
														? "This wil match the User Id"
														: field.value
															? field.value
															: ""
												}
												onChange={(e) => {
													field.onChange(
														e.target.value,
													);
												}}
											/>
										</div>
									);
								}}
							/>
						</div>
						{type.toLowerCase() === "native" && (
							<div className="grid gap-2">
								<Controller
									name="password"
									control={control}
									rules={{
										required: false,
										minLength: 8,
										validate: (value) =>
											passwordValidate(value),
									}}
									render={({ field }) => {
										return (
											<div className="grid gap-1.5">
												<Label>Password</Label>
												<Input
													type="password"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(e) => {
														field.onChange(
															e.target.value,
														);
													}}
												/>
											</div>
										);
									}}
								/>

								{errors.password && (
									<p className="text-destructive text-xs">
										Note: Password must have one letter, one
										capital, one number, one special
										character, and be a minimum of 8
										characters.
									</p>
								)}
							</div>
						)}
					</section>

					<section className="space-y-3">
						<p className="font-medium text-sm">Details</p>
						<div className="grid gap-4">
							<Controller
								name="name"
								control={control}
								rules={{
									required: true,
								}}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>Name *</Label>
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
											/>
										</div>
									);
								}}
							/>
							<Controller
								name="email"
								control={control}
								rules={{
									required: false,
									validate: (value) => {
										if (value === "") {
											return true;
										}
										emailValidate(value);
									},
									pattern: {
										value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
										message:
											"Email does not match a valid format",
									},
								}}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>Email</Label>
											<Input
												type="email"
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
											/>
										</div>
									);
								}}
							/>
							<div className="flex flex-col gap-3 md:flex-row">
								<Controller
									name="phone"
									control={control}
									rules={{
										validate: (value) => {
											if (value === "") {
												return true;
											}
											numberValidate(value);
										},
										pattern: {
											value: /^\(\d{3}\) \d{3}-\d{4}$|^\d{3}-\d{3}-\d{4}$|^\d{10}$/,
											message:
												"Phone number must be in the format (XXX) XXX-XXXX or XXX-XXX-XXXX",
										},
									}}
									render={({ field }) => {
										return (
											<div className="flex-1 space-y-1.5">
												<Label>Phone Number</Label>
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
												/>
												{errors.phone && (
													<p className="text-destructive text-xs">
														Note: Phone number must
														be in the format (XXX)
														XXX-XXXX or XXX-XXX-XXXX
													</p>
												)}
											</div>
										);
									}}
								/>
								<Controller
									name="phoneextension"
									control={control}
									rules={{
										pattern: /^[+0-9]{0,6}$/,
									}}
									render={({ field }) => {
										return (
											<div className="w-full max-w-[180px] space-y-1.5">
												<Label>Extension</Label>
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
												/>
											</div>
										);
									}}
								/>
							</div>
						</div>
					</section>

					<section className="space-y-3">
						<p className="font-medium text-sm">
							Model Limit Restrictions
						</p>
						<div className="grid gap-4">
							<Controller
								name="model_usage_restriction"
								defaultValue={"null"}
								control={control}
								rules={{ required: true }}
								render={({ field }) => {
									return (
										<div className="grid gap-1.5">
											<Label>Limit Type</Label>
											<Select
												value={
													field.value
														? field.value
														: ""
												}
												onValueChange={(value) => {
													field.onChange(value);
												}}
												data-testid="model-usage-restriction"
											>
												<SelectTrigger>
													<SelectValue placeholder="Select limit type" />
												</SelectTrigger>
												<SelectContent>
													{Object.entries(
														usageRestritctionTypes,
													).map((option, _i) => {
														return (
															<SelectItem
																value={
																	option[0]
																}
																key={`LimitType-${option[0]}`}
															>
																{option[1]}
															</SelectItem>
														);
													})}
												</SelectContent>
											</Select>
										</div>
									);
								}}
							/>
							{limitType === "token" && (
								<Controller
									name="model_max_tokens"
									control={control}
									rules={{ required: true }}
									render={({ field }) => {
										return (
											<div className="grid gap-1.5">
												<Label>Max Tokens</Label>
												<Input
													type="number"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(e) => {
														field.onChange(
															Number(
																e.target.value,
															),
														);
													}}
													data-testid="model-max-tokens"
												/>
											</div>
										);
									}}
								/>
							)}
							{limitType === "compute" && (
								<div className="grid gap-4 md:grid-cols-[2fr_1fr]">
									<Controller
										name="model_max_response_time"
										control={control}
										rules={{ required: true }}
										render={({ field }) => {
											return (
												<div className="grid gap-1.5">
													<Label>
														Max Response Time
													</Label>
													<Input
														type="number"
														value={
															field.value
																? field.value
																: ""
														}
														onChange={(e) => {
															field.onChange(
																Number(
																	e.target
																		.value,
																),
															);
														}}
														data-testid="model-max-response-time"
													/>
												</div>
											);
										}}
									/>
									<Controller
										name="unit"
										control={control}
										rules={{}}
										render={() => {
											return (
												<div className="grid gap-1.5">
													<Label>Unit</Label>
													<Select
														value={unitTypes[0]}
														data-testid="unit-select"
													>
														<SelectTrigger>
															<SelectValue />
														</SelectTrigger>
														<SelectContent>
															{unitTypes.map(
																(
																	option,
																	_i,
																) => {
																	return (
																		<SelectItem
																			value={
																				option
																			}
																			key={`UnitType-${option}`}
																			data-testid={`unit-select-${option}`}
																		>
																			{
																				option
																			}
																		</SelectItem>
																	);
																},
															)}
														</SelectContent>
													</Select>
												</div>
											);
										}}
									/>
								</div>
							)}
							{limitType !== "null" && (
								<Controller
									name="model_usage_frequency"
									control={control}
									rules={{}}
									render={({ field }) => {
										return (
											<div className="grid gap-1.5">
												<Label>Frequency</Label>
												<Select
													value={
														field.value
															? field.value
															: ""
													}
													onValueChange={(value) => {
														field.onChange(value);
													}}
													data-testid="model-usage-frequency"
												>
													<SelectTrigger>
														<SelectValue placeholder="Select frequency" />
													</SelectTrigger>
													<SelectContent>
														{Object.entries(
															frequencyTypes,
														).map((option, _i) => {
															return (
																<SelectItem
																	value={
																		option[0]
																	}
																	key={`FrequencyType-${option[0]}`}
																	data-testid={`frequency-select-${option[0]}`}
																>
																	{option[1]}
																</SelectItem>
															);
														})}
													</SelectContent>
												</Select>
											</div>
										);
									}}
								/>
							)}
						</div>
					</section>

					<section className="space-y-3">
						<p className="font-medium text-sm">Permissions</p>
						<div className="space-y-2">
							<div className="flex items-start justify-between gap-4 rounded-md border border-border/60 p-3">
								<div className="flex items-start gap-3">
									<Shield className="mt-0.5 size-4 text-muted-foreground" />
									<div>
										<p className="font-medium text-sm">
											Admin
										</p>
										<p className="text-muted-foreground text-sm">
											Complete access to platform
										</p>
									</div>
								</div>
								<Controller
									name="admin"
									control={control}
									render={({ field }) => {
										return (
											<Switch
												checked={Boolean(field.value)}
												onCheckedChange={(value) =>
													field.onChange(value)
												}
												data-testid={`admin-switch-${field.value}`}
											/>
										);
									}}
								/>
							</div>

							<div className="flex items-start justify-between gap-4 rounded-md border border-border/60 p-3">
								<div className="flex items-start gap-3">
									<Upload className="mt-0.5 size-4 text-muted-foreground" />
									<div>
										<p className="font-medium text-sm">
											Publisher
										</p>
										<p className="text-muted-foreground text-sm">
											Able to upload data to platform
										</p>
									</div>
								</div>
								<Controller
									name="publisher"
									control={control}
									render={({ field }) => {
										return (
											<Switch
												checked={Boolean(field.value)}
												onCheckedChange={(value) =>
													field.onChange(value)
												}
												data-testid={`publisher-switch-${field.value}`}
											/>
										);
									}}
								/>
							</div>

							<div className="flex items-start justify-between gap-4 rounded-md border border-border/60 p-3">
								<div className="flex items-start gap-3">
									<Download className="mt-0.5 size-4 text-muted-foreground" />
									<div>
										<p className="font-medium text-sm">
											Exporter
										</p>
										<p className="text-muted-foreground text-sm">
											Able to export data from platform
										</p>
									</div>
								</div>
								<Controller
									name="exporter"
									control={control}
									render={({ field }) => {
										return (
											<Switch
												checked={Boolean(field.value)}
												onCheckedChange={(value) =>
													field.onChange(value)
												}
												data-testid={`exporter-switch-${field.value}`}
											/>
										);
									}}
								/>
							</div>
						</div>
					</section>

					<DialogFooter>
						<Button
							variant="outline"
							type="button"
							onClick={() => onClose(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSaveDisabled}>
							Save
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
});
