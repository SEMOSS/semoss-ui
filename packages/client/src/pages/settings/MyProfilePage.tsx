import {
	Add,
	ContentCopyOutlined,
	Delete,
	KeyboardArrowDown,
	KeyboardArrowUp,
} from "@mui/icons-material";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Alert,
	Avatar,
	Button,
	Collapse,
	Grid,
	IconButton,
	LoadingScreen,
	Modal,
	Paper,
	Stack,
	styled,
	Table,
	TextField,
	Typography,
	useNotification,
} from "@semoss/ui";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import {
	createUserAccessKey,
	deleteUserAccessKeys,
	editMemberInfo,
	setUserMetadata,
} from "@/api/auth";
import { useAPI, useRootStore, useSettings } from "@/hooks";
import { getSDKSnippet } from "@/utility";
import { ChangePasswordModal } from "./ChangePasswordModal";

const StyledAvatar = styled(Avatar)({
	display: "flex",
	alignContent: "center",
	justifyContent: "center",
	backgroundColor: "#975FE4",
});

const StyledPaper = styled(Paper)({
	padding: "40px 30px 20px 50px",
});

const StyledAccessTokensPaper = styled(Paper)({
	padding: "40px 30px 20px 28px",
});

const HeaderCell = styled(Table.Cell)({
	backgroundColor: "#f3f3f3",
	borderBottom: "1px solid #ccc",
});

const LeftHeaderCell = styled(Table.Cell)({
	backgroundColor: "#f3f3f3",
	borderBottom: "1px solid #ccc",
	borderRadius: "20px 0 0 0",
	textAlign: "center",
});

const RightHeaderCell = styled(Table.Cell)({
	backgroundColor: "#f3f3f3",
	borderBottom: "1px solid #ccc",
	borderRadius: "0 20px 0 0",
	textAlign: "center",
});

const MessageDiv = styled("div")({
	textAlign: "center",
	marginTop: "100px",
	fontSize: "13px",
	display: "block",
	color: "#666",
	width: "100%",
	margin: "75px auto 85px",
});

const AvatarForm = styled("form")({
	paddingTop: "15px",
	width: "750px",
});

const CurrentAvatarStack = styled(Stack)({
	alignItems: "center",
});

const StyledTableContainer = styled(Table.Container)({
	marginTop: "20px",
});

const StyledGrid = styled(Grid)({
	marginBottom: "40px",
});

const MonolithGrid = styled(Grid)({
	display: "flex",
	alignItems: "center",
});

const StyledStack = styled(Stack)({
	marginBottom: "15px",
});

const CopyGridItem = styled(Grid)({
	padding: 0,
	display: "flex",
	justifyContent: "right",
});

const GridItem = styled(Grid)({
	padding: 0,
});

const CustomGridItem = styled(GridItem)({
	padding: 0,
	zIndex: 8,
});

const _StyledCodeBlock = styled("pre")(({ theme }) => ({
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(5),
	background: theme.palette.background.default,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(2),
	overflowX: "scroll",
	margin: "0px",
}));

const StyledCodeContent = styled("code", {
	shouldForwardProp: (prop) => prop !== "maxWidth",
})<{
	/** Track if the page header is stuck */
	maxWidth?: string;
}>(({ theme, maxWidth }) => ({
	flex: 1,
	maxWidth: maxWidth ? maxWidth : "auto",
	overflowY: "scroll",
}));

const StyledSDKBlock = styled("pre")(({ theme }) => ({
	display: "flex",
	alignItems: "flex-start",
	gap: "40px",
	background: theme.palette.background.paper,
	borderRadius: theme.shape.borderRadius,
	padding: theme.spacing(2),
	margin: "0px",
}));

const StyledCreatedKeyContainer = styled(Stack)(({ theme }) => ({
	background: theme.palette.background.default,
	padding: theme.spacing(1),
}));

