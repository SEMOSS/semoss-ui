import {
	Check,
	ChevronDown,
	ChevronUp,
	Copy,
	Plus,
	Trash2,
} from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	CodeContainer,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	createUserAccessKey,
	deleteUserAccessKeys,
	editMemberInfo,
	setUserDefaultModel,
} from "@/api/auth";
import { useAPI, useRootStore, useSettings } from "@/hooks";
import { formatDate, getSDKSnippet } from "@/utility";
import { ChangePasswordModal } from "./change-password-modal";

interface CreateAccessKeyForm {
	TOKENNAME: string;
	TOKENDESCRIPTION?: string;
	ACCESSKEY: string;
	SECRETKEY: string;
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

const SdkBlock = ({
	label,
	code,
	testId,
}: {
	label: string;
	code: string;
	testId: string;
}) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(code);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		} catch {
			toast.error("Unable to copy code");
		}
	};

	return (
		<div className="overflow-hidden rounded-md border border-border">
			<div className="flex items-center justify-between border-border border-b bg-muted px-3 py-1.5">
				<span className="font-mono text-muted-foreground text-xs">
					{label}
				</span>
				<button
					type="button"
					onClick={handleCopy}
					className="ml-auto flex items-center gap-1 rounded px-2 py-0.5 text-muted-foreground text-xs transition-colors hover:bg-background hover:text-foreground"
					data-testid={testId}
				>
					{copied ? (
						<>
							<Check className="size-3" />
							Copied
						</>
					) : (
						<>
							<Copy className="size-3" />
							Copy
						</>
					)}
				</button>
			</div>
			<div className="overflow-x-auto bg-muted/30">
				<CodeContainer className="min-w-max whitespace-pre rounded-none bg-transparent p-4 text-sm">
					{code}
				</CodeContainer>
			</div>
		</div>
	);
};

