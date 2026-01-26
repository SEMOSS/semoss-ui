import {
	CloudUploadRounded,
	DownloadForOfflineRounded,
	LocalPoliceRounded,
} from "@mui/icons-material";
import type { AxiosResponse } from "axios";
import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	List,
	Modal,
	Select,
	Stack,
	Switch,
	styled,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import { createUser, editMemberInfo } from "@/api";
import { useRootStore, useSettings } from "@/hooks";

const StyledModalContent = styled(Modal.Content)(() => ({
	maxWidth: "50rem",
}));

const StyledForm = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledListItem = styled(List.Item)({
	padding: "4px 0",
});

const StyledList = styled(List)({
	padding: 0,
});

const StyledCountryCodeExt = styled(TextField)({
	width: "168px",
});

const StyledPhoneNumber = styled(TextField)({
	width: "550px",
});

const StyledPermissions = styled(Typography)({
	padding: "25px 0",
});

const StyledSubmitForm = styled("form")(() => ({
	overflowY: "auto",
}));

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
	const notification = useNotification();

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
	}, [user, open]);

	const type = watch("type", "");
	const limitType = watch("model_usage_restriction", "");
	const email = watch("email");

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
					notification.add({
						color: "success",
						message: isNewUser
							? "Successfully added user"
							: "Successfully editted user",
					});

					success = true;
				} else {
					notification.add({
						color: "error",
						message: isNewUser
							? "Error adding user"
							: "Error editting user",
					});
				}
			} catch (e) {
				notification.add({
					color: "error",
					message: String(e),
				});
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

			notification.add({
				color: "error",
				message: `Form is Invalid. ${errorMessages.join(" ")}`,
			});
		},
	);

	return (
		<Modal open={open} maxWidth="lg">
			<Modal.Title>
				{isNewUser ? "Add Member" : "Edit Member"}
			</Modal.Title>
			<StyledSubmitForm onSubmit={editUser}>
				<StyledModalContent>
					<StyledForm>
						<Typography variant="subtitle1">Credentials</Typography>
						<Stack direction={"column"} gap={1}>
							<Controller
								name="type"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<Select
											label="Type"
											disabled={!isNewUser}
											value={
												field.value ? field.value : ""
											}
											onChange={(e) => {
												field.onChange(e.target.value);
											}}
										>
											{configStore.store.config.availableProviders.map(
												(option, i) => {
													return (
														<Select.Item
															value={option.label}
															key={`type-${option.label}-${i}`}
														>
															{option.label}
														</Select.Item>
													);
												},
											)}
										</Select>
									);
								}}
							/>
							<Controller
								name="id"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<TextField
											label="User Id"
											disabled={!isNewUser}
											value={
												field.value ? field.value : ""
											}
											onChange={(e) => {
												field.onChange(e.target.value);
											}}
										></TextField>
									);
								}}
							/>
							<Controller
								name="username"
								control={control}
								rules={{}}
								render={({ field }) => {
									return (
										<TextField
											label="Username"
											disabled={
												!!(
													user?.type === "NATIVE" ||
													type === "NATIVE"
												)
											}
											value={
												isNewUser && type === "NATIVE"
													? "This wil match the User Id"
													: field.value
														? field.value
														: ""
											}
											onChange={(e) => {
												field.onChange(e.target.value);
											}}
										></TextField>
									);
								}}
							/>
						</Stack>
						{type.toLowerCase() === "native" && (
							<>
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
											<TextField
												label="Password"
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
											></TextField>
										);
									}}
								/>

								{errors.password && (
									<Typography
										variant={"caption"}
										color={"error"}
									>
										Note: Password must have one letter, one
										capital, one number, one special
										character, and be a minimum of 8
										characters.
									</Typography>
								)}
							</>
						)}
						<Typography variant="subtitle1">Details</Typography>
						<Stack direction={"column"} gap={1}>
							<Controller
								name={"name"}
								control={control}
								rules={{
									required: true,
								}}
								render={({ field }) => {
									return (
										<TextField
											label="Name"
											value={
												field.value ? field.value : ""
											}
											onChange={(e) =>
												field.onChange(e.target.value)
											}
										></TextField>
									);
								}}
							/>
							<Controller
								name={"email"}
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
										<TextField
											label="Email"
											value={
												field.value ? field.value : ""
											}
											onChange={(e) =>
												field.onChange(e.target.value)
											}
											type="email"
										></TextField>
									);
								}}
							/>
							<Stack direction={"row"} gap={1}>
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
											<Stack>
												<StyledPhoneNumber
													label="Phone Number"
													fullWidth
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
												></StyledPhoneNumber>
												{errors.phone && (
													<Typography
														variant={"caption"}
														color={"error"}
													>
														Note: Phone number must
														be in the format (XXX)
														XXX-XXXX or XXX-XXX-XXXX
													</Typography>
												)}
											</Stack>
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
											<StyledCountryCodeExt
												label="Extension"
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
											></StyledCountryCodeExt>
										);
									}}
								/>
							</Stack>
						</Stack>
						<Typography variant="subtitle1">
							Model Limit Restrictions
						</Typography>
						<Stack direction={"column"} gap={1}>
							<Controller
								name="model_usage_restriction"
								defaultValue={"null"}
								control={control}
								rules={{ required: true }}
								render={({ field }) => {
									return (
										<Select
											label="Limit Type"
											value={
												field.value ? field.value : ""
											}
											onChange={(e) => {
												field.onChange(e.target.value);
											}}
											data-testid="model-usage-restriction"
										>
											{Object.entries(
												usageRestritctionTypes,
											).map((option, _i) => {
												return (
													<Select.Item
														value={option[0]}
														key={`LimitType-${option[0]}`}
													>
														{option[1]}
													</Select.Item>
												);
											})}
										</Select>
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
											<TextField
												label="Max Tokens"
												value={
													field.value
														? field.value
														: ""
												}
												type="number"
												onChange={(e) => {
													field.onChange(
														Number(e.target.value),
													);
												}}
												data-testid="model-max-tokens"
											></TextField>
										);
									}}
								/>
							)}
							{limitType === "compute" && (
								<Stack direction={"row"} gap={1}>
									<Controller
										name="model_max_response_time"
										control={control}
										rules={{ required: true }}
										render={({ field }) => {
											return (
												<TextField
													label="Max Response Time"
													value={
														field.value
															? field.value
															: ""
													}
													type="number"
													onChange={(e) => {
														field.onChange(
															Number(
																e.target.value,
															),
														);
													}}
													data-testid="model-max-response-time"
												></TextField>
											);
										}}
									/>
									<Controller
										name="unit"
										control={control}
										rules={{}}
										render={() => {
											return (
												<Select
													label="Unit"
													value={unitTypes[0]}
													data-testid="unit-select"
												>
													{unitTypes.map(
														(option, _i) => {
															return (
																<Select.Item
																	value={
																		option
																	}
																	key={`UnitType-${option}`}
																	data-testid={`unit-select-${option}`}
																>
																	{option}
																</Select.Item>
															);
														},
													)}
												</Select>
											);
										}}
									/>
								</Stack>
							)}
							{limitType !== "null" && (
								<Controller
									name="model_usage_frequency"
									control={control}
									rules={{}}
									render={({ field }) => {
										return (
											<Select
												label="Frequency"
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
												data-testid="model-usage-frequency"
											>
												{Object.entries(
													frequencyTypes,
												).map((option, _i) => {
													return (
														<Select.Item
															value={option[0]}
															key={`FrequencyType-${option[0]}`}
															data-testid={`frequency-select-${option[0]}`}
														>
															{option[1]}
														</Select.Item>
													);
												})}
											</Select>
										);
									}}
								/>
							)}
						</Stack>

						<StyledPermissions variant="subtitle1">
							Permissions
						</StyledPermissions>

						<StyledList>
							<StyledListItem
								secondaryAction={
									<Controller
										name={"admin"}
										control={control}
										render={({ field }) => {
											return (
												<Switch
													color="primary"
													checked={field.value}
													onChange={() =>
														field.onChange(
															!field.value,
														)
													}
													data-testid={`admin-switch-${field.value}`}
												/>
											);
										}}
									/>
								}
							>
								<List.ItemIcon>
									<LocalPoliceRounded />
								</List.ItemIcon>
								<List.ItemText
									primary={<strong>Admin</strong>}
									secondary="Complete access to platform"
								/>
							</StyledListItem>

							<StyledListItem
								secondaryAction={
									<Controller
										name={"publisher"}
										control={control}
										render={({ field }) => {
											return (
												<Switch
													color="primary"
													checked={field.value}
													onChange={() =>
														field.onChange(
															!field.value,
														)
													}
													data-testid={`publisher-switch-${field.value}`}
												/>
											);
										}}
									/>
								}
							>
								<List.ItemIcon>
									<CloudUploadRounded />
								</List.ItemIcon>
								<List.ItemText
									primary={<strong>Publisher</strong>}
									secondary=" Able to upload data to platform"
								/>
							</StyledListItem>

							<StyledListItem
								secondaryAction={
									<Controller
										name={"exporter"}
										control={control}
										render={({ field }) => {
											return (
												<Switch
													color="primary"
													checked={field.value}
													onChange={() =>
														field.onChange(
															!field.value,
														)
													}
													data-testid={`exporter-switch-${field.value}`}
												/>
											);
										}}
									/>
								}
							>
								<List.ItemIcon>
									<DownloadForOfflineRounded />
								</List.ItemIcon>
								<List.ItemText
									primary={<strong>Exporter</strong>}
									secondary="Able to export data from platform"
								/>
							</StyledListItem>
						</StyledList>
					</StyledForm>
				</StyledModalContent>
			</StyledSubmitForm>
			<Modal.Actions>
				<Button variant="outlined" onClick={() => onClose(false)}>
					Cancel
				</Button>
				<Button
					variant="contained"
					color="primary"
					onClick={() => editUser()}
				>
					Save
				</Button>
			</Modal.Actions>
		</Modal>
	);
});