const StyledLink = styled("a")(({ theme }) => ({
	textDecoration: "underline",
	cursor: "pointer",
	color: "#0471F0",
	fontFamily: "Inter",
	fontStyle: "normal",
	fontWeight: 500,
	fontSize: "16px",
	lineHeight: "24px",
	letterSpacing: "0.15px",
}));

interface CreateAccessKeyForm {
	TOKENNAME: string;
	TOKENDESCRIPTION?: string;
	ACCESSKEY: string;
	SECRETKEY: string;
	PLACEHOLDER: string;
}

interface Engine {
	app_id: string;
	app_name: string;
	app_subtype?: string;
}

interface EditUserInfoForm {
	NAME: string;
	USERNAME: string;
	EMAIL: string;
	USERID?: string | undefined;
}

export const MyProfilePage = () => {
	const modelSelectId = useId();
	const notification = useNotification();
	const { configStore } = useRootStore();
	const { email, id, name } = configStore.store.user;
	const { isNative } = configStore.store;
	const { adminMode } = useSettings();

	// track the models
	const [addModal, setAddModal] = useState(false);
	const [profileImgModal, setProfileImgModal] = useState(false);
	const [passwordModal, setPasswordModal] = useState(false);
	const [editName, setEditName] = useState(name);
	const [editEmail, setEditEmail] = useState(email);

	// get the keys
	const getUserAccessKeys = useAPI(["getUserAccessKeys"]);

	// get engines/models
	const getEngines = useAPI(["getEngines", adminMode, "", "MODEL"]);

	// track selected default model
	const [selectedDefaultModel, setSelectedDefaultModel] =
		useState<string>("");
	const [selectedCodeDefaultModel, setSelectedCodeDefaultModel] = useState<string>("");

	// NATIVE Login USERID must match Username
	const logins = configStore.store.config.logins;
	const nativeLogin = (logins as unknown as { NATIVE: string })?.NATIVE;

	const { control, reset, setValue, handleSubmit, watch } =
		useForm<CreateAccessKeyForm>({
			defaultValues: {
				TOKENNAME: "",
				TOKENDESCRIPTION: "",
				ACCESSKEY: "",
				SECRETKEY: "",
				PLACEHOLDER: "",
			},
		});

	const {
		control: userInfoControl,
		reset: userInfoReset,
		handleSubmit: userInfoHandleSubmit,
		watch: userInfoWatch,
	} = useForm<EditUserInfoForm>({
		defaultValues: {
			NAME: name,
			USERNAME: id,
			USERID: id,
			EMAIL: email,
		},
	});

	const ACCESSKEY = watch("ACCESSKEY");
	const SECRETKEY = watch("SECRETKEY");

	// track if we can create a key
	const isCreated = !!(ACCESSKEY && SECRETKEY);

	const [isJsSdkOpen, setIsJsSdkOpen] = useState(false);
	const [isPySdkOpen, setIsPySdkOpen] = useState(false);

	const engines =
		getEngines.status === "SUCCESS" && Array.isArray(getEngines.data)
			? (getEngines.data as unknown as Engine[]).filter(
					(e) => e.app_subtype !== "EMBEDDED",
				)
			: [];

	useEffect(() => {
		if (configStore.defaultTextGenerationModel && engines.length > 0) {
			// defaultModel now returns the UUID value, find the engine with matching app_id
			const matchingEngine = engines.find(
				(e) => e.app_id === configStore.defaultTextGenerationModel,
			);
			if (matchingEngine) {
				setSelectedDefaultModel(matchingEngine.app_id);
			}
		}
		if(configStore.defaultCodeGenerationModel && engines.length > 0) {
			const matchingCodeEngine = engines.find(
				(e) => e.app_id === configStore.defaultCodeGenerationModel,
			);
			if(matchingCodeEngine) {
				setSelectedCodeDefaultModel(matchingCodeEngine.app_id);
			}
		}
	}, [configStore.defaultTextGenerationModel, configStore.defaultCodeGenerationModel, engines]);



	/**
	 * Submit edit profile info
	 */
	const profileEditSubmit = async (data: EditUserInfoForm) => {
		try {
			// need to confirm reactor for runQuery or monolithStore method for editing profile
			console.log(data);

			const userObj: Record<string, unknown> = {
				password: "",
				id: nativeLogin,
				email: email,
				username: id,
				name: data.NAME,
				type: configStore.store.config.nativeRegistration
					? "NATIVE"
					: "CUSTOM",
				admin: configStore.store.user?.admin || false,
			};

			userObj.id =
				data.USERID !== nativeLogin ? data.USERID : nativeLogin;
			userObj.newUsername = data.USERNAME !== id ? data.USERNAME : null;
			userObj.newEmail = data.EMAIL;

			const response = await editMemberInfo(false, userObj);
			setEditName(data.NAME);
			setEditEmail(data.EMAIL);

			if (response.data) {
				notification.add({
					color: "success",
					message: "Successfully edited profile information",
				});
			} else {
				notification.add({
					color: "error",
					message: "Error editing profile information",
				});
			}
		} catch (_e) {
			notification.add({
				color: "error",
				message: "Error editing profile information",
			});
		}
	};

	/**
	 * Handle selecting a default model
	 */
	const handleSelectModel = async (selectedAppId: string, modelType: string) => {
		try {
			if (modelType === "text-generation-model") {
				setSelectedDefaultModel(selectedAppId);
			} else if (modelType === "code-generation-model") {
				setSelectedCodeDefaultModel(selectedAppId);
			}

			if (!selectedAppId) {
				return;
			}

			// Find the selected engine
			const selectedEngine = engines.find(
				(e) => e.app_id === selectedAppId,
			);
			if (!selectedEngine) {
				throw new Error("Selected model not found");
			}
	
			// Update the store's meta to reflect the new default model
			configStore.updateUserMeta(modelType, selectedAppId);
	
			// Send the app_id (UUID) to the API
			await setUserMetadata(modelType, selectedAppId);

			notification.add({
				color: "success",
				message: `Default ${modelType} saved successfully`,
			});
		} catch (e) {
			if (e instanceof Error) {
				notification.add({
					color: "error",
					message: e.message,
				});
			} else {
				notification.add({
					color: "error",
					message: "Error saving default model",
				});
			}
		}
	};

	/**
	 * Delete an accesskey
	 * @param accessKey - delete an access key
	 */
	const createAccessKey = async (data: CreateAccessKeyForm) => {
		try {
			const output = await createUserAccessKey(
				data.TOKENNAME,
				data.TOKENDESCRIPTION || "",
			);

			// update the values
			setValue("ACCESSKEY", output.ACCESSKEY);
			setValue("SECRETKEY", output.SECRETKEY);

			// add a new one
			notification.add({
				color: "success",
				message: "Successfully created key",
			});
		} catch (e) {
			if (e instanceof Error) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		}
	};

	/**
	 * Delete an accesskey
	 * @param accessKey - delete an access key
	 */
	const deleteAccessKey = async (accessKey: string) => {
		try {
			const response = await deleteUserAccessKeys(accessKey);

			if (!response) {
				throw new Error("Error deleting key");
			}

			// refresh the keys
			getUserAccessKeys.refresh();

			// add a new one
			notification.add({
				color: "success",
				message: "Successfully deleted key",
			});
		} catch (e) {
			if (e instanceof Error) {
				notification.add({
					color: "error",
					message: e.message,
				});
			}
		}
	};

	/**
	 * Callback that is triggered when the add modal closes
	 */
	const closeModel = () => {
		// close it
		setAddModal(false);

		// a new key was added refresh the current keys
		if (isCreated) {
			getUserAccessKeys.refresh();
		}

		// reset the form
		reset({});
	};

	const closeProfileEditModel = () => {
		setProfileImgModal(false);
	};

	/**
	 * Copy text and add it to the clipboard
	 * @param text - text to copy
	 */
	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);

			notification.add({
				color: "success",
				message: "Successfully copied code",
			});
		} catch (_e) {
			notification.add({
				color: "error",
				message: "Unable to copy code",
			});
		}
	};

	if (
		getUserAccessKeys.status === "INITIAL" ||
		getUserAccessKeys.status === "LOADING"
	) {
		return <LoadingScreen.Trigger description="Getting access keys" />;
	}
	const pySnippet = getSDKSnippet("py", ACCESSKEY, SECRETKEY);
	const jsSnippet = getSDKSnippet("js", ACCESSKEY, SECRETKEY);

	const watchedName = userInfoWatch("NAME");
	const watchedEmail = userInfoWatch("EMAIL");

	// Check if either Name or Email is changed
	const isChanged = watchedName !== editName || watchedEmail !== editEmail;

	return (
		<Stack gap={3} className="my-profile-page">
			<StyledPaper>
				<StyledGrid container spacing={3}>
					<GridItem sm={4}>
						<Typography variant="h6">
							{isNative
								? "Edit profile information"
								: "Profile Info"}
						</Typography>
					</GridItem>

					<GridItem sm={0.6}>
						<StyledAvatar>{name[0].toUpperCase()}</StyledAvatar>
					</GridItem>

					<GridItem sm={3}>
						<Button
							variant="text"
							onClick={() => {
								setProfileImgModal(true);
							}}
							disabled
							data-testid={"myProfilePage-upload-btn"}
						>
							Upload
						</Button>
					</GridItem>
				</StyledGrid>
				<Grid container spacing={3}>
					<GridItem sm={4}>{/* spacer */}</GridItem>
					<GridItem sm={8}>
						{isNative ? (
							<form
								onSubmit={userInfoHandleSubmit(
									profileEditSubmit,
								)}
							>
								<StyledStack direction="row" spacing={2}>
									<Controller
										name={"NAME"}
										control={userInfoControl}
										rules={{ required: true }}
										render={({ field }) => {
											return (
												<TextField
													label="Name"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(value) =>
														field.onChange(value)
													}
													inputProps={{
														maxLength: 255,
													}}
													fullWidth={true}
												></TextField>
											);
										}}
									/>
								</StyledStack>

								<StyledStack direction="row">
									<Controller
										name={"USERID"}
										control={userInfoControl}
										rules={{ required: false }}
										render={({ field }) => {
											return (
												<TextField
													label="User Id"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(value) =>
														field.onChange(value)
													}
													inputProps={{
														maxLength: 500,
													}}
													fullWidth={true}
													disabled
												></TextField>
											);
										}}
									/>
								</StyledStack>
								<StyledStack direction="row">
									<Controller
										name={"USERNAME"}
										control={userInfoControl}
										rules={{ required: false }}
										render={({ field }) => {
											return (
												<TextField
													label="Username"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(value) =>
														field.onChange(value)
													}
													inputProps={{
														maxLength: 500,
													}}
													fullWidth={true}
													disabled
												></TextField>
											);
										}}
									/>
								</StyledStack>

								<StyledStack direction="row">
									<Controller
										name={"EMAIL"}
										control={userInfoControl}
										rules={{ required: false }}
										render={({ field }) => {
											return (
												<TextField
													label="Email"
													value={
														field.value
															? field.value
															: ""
													}
													onChange={(value) =>
														field.onChange(value)
													}
													inputProps={{
														maxLength: 500,
													}}
													fullWidth={true}
												></TextField>
											);
										}}
									/>
								</StyledStack>
								<Stack direction="row">
									<StyledLink
										onClick={() => setPasswordModal(true)}
									>
										Change Password
									</StyledLink>
								</Stack>

								<Stack
									direction="row"
									sx={{ marginTop: "6px" }}
								>
									<Button
										variant="contained"
										color="primary"
										type="submit"
										disabled={
											!isChanged ||
											!(
												(watchedName ?? "")
													.toString()
													.trim().length > 0 &&
												(watchedEmail ?? "")
													.toString()
													.trim().length > 0
											)
										}
										data-testid={"myProfilePage-save-btn"}
									>
										Save
									</Button>

									<Button
										variant="text"
										color="inherit"
										onClick={() => {
											userInfoReset();
										}}
										disabled={!isChanged}
										data-testid={"myProfilePage-reset-btn"}
									>
										Reset
									</Button>
								</Stack>
							</form>
						) : (
							<>
								<StyledStack direction="row">
									<TextField
										label={"Login Type"}
										value={
											Object.keys(
												configStore.store.config
													.loginDetails,
											)[0]
										}
										inputProps={{
											maxLength: 500,
										}}
										fullWidth={true}
										disabled
									></TextField>
								</StyledStack>
								{Object.entries(configStore.store.user).map(
									(kv) => {
										if (
											kv[0] !== "loggedIn" &&
											kv[0] !== "admin"
										) {
											return (
												<StyledStack
													direction="row"
													key={kv[0]}
												>
													<TextField
														label={
															kv[0]
																.charAt(0)
																.toUpperCase() +
															kv[0].slice(1)
														}
														value={kv[1]}
														inputProps={{
															maxLength: 500,
														}}
														fullWidth={true}
														disabled
													></TextField>
												</StyledStack>
											);
										}
										return null;
									},
								)}
							</>
						)}
					</GridItem>
				</Grid>
			</StyledPaper>
			<StyledPaper>
				<h2 className="mb-6 font-semibold text-gray-900 text-xl">
					Choose which AI model will be used by default for your
					requests
				</h2>
				{getEngines.status === "INITIAL" ||
				getEngines.status === "LOADING" ? (
					<span className="font-medium text-gray-700 text-sm">
						Loading models...
					</span>
				) : getEngines.status === "ERROR" ? (
					<span className="font-medium text-red-600 text-sm">
						Error loading models
					</span>
				) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
				<Field>
				<FieldLabel htmlFor={modelSelectId}>
				Text Generation Model
				</FieldLabel>
				<Select
				value={selectedDefaultModel}
				onValueChange={(value) => handleSelectModel(value, "text-generation-model") }
				>
				<SelectTrigger
				id={modelSelectId}
				className="flex h-11 w-full items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 shadow-sm transition-all duration-200 ease-in-out hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				data-testid="myProfilePage-default-model-select"
				>
				<SelectValue placeholder="Select a model" />
				</SelectTrigger>
				<SelectContent className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
				{engines.map((engine) => (
				<SelectItem
				key={engine.app_id}
				value={engine.app_id}
				data-testid={`myProfilePage-model-option-${engine.app_id}`}
				className="cursor-pointer px-4 py-3 text-base text-gray-900"
				>
				<span>{engine.app_name}</span>
				</SelectItem>
				))}
				</SelectContent>
				</Select>
				<FieldDescription className="mt-2 text-gray-600 text-sm">
				This text generation model will be used to power AI-driven user requests
				</FieldDescription>
				</Field>
				
				<Field>
				<FieldLabel htmlFor={`${modelSelectId}-secondary`}>
				Code Generation Model
				</FieldLabel>
				<Select
				value={selectedCodeDefaultModel}
				onValueChange={(value) => handleSelectModel(value, "code-generation-model") }
				>
				<SelectTrigger
				id={`${modelSelectId}-secondary`}
				className="flex h-11 w-full items-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-base text-gray-900 shadow-sm transition-all duration-200 ease-in-out hover:border-blue-400 hover:shadow-md focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
				data-testid="myProfilePage-secondary-model-select"
				>
				<SelectValue placeholder="Select a model" />
				</SelectTrigger>
				<SelectContent className="max-h-[300px] overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
				{engines.map((engine) => (
				<SelectItem
				key={`secondary-${engine.app_id}`}
				value={engine.app_id}
				data-testid={`myProfilePage-secondary-model-option-${engine.app_id}`}
				className="cursor-pointer px-4 py-3 text-base text-gray-900"
				>
				<span>{engine.app_name}</span>
				</SelectItem>
				))}
				</SelectContent>
				</Select>
				<FieldDescription className="mt-2 text-gray-600 text-sm">
				This code generation model will be used to power AI-driven user requests
				</FieldDescription>
				</Field>
				</div>
				)}
			</StyledPaper>
			<StyledPaper>
				<MonolithGrid container spacing={3}>
					<CustomGridItem sm={11}>
						<Typography variant="h6">Javascript SDK</Typography>
					</CustomGridItem>
					<CopyGridItem sm={1}>
						<IconButton
							title="Copy"
							onClick={() => {
								copy(jsSnippet);
							}}
							data-testid={"myProfilePage-js-copy-btn"}
						>
							<ContentCopyOutlined />
						</IconButton>
					</CopyGridItem>
				</MonolithGrid>
				<MonolithGrid container spacing={3}>
					<GridItem sm={12}>
						<StyledSDKBlock>
							<StyledCodeContent>{jsSnippet}</StyledCodeContent>
						</StyledSDKBlock>
					</GridItem>
				</MonolithGrid>
			</StyledPaper>

			<StyledPaper>
				<MonolithGrid container spacing={3}>
					<CustomGridItem sm={11}>
						<Typography variant="h6">Python SDK</Typography>
					</CustomGridItem>

					<CopyGridItem sm={1}>
						<IconButton
							title="Copy"
							onClick={() => {
								copy(pySnippet);
							}}
							data-testid={"myProfilePage-py-copy-btn"}
						>
							<ContentCopyOutlined />
						</IconButton>
					</CopyGridItem>
				</MonolithGrid>
				<MonolithGrid container spacing={3}>
					<GridItem sm={12}>
						<StyledSDKBlock>
							<StyledCodeContent>{pySnippet}</StyledCodeContent>
						</StyledSDKBlock>
					</GridItem>
				</MonolithGrid>
			</StyledPaper>

			<StyledAccessTokensPaper>
				<Stack direction="row" justifyContent={"space-between"} mb={1}>
					<Typography variant="h6">Personal Access Tokens</Typography>

					<Button
						variant="contained"
						startIcon={<Add />}
						onClick={() => {
							setAddModal(true);
						}}
						data-testid={"myProfilePage-new-key-btn"}
					>
						New Key
					</Button>
				</Stack>

				<StyledTableContainer>
					<Table>
						<Table.Head>
							<Table.Row>
								<LeftHeaderCell align={"left"}>
									Name
								</LeftHeaderCell>
								<HeaderCell align={"left"}>
									Description
								</HeaderCell>
								<HeaderCell align={"left"}>
									Date Created
								</HeaderCell>
								<HeaderCell align={"left"}>
									Last Used Created
								</HeaderCell>
								<HeaderCell align={"left"}>
									Access Key
								</HeaderCell>
								<RightHeaderCell>&nbsp;</RightHeaderCell>
							</Table.Row>
						</Table.Head>
						<Table.Body>
							{getUserAccessKeys.status === "SUCCESS" &&
							getUserAccessKeys.data.length !== 0
								? getUserAccessKeys.data.map((k, idx) => {
										return (
											<Table.Row
												key={`${k.TOKENNAME}-${idx}`}
											>
												<Table.Cell align={"left"}>
													{k.TOKENNAME}
												</Table.Cell>
												<Table.Cell align={"left"}>
													{k.TOKENDESCRIPTION || ""}
												</Table.Cell>
												<Table.Cell align={"left"}>
													{k.DATECREATED}
												</Table.Cell>
												<Table.Cell align={"left"}>
													{k.LASTUSED}
												</Table.Cell>
												<Table.Cell align={"left"}>
													{k.ACCESSKEY}
												</Table.Cell>
												<Table.Cell align={"right"}>
													<IconButton
														title="Copy"
														onClick={() => {
															copy(k.ACCESSKEY);
														}}
														data-testid={
															"myProfilePage-access-key-copy-btn"
														}
													>
														<ContentCopyOutlined />
													</IconButton>
													<IconButton
														title="Delete"
														onClick={() => {
															deleteAccessKey(
																k.ACCESSKEY,
															);
														}}
														data-testid={
															"myProfilePage-access-key-delete-btn"
														}
													>
														<Delete />
													</IconButton>
												</Table.Cell>
											</Table.Row>
										);
									})
								: null}
						</Table.Body>
					</Table>
				</StyledTableContainer>
				{getUserAccessKeys.status === "SUCCESS" &&
					getUserAccessKeys.data.length === 0 && (
						<MessageDiv>
							No Personal Access Tokens to display at this time
							<br />
							Click New Key to create a new Personal Access Token
						</MessageDiv>
					)}
			</StyledAccessTokensPaper>

			<Modal open={addModal} onClose={() => closeModel()} maxWidth="lg">
				<Modal.Title>Generate Key</Modal.Title>
				<Modal.Content>
					<Stack sx={{ width: "800px" }} spacing={4}>
						<form
							onSubmit={handleSubmit(createAccessKey)}
							className="my-profile-page__generate-key-form"
						>
							<Stack direction="column" spacing={2}>
								<Alert severity="info">
									Note: Your private key will only be
									generated once
								</Alert>

								<Controller
									name={"TOKENNAME"}
									control={control}
									rules={{ required: true }}
									render={({ field }) => {
										return (
											<TextField
												required
												label="Name"
												value={
													field.value
														? field.value
														: ""
												}
												disabled={isCreated}
												onChange={(value) =>
													field.onChange(value)
												}
												inputProps={{ maxLength: 255 }}
												data-testid={
													"myProfilePage-generate-key-name-txt"
												}
											></TextField>
										);
									}}
								/>

								<Controller
									name={"TOKENDESCRIPTION"}
									control={control}
									rules={{ required: false }}
									render={({ field }) => {
										return (
											<TextField
												label="Description"
												value={
													field.value
														? field.value
														: ""
												}
												disabled={isCreated}
												onChange={(value) =>
													field.onChange(value)
												}
												inputProps={{ maxLength: 500 }}
												data-testid={
													"myProfilePage-generate-key-description-txt"
												}
											></TextField>
										);
									}}
								/>

								<Stack direction="row" justifyContent={"start"}>
									<Button
										disabled={isCreated}
										type="submit"
										variant={"outlined"}
										color="primary"
										data-testid={
											"myProfilePage-generate-btn"
										}
									>
										Generate
									</Button>
								</Stack>
								{isCreated && (
									<StyledCreatedKeyContainer direction="column">
										<Stack direction="column" spacing={1}>
											<Typography variant={"subtitle2"}>
												Access Key
											</Typography>
											<StyledSDKBlock>
												<StyledCodeContent>
													{ACCESSKEY}
												</StyledCodeContent>
												<Button
													size={"medium"}
													variant="outlined"
													startIcon={
														<ContentCopyOutlined
															color={"inherit"}
														/>
													}
													onClick={() =>
														copy(ACCESSKEY)
													}
													data-testid={
														"myProfilePage-created-access-copy-btn"
													}
												>
													Copy
												</Button>
											</StyledSDKBlock>
										</Stack>
										<Stack direction="column" spacing={1}>
											<Typography variant={"subtitle2"}>
												Secret Key
											</Typography>
											<StyledSDKBlock>
												<StyledCodeContent>
													{SECRETKEY}
												</StyledCodeContent>
												<Button
													size={"medium"}
													variant="outlined"
													startIcon={
														<ContentCopyOutlined
															color={"inherit"}
														/>
													}
													onClick={() =>
														copy(SECRETKEY)
													}
													data-testid={
														"myProfilePage-secret-key-copy-btn"
													}
												>
													Copy
												</Button>
											</StyledSDKBlock>
										</Stack>
										<Stack
											direction="column"
											spacing={1}
											className="myProfilePage_js-sdk-access key"
										>
											<Stack
												direction="row"
												justifyContent={"space-between"}
												alignItems={"center"}
											>
												<Typography
													variant={"subtitle2"}
												>
													Javascript Example
												</Typography>
												<IconButton
													onClick={() => {
														setIsJsSdkOpen(
															!isJsSdkOpen,
														);
													}}
													data-testid={
														"myProfilePage-js-toggle-btn"
													}
												>
													{isJsSdkOpen ? (
														<KeyboardArrowUp />
													) : (
														<KeyboardArrowDown />
													)}
												</IconButton>
											</Stack>

											<Collapse in={isJsSdkOpen}>
												<StyledSDKBlock>
													<StyledCodeContent maxWidth="600px">
														{jsSnippet}
													</StyledCodeContent>
													<Button
														size={"medium"}
														variant="outlined"
														startIcon={
															<ContentCopyOutlined
																color={
																	"inherit"
																}
															/>
														}
														onClick={() =>
															copy(jsSnippet)
														}
														data-testid={
															"myProfilePage-js-sdk-copy-btn"
														}
													>
														Copy
													</Button>
												</StyledSDKBlock>
											</Collapse>
										</Stack>
										<Stack
											direction="column"
											spacing={1}
											className="myProfilePage-py-sdk-access key"
										>
											<Stack
												direction="row"
												justifyContent={"space-between"}
												alignItems={"center"}
											>
												<Typography
													variant={"subtitle2"}
												>
													Python Example
												</Typography>
												<IconButton
													onClick={() => {
														setIsPySdkOpen(
															!isPySdkOpen,
														);
													}}
													data-testid={
														"myProfilePage-py-toggle-btn"
													}
												>
													{isPySdkOpen ? (
														<KeyboardArrowUp />
													) : (
														<KeyboardArrowDown />
													)}
												</IconButton>
											</Stack>
											<Collapse in={isPySdkOpen}>
												<StyledSDKBlock>
													<StyledCodeContent maxWidth="600px">
														{pySnippet}
													</StyledCodeContent>
													<Button
														size={"medium"}
														variant="outlined"
														startIcon={
															<ContentCopyOutlined
																color={
																	"inherit"
																}
															/>
														}
														onClick={() =>
															copy(pySnippet)
														}
														data-testid={
															"myProfilePage-py-sdk-copy-btn"
														}
													>
														Copy
													</Button>
												</StyledSDKBlock>
											</Collapse>
										</Stack>
									</StyledCreatedKeyContainer>
								)}
							</Stack>
						</form>
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Button variant="text" onClick={() => closeModel()}>
						Close
					</Button>
				</Modal.Actions>
			</Modal>

			<Modal
				open={profileImgModal}
				onClose={() => closeModel()}
				maxWidth="md"
			>
				<Modal.Title>Upload Profile Picture</Modal.Title>
				<Modal.Content>
					<CurrentAvatarStack direction="row" spacing={2}>
						<StyledAvatar>{name[0].toUpperCase()}</StyledAvatar>
						<span>Current avatar</span>
					</CurrentAvatarStack>

					<Stack direction="row" spacing={2}>
						<AvatarForm>
							<Controller
								name={"PLACEHOLDER"}
								control={control}
								rules={{ required: true }}
								render={({ field }) => {
									return (
										<TextField
											label="Placeholder"
											value={
												field.value ? field.value : ""
											}
											onChange={(value) =>
												field.onChange(value)
											}
											inputProps={{ maxLength: 255 }}
											fullWidth={true}
										></TextField>
									);
								}}
							/>
							<Modal.Actions>
								<Button
									variant="contained"
									disabled
									type="submit"
									data-testid={"myProfilePage-submit-btn"}
								>
									Save
								</Button>
								<Button
									variant="text"
									onClick={() => closeProfileEditModel()}
									data-testid={
										"myProfilePage-close-profile-btn"
									}
								>
									Close
								</Button>
							</Modal.Actions>
						</AvatarForm>
					</Stack>
				</Modal.Content>
			</Modal>

			<ChangePasswordModal
				open={passwordModal}
				onClose={() => setPasswordModal(false)}
			/>
		</Stack>
	);
};