export const MyProfilePage = () => {
	const modelSelectId = useId();
	const { configStore, insightStore } = useRootStore();
	const { email, id, name } = configStore.store.user;
	const { isNative } = configStore.store;
	const lastLogin = configStore.store.user.lastLogin;
	const groups = configStore.store.user.groupInfo?.groups ?? [];
	const { adminMode } = useSettings();

	const [addModal, setAddModal] = useState(false);
	const [passwordModal, setPasswordModal] = useState(false);
	const [editName, setEditName] = useState(name);
	const [editEmail, setEditEmail] = useState(email);

	const getUserAccessKeys = useAPI(["getUserAccessKeys"]);
	const getModals = useAPI(["getEngines", adminMode, "", "MODEL"]);

	const [
		selectedTextGenerationDefaultModel,
		setSelectedTextGenerationDefaultModel,
	] = useState<string>("");

	const [
		selectedCodeGenerationDefaultModel,
		setSelectedCodeGenerationDefaultModel,
	] = useState<string>("");

	const logins = configStore.store.config.logins;
	const nativeLogin = (logins as unknown as { NATIVE: string })?.NATIVE;

	const { control, reset, setValue, handleSubmit, watch } =
		useForm<CreateAccessKeyForm>({
			defaultValues: {
				TOKENNAME: "",
				TOKENDESCRIPTION: "",
				ACCESSKEY: "",
				SECRETKEY: "",
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
	const isCreated = !!(ACCESSKEY && SECRETKEY);

	const [isJsSdkOpen, setIsJsSdkOpen] = useState(false);
	const [isPySdkOpen, setIsPySdkOpen] = useState(false);

	const modals =
		getModals.status === "SUCCESS" && Array.isArray(getModals.data)
			? (getModals.data as unknown as Engine[]).filter(
					(e) => e.app_subtype !== "EMBEDDED",
				)
			: [];

	useEffect(() => {
		if (insightStore.defaultTextGenerationModel && modals.length > 0) {
			const matchingEngine = modals.find(
				(e) => e.app_id === insightStore.defaultTextGenerationModel,
			);
			if (matchingEngine) {
				setSelectedTextGenerationDefaultModel(matchingEngine.app_id);
			}
		}
		if (insightStore.defaultCodeGenerationModel && modals.length > 0) {
			const matchingCodeEngine = modals.find(
				(e) => e.app_id === insightStore.defaultCodeGenerationModel,
			);
			if (matchingCodeEngine) {
				setSelectedCodeGenerationDefaultModel(
					matchingCodeEngine.app_id,
				);
			}
		}
	}, [
		insightStore.defaultTextGenerationModel,
		insightStore.defaultCodeGenerationModel,
		modals,
	]);

	const profileEditSubmit = async (data: EditUserInfoForm) => {
		try {
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
				toast.success("Successfully edited profile information");
			} else {
				toast.error("Error editing profile information");
			}
		} catch (_e) {
			toast.error("Error editing profile information");
		}
	};

	const handleSelectModel = async (
		selectedAppId: string,
		modelType: string,
	) => {
		try {
			if (modelType === "text-generation-model") {
				setSelectedTextGenerationDefaultModel(selectedAppId);
			} else if (modelType === "code-generation-model") {
				setSelectedCodeGenerationDefaultModel(selectedAppId);
			}
			if (!selectedAppId) return;

			const selectedEngine = modals.find(
				(e) => e.app_id === selectedAppId,
			);
			if (!selectedEngine) throw new Error("Selected model not found");

			insightStore.updateUserDefaultModel(modelType, selectedAppId);
			await setUserDefaultModel(modelType, selectedAppId);
			toast.success(`Default ${modelType} saved successfully`);
		} catch (e) {
			if (e instanceof Error) {
				toast.error(e.message);
			} else {
				toast.error("Error saving default model");
			}
		}
	};

	const createAccessKey = async (data: CreateAccessKeyForm) => {
		try {
			const output = await createUserAccessKey(
				data.TOKENNAME,
				data.TOKENDESCRIPTION || "",
			);
			setValue("ACCESSKEY", output.ACCESSKEY);
			setValue("SECRETKEY", output.SECRETKEY);
			toast.success("Successfully created key");
		} catch (e) {
			if (e instanceof Error) {
				toast.error(e.message);
			}
		}
	};

	const deleteAccessKey = async (accessKey: string) => {
		try {
			const response = await deleteUserAccessKeys(accessKey);
			if (!response) throw new Error("Error deleting key");
			getUserAccessKeys.refresh();
			toast.success("Successfully deleted key");
		} catch (e) {
			if (e instanceof Error) {
				toast.error(e.message);
			}
		}
	};

	const closeModel = () => {
		setAddModal(false);
		if (isCreated) getUserAccessKeys.refresh();
		reset({});
		setIsJsSdkOpen(false);
		setIsPySdkOpen(false);
	};

	const copy = async (text: string) => {
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Successfully copied code");
		} catch (_e) {
			toast.error("Unable to copy code");
		}
	};

	const pySnippet = getSDKSnippet("py", ACCESSKEY, SECRETKEY);
	const jsSnippet = getSDKSnippet("js", ACCESSKEY, SECRETKEY);

	const watchedName = userInfoWatch("NAME");
	const watchedEmail = userInfoWatch("EMAIL");
	const isChanged = watchedName !== editName || watchedEmail !== editEmail;

	return (
		<div className="my-profile-page flex flex-col gap-4">
			{/* Profile Info */}
			<div className="rounded-lg border bg-card px-6 py-5">
				<div className="grid gap-8 [grid-template-columns:1fr_2fr]">
					{/* Left: account details */}
					<div>
						<h3 className="mb-3 font-semibold text-base">
							Account Details
						</h3>
						<div className="flex flex-col gap-4">
							<div className="flex flex-col gap-1">
								<Label className="text-muted-foreground text-xs">
									User Id
								</Label>
								<span className="text-sm">{id}</span>
							</div>
							{isNative && (
								<div className="flex flex-col gap-1">
									<Label className="text-muted-foreground text-xs">
										Username
									</Label>
									<span className="text-sm">{id}</span>
								</div>
							)}
							<div className="flex flex-col gap-1">
								<Label className="text-muted-foreground text-xs">
									Last Login
								</Label>
								<span className="text-sm">
									{lastLogin
										? formatDate(lastLogin) || lastLogin
										: "—"}
								</span>
							</div>
							<div className="flex flex-col gap-1">
								<Label className="text-muted-foreground text-xs">
									Groups
								</Label>
								{groups.length > 0 ? (
									<div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pt-0.5">
										{groups.map((g) => (
											<span
												key={g}
												className="rounded-full border px-2.5 py-0.5 font-medium text-xs"
											>
												{g}
											</span>
										))}
									</div>
								) : (
									<span className="text-muted-foreground text-sm">
										No groups
									</span>
								)}
							</div>
						</div>
					</div>
					{/* Right: edit form */}
					<div className="border-l pl-8">
						<h3 className="mb-3 font-semibold text-base">
							{isNative
								? "Edit profile information"
								: "Profile Info"}
						</h3>
						{isNative ? (
							<form
								onSubmit={userInfoHandleSubmit(
									profileEditSubmit,
								)}
							>
								<div className="flex flex-col gap-3">
									<div className="grid grid-cols-2 gap-3">
										<Controller
											name="NAME"
											control={userInfoControl}
											rules={{ required: true }}
											render={({ field }) => (
												<div className="flex flex-col gap-1">
													<Label className="text-xs">
														Name
													</Label>
													<Input
														value={
															field.value ?? ""
														}
														onChange={
															field.onChange
														}
														maxLength={255}
													/>
												</div>
											)}
										/>
										<Controller
											name="EMAIL"
											control={userInfoControl}
											render={({ field }) => (
												<div className="flex flex-col gap-1">
													<Label className="text-xs">
														Email
													</Label>
													<Input
														value={
															field.value ?? ""
														}
														onChange={
															field.onChange
														}
														maxLength={500}
													/>
												</div>
											)}
										/>
									</div>
									<div>
										<button
											type="button"
											className="cursor-pointer font-medium text-[#0471F0] text-sm underline"
											onClick={() =>
												setPasswordModal(true)
											}
										>
											Change Password
										</button>
									</div>
									<div className="flex gap-2">
										<Button
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
											data-testid="myProfilePage-save-btn"
										>
											Save
										</Button>
										<Button
											type="button"
											variant="ghost"
											onClick={() => userInfoReset()}
											disabled={!isChanged}
											data-testid="myProfilePage-reset-btn"
										>
											Reset
										</Button>
									</div>
								</div>
							</form>
						) : (
							<div className="flex flex-col gap-2">
								<div className="flex flex-col gap-1">
									<Label className="text-xs">
										Login Type
									</Label>
									<Input
										value={
											Object.keys(
												configStore.store.config
													.loginDetails as object,
											)[0]
										}
										maxLength={500}
										disabled
									/>
								</div>
								{name && (
									<div className="flex flex-col gap-1">
										<Label className="text-xs">Name</Label>
										<Input
											value={name}
											maxLength={500}
											disabled
										/>
									</div>
								)}
								{email && (
									<div className="flex flex-col gap-1">
										<Label className="text-xs">Email</Label>
										<Input
											value={email}
											maxLength={500}
											disabled
										/>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>

			{/* Default Model Selection */}
			<div className="rounded-lg border bg-card px-6 py-5">
				<h2 className="mb-4 font-semibold text-base">
					Default AI models for your requests
				</h2>
				{getModals.status === "INITIAL" ||
				getModals.status === "LOADING" ? (
					<span className="font-medium text-gray-700 text-sm">
						Loading models...
					</span>
				) : getModals.status === "ERROR" ? (
					<span className="font-medium text-red-600 text-sm">
						Error loading models
					</span>
				) : (
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<Field>
							<FieldLabel htmlFor={modelSelectId}>
								Text Generation Model
							</FieldLabel>
							<Select
								value={selectedTextGenerationDefaultModel}
								onValueChange={(value) =>
									handleSelectModel(
										value,
										"text-generation-model",
									)
								}
							>
								<SelectTrigger
									id={modelSelectId}
									data-testid="myProfilePage-default-model-select"
								>
									<SelectValue placeholder="Select a model" />
								</SelectTrigger>
								<SelectContent>
									{modals.map((engine) => (
										<SelectItem
											key={engine.app_id}
											value={engine.app_id}
											data-testid={`myProfilePage-model-option-${engine.app_id}`}
										>
											<span className="flex w-full flex-col items-start text-left">
												<span className="text-sm">
													{engine.app_name}
												</span>
												<span className="text-muted-foreground text-xs">
													id: {engine.app_id}
												</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldDescription className="text-muted-foreground text-xs">
								Powers AI-driven text generation requests
							</FieldDescription>
						</Field>

						<Field>
							<FieldLabel htmlFor={`${modelSelectId}-secondary`}>
								Code Generation Model
							</FieldLabel>
							<Select
								value={selectedCodeGenerationDefaultModel}
								onValueChange={(value) =>
									handleSelectModel(
										value,
										"code-generation-model",
									)
								}
							>
								<SelectTrigger
									id={`${modelSelectId}-secondary`}
									data-testid="myProfilePage-secondary-model-select"
								>
									<SelectValue placeholder="Select a model" />
								</SelectTrigger>
								<SelectContent>
									{modals.map((engine) => (
										<SelectItem
											key={`secondary-${engine.app_id}`}
											value={engine.app_id}
											data-testid={`myProfilePage-secondary-model-option-${engine.app_id}`}
										>
											<span className="flex w-full flex-col items-start text-left">
												<span className="text-sm">
													{engine.app_name}
												</span>
												<span className="text-muted-foreground text-xs">
													id: {engine.app_id}
												</span>
											</span>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FieldDescription className="text-muted-foreground text-xs">
								Powers AI-driven code generation requests
							</FieldDescription>
						</Field>
					</div>
				)}
			</div>

			{/* JS SDK */}
			<div className="rounded-lg border bg-card px-6 py-5">
				<h3 className="mb-3 font-semibold text-base">Javascript SDK</h3>
				<SdkBlock
					label="javascript"
					code={jsSnippet}
					testId="myProfilePage-js-copy-btn"
				/>
			</div>

			{/* Python SDK */}
			<div className="rounded-lg border bg-card px-6 py-5">
				<h3 className="mb-3 font-semibold text-base">Python SDK</h3>
				<SdkBlock
					label="python"
					code={pySnippet}
					testId="myProfilePage-py-copy-btn"
				/>
			</div>

			{/* Personal Access Tokens */}
			<div className="rounded-lg border bg-card px-6 py-5">
				<div className="mb-2 flex flex-row items-center justify-between">
					<h3 className="font-semibold text-base">
						Personal Access Tokens
					</h3>
					<Button
						onClick={() => setAddModal(true)}
						data-testid="myProfilePage-new-key-btn"
					>
						<Plus className="mr-2 size-4" />
						New Key
					</Button>
				</div>
				<div className="mt-4 overflow-x-auto">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-[#f3f3f3]">
								<th className="rounded-tl-xl border-[#ccc] border-b px-3 py-2 text-left font-medium">
									Name
								</th>
								<th className="border-[#ccc] border-b px-3 py-2 text-left font-medium">
									Description
								</th>
								<th className="border-[#ccc] border-b px-3 py-2 text-left font-medium">
									Date Created
								</th>
								<th className="border-[#ccc] border-b px-3 py-2 text-left font-medium">
									Last Used Created
								</th>
								<th className="border-[#ccc] border-b px-3 py-2 text-left font-medium">
									Access Key
								</th>
								<th className="rounded-tr-xl border-[#ccc] border-b px-3 py-2">
									&nbsp;
								</th>
							</tr>
						</thead>
						<tbody>
							{(getUserAccessKeys.status === "INITIAL" ||
								getUserAccessKeys.status === "LOADING") && (
								<tr>
									<td
										colSpan={6}
										className="py-8 text-center"
									>
										<div className="flex items-center justify-center gap-2">
											<Spinner className="size-4" />
											<span className="text-muted-foreground text-sm">
												Loading keys...
											</span>
										</div>
									</td>
								</tr>
							)}
							{getUserAccessKeys.status === "SUCCESS" &&
							getUserAccessKeys.data?.length !== 0
								? getUserAccessKeys.data?.map((k, idx) => (
										<tr key={`${k.TOKENNAME}-${idx}`}>
											<td className="px-3 py-2">
												{k.TOKENNAME}
											</td>
											<td className="px-3 py-2">
												{k.TOKENDESCRIPTION || ""}
											</td>
											<td className="px-3 py-2">
												{k.DATECREATED}
											</td>
											<td className="px-3 py-2">
												{k.LASTUSED}
											</td>
											<td className="px-3 py-2">
												<div className="flex items-center gap-1">
													<Button
														variant="ghost"
														size="icon"
														className="size-6 shrink-0"
														title="Copy"
														onClick={() =>
															copy(k.ACCESSKEY)
														}
														data-testid="myProfilePage-access-key-copy-btn"
													>
														<Copy className="size-3.5" />
													</Button>
													<span className="font-mono text-xs">
														{k.ACCESSKEY}
													</span>
												</div>
											</td>
											<td className="px-3 py-2 text-right">
												<Button
													variant="ghost"
													size="icon"
													title="Delete"
													onClick={() =>
														deleteAccessKey(
															k.ACCESSKEY,
														)
													}
													data-testid="myProfilePage-access-key-delete-btn"
												>
													<Trash2 className="size-4" />
												</Button>
											</td>
										</tr>
									))
								: null}
						</tbody>
					</table>
				</div>
				{getUserAccessKeys.status === "SUCCESS" &&
					getUserAccessKeys.data?.length === 0 && (
						<div className="mx-auto my-[75px] block w-full text-center text-[#666] text-[13px]">
							No Personal Access Tokens to display at this time
							<br />
							Click New Key to create a new Personal Access Token
						</div>
					)}
			</div>

			{/* Generate Key Modal */}
			<Dialog
				open={addModal}
				onOpenChange={(open) => !open && closeModel()}
			>
				<DialogContent className="flex max-h-[90vh] max-w-3xl flex-col">
					<DialogHeader className="shrink-0">
						<DialogTitle>Generate Key</DialogTitle>
					</DialogHeader>
					<div className="min-h-0 flex-1 overflow-y-auto">
						<form
							onSubmit={handleSubmit(createAccessKey)}
							className="my-profile-page__generate-key-form"
						>
							<div className="flex flex-col gap-3">
								<div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800 text-sm">
									Note: Your private key will only be
									generated once
								</div>
								<Controller
									name="TOKENNAME"
									control={control}
									rules={{ required: true }}
									render={({ field }) => (
										<div className="flex flex-col gap-1">
											<Label className="text-xs">
												Name{" "}
												<span className="text-destructive">
													*
												</span>
											</Label>
											<Input
												value={field.value ?? ""}
												disabled={isCreated}
												onChange={field.onChange}
												maxLength={255}
												data-testid="myProfilePage-generate-key-name-txt"
											/>
										</div>
									)}
								/>
								<Controller
									name="TOKENDESCRIPTION"
									control={control}
									render={({ field }) => (
										<div className="flex flex-col gap-1">
											<Label className="text-xs">
												Description
											</Label>
											<Input
												value={field.value ?? ""}
												disabled={isCreated}
												onChange={field.onChange}
												maxLength={500}
												data-testid="myProfilePage-generate-key-description-txt"
											/>
										</div>
									)}
								/>
								<div>
									<Button
										disabled={isCreated}
										type="submit"
										variant="outline"
										data-testid="myProfilePage-generate-btn"
									>
										Generate
									</Button>
								</div>
								{isCreated && (
									<div className="flex flex-col gap-3 rounded bg-background p-2">
										<div className="flex flex-col gap-1.5">
											<p className="font-medium text-sm">
												Access Key
											</p>
											<SdkBlock
												label="access key"
												code={ACCESSKEY}
												testId="myProfilePage-created-access-copy-btn"
											/>
										</div>
										<div className="flex flex-col gap-1.5">
											<p className="font-medium text-sm">
												Secret Key
											</p>
											<SdkBlock
												label="secret key"
												code={SECRETKEY}
												testId="myProfilePage-secret-key-copy-btn"
											/>
										</div>
										<div className="myProfilePage_js-sdk-access flex flex-col gap-1.5">
											<div className="flex items-center justify-between">
												<p className="font-medium text-sm">
													Javascript Example
												</p>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() =>
														setIsJsSdkOpen(
															!isJsSdkOpen,
														)
													}
													data-testid="myProfilePage-js-toggle-btn"
												>
													{isJsSdkOpen ? (
														<ChevronUp className="size-4" />
													) : (
														<ChevronDown className="size-4" />
													)}
												</Button>
											</div>
											{isJsSdkOpen && (
												<SdkBlock
													label="javascript"
													code={jsSnippet}
													testId="myProfilePage-js-sdk-copy-btn"
												/>
											)}
										</div>
										<div className="myProfilePage-py-sdk-access flex flex-col gap-1.5">
											<div className="flex items-center justify-between">
												<p className="font-medium text-sm">
													Python Example
												</p>
												<Button
													type="button"
													variant="ghost"
													size="icon"
													onClick={() =>
														setIsPySdkOpen(
															!isPySdkOpen,
														)
													}
													data-testid="myProfilePage-py-toggle-btn"
												>
													{isPySdkOpen ? (
														<ChevronUp className="size-4" />
													) : (
														<ChevronDown className="size-4" />
													)}
												</Button>
											</div>
											{isPySdkOpen && (
												<SdkBlock
													label="python"
													code={pySnippet}
													testId="myProfilePage-py-sdk-copy-btn"
												/>
											)}
										</div>
									</div>
								)}
							</div>
						</form>
					</div>
					<DialogFooter className="shrink-0">
						<Button variant="ghost" onClick={() => closeModel()}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<ChangePasswordModal
				open={passwordModal}
				onClose={() => setPasswordModal(false)}
			/>
		</div>
	);
};
