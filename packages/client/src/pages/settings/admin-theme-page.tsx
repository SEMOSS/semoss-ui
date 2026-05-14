import { PlusIcon, TrashIcon, XIcon } from "lucide-react";
import { Suspense, useEffect, useId, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import type { ThemeMap } from "@semoss/shared";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Spinner,
	Switch,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Textarea,
	toast,
} from "@semoss/ui/next";
import {
	createAdminTheme,
	deleteAdminTheme,
	editAdminTheme,
	getAdminThemes,
	setActiveAdminTheme,
} from "@/api/theme";
import { useAPI, useSettings } from "@/hooks";

/** Legacy SEMOSS client theme shape — coexists with `ThemeMap` in the same JSON document. */
interface ClientTheme {
	/* Fields read by the modern React client (and also by Legacy BI). */
	name?: string;
	landingPageName?: string;
	logo?: string;
	isLogoUrl?: boolean;

	helpBannerOrder?: string[];
	helpBannerValues?: Record<
		string,
		{ src?: string; label?: string; disabled?: boolean }
	>;

	cookiePolicyBannerReact?: string;
	cookiePolicyModalHeaderReact?: string;
	cookiePolicyModalBodyReact?: string;
	cookiePolicyOrderReact?: Record<string, string> | string[];
	cookiePoliciesReact?: Record<string, string>;
	cookiePolicyNoticePage?: string;
	privacyNoticePage?: string;

	termsHeaderReact?: string;
	termsReact?: string;

	/* Legacy BI–only fields (read by packages/legacy/dist). */
	includeNameWithLogo?: boolean;

	homeIntroObj?: {
		homeIntroHtml?: string;
		infoCards?: {
			image?: string;
			color?: string;
			description?: string;
			title?: string;
			click?: string;
		}[];
	};

	loginImage?: string;
	isLoginImageUrl?: boolean;
	homeIntroImage?: string;
	isHomeIntroImageUrl?: boolean;
	backgroundImage?: string;
	backgroundImageOpacity?: number;

	helpDropdown?: {
		contactUsLink?: string;
		contactUsIcon?: string;
		contactUsTitle?: string;
		contactUsDescription?: string;
		showContactUsHeading?: boolean;
		descriptionFontSize?: string;
		showContactUsSection?: boolean;
		showUserGuideSection?: boolean;
		isContactUsLinkUrl?: boolean;
	};

	visualizationColorPalette?: string;
	visualizationBackgroundColor?: string;

	cookiePolicyMessageReact?: string;

	loginCenterHTML?: string;
	loginAndSignupTextCustomHtml?: string;

	homeLeftNavItems?: Record<string, unknown>;
	materialTheme?: Record<string, unknown>;
}

type FullTheme = Partial<ThemeMap> & ClientTheme & Record<string, unknown>;

const EMPTY_PLAYGROUND: ThemeMap["playground"] = {
	name: "",
	banner: "",
	description: "",
	variables: {
		backgroundColor: "",
		primaryColor: "",
		secondaryColor: "",
	},
	images: {
		app: "",
		logo: "",
		login: "",
		landing: "",
		workspace: "",
		tabIcon: "",
		loginDark: "",
		landingDark: "",
		workspaceDark: "",
		error: "",
		errorDark: "",
	},
	overrides: {
		"main-layout": {},
	},
	footer: "",
	landing: "",
	sidebar: {
		expandedByDefault: false,
		chatHistoryDate: false,
		headerItems: [],
		footerItems: [],
	},
	toolAutoExecutionLimit: undefined,
	defaultTools: [],
	gracefulErrors: [],
	featureFlags: {
		enableAgent: true,
		enableModelSelect: true,
		enablePlan: false,
		enableSuggestions: false,
		enableRewrite: true,
		enableDarkMode: true,
		enablePromptOptimizer: true,
		hideToolsInIframe: false,
		enableKnowledgeMCP: true,
		allowEmbeddingOptions: true,
		showKnowledgeMenu: true,
		showToolboxMenu: true,
		showPlatformLinks: true,
	},
};

const EMPTY_THEME: FullTheme = {
	playground: structuredClone(EMPTY_PLAYGROUND),
};

const FEATURE_FLAGS: {
	key: keyof NonNullable<ThemeMap["playground"]["featureFlags"]>;
	label: string;
}[] = [
	{ key: "enableAgent", label: "Enable Agent" },
	{ key: "enableModelSelect", label: "Enable Model Select" },
	{ key: "enablePlan", label: "Enable Plan" },
	{ key: "enableSuggestions", label: "Enable Suggestions" },
	{ key: "enableRewrite", label: "Enable Rewrite" },
	{ key: "enableDarkMode", label: "Enable Dark Mode" },
	{ key: "enablePromptOptimizer", label: "Enable Prompt Optimizer" },
	{ key: "hideToolsInIframe", label: "Hide Tools In Iframe" },
	{ key: "enableKnowledgeMCP", label: "Enable Knowledge MCP" },
	{ key: "allowEmbeddingOptions", label: "Allow Embedding Options" },
	{ key: "showKnowledgeMenu", label: "Show Knowledge Menu" },
	{ key: "showToolboxMenu", label: "Show Toolbox Menu" },
	{ key: "showPlatformLinks", label: "Show Platform Links" },
	{ key: "enableFeedbackText", label: "Enable Feedback Text" },
];

const IMAGE_FIELDS: {
	key: keyof ThemeMap["playground"]["images"];
	label: string;
}[] = [
	{ key: "app", label: "App" },
	{ key: "logo", label: "Logo" },
	{ key: "login", label: "Login" },
	{ key: "loginDark", label: "Login (Dark)" },
	{ key: "landing", label: "Landing" },
	{ key: "landingDark", label: "Landing (Dark)" },
	{ key: "workspace", label: "Workspace" },
	{ key: "workspaceDark", label: "Workspace (Dark)" },
	{ key: "tabIcon", label: "Tab Icon" },
	{ key: "error", label: "Error" },
	{ key: "errorDark", label: "Error (Dark)" },
];

const HEX_REGEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

const NEW_THEME_ID = "__new__";

type ActiveTab = "client" | "playground" | "json";

export const AdminThemePage: React.FC = () => {
	const { adminMode } = useSettings();

	const getThemes = useAPI(["getAdminThemes", 0, -1], {
		data: [],
	});

	const [themeId, setThemeId] = useState<string>("");
	const [isCreating, setIsCreating] = useState(false);
	const [themeName, setThemeName] = useState("");
	const [themeValue, setThemeValue] = useState("");
	const [themeActive, setThemeActive] = useState(false);
	const [jsonErrors, setJsonErrors] = useState<string[]>([]);
	const [activeTab, setActiveTab] = useState<ActiveTab>("json");
	const [isLoading, setIsLoading] = useState(false);

	const selectedTheme = isCreating
		? undefined
		: getThemes.data?.find((t) => t.ID === themeId);

	const parsedTheme = useMemo<FullTheme | null>(() => {
		if (!themeValue.trim()) {
			return null;
		}
		try {
			return JSON.parse(themeValue) as FullTheme;
		} catch {
			return null;
		}
	}, [themeValue]);

	const isValidJson = parsedTheme !== null;

	const originalValue = selectedTheme
		? JSON.stringify(selectedTheme.THEME_MAP, null, 2)
		: "";
	const hasChanges =
		isCreating ||
		(selectedTheme &&
			(themeName !== selectedTheme.THEME_NAME ||
				themeValue !== originalValue));

	// pick initial theme from API
	// biome-ignore lint/correctness/useExhaustiveDependencies: this is okay
	useEffect(() => {
		if (getThemes.status !== "SUCCESS" || !getThemes.data) {
			return;
		}
		if (isCreating || themeId) {
			return;
		}

		let selected = "";
		for (const theme of getThemes.data) {
			if (theme.IS_ACTIVE) {
				selected = theme.ID;
				break;
			}
		}

		if (!selected && getThemes.data.length > 0) {
			selected = getThemes.data[0].ID;
		}

		setThemeId(selected);
	}, [getThemes.status, JSON.stringify(getThemes.data)]);

	// load selected theme into editor state
	useEffect(() => {
		if (isCreating) {
			return;
		}
		setThemeName(selectedTheme?.THEME_NAME || "");
		setThemeValue(
			selectedTheme
				? JSON.stringify(selectedTheme.THEME_MAP, null, 2)
				: "",
		);
		setThemeActive(selectedTheme?.IS_ACTIVE || false);
	}, [selectedTheme, isCreating]);

	const startCreating = () => {
		setIsCreating(true);
		setThemeId("");
		setThemeName("");
		setThemeValue(JSON.stringify(EMPTY_THEME, null, 2));
		setThemeActive(false);
		setJsonErrors([]);
	};

	const cancelCreating = () => {
		setIsCreating(false);
		const active = getThemes.data?.find((t) => t.IS_ACTIVE);
		const fallback = active?.ID || getThemes.data?.[0]?.ID || "";
		setThemeId(fallback);
	};

	const updateTheme = (mutator: (draft: FullTheme) => void) => {
		if (!parsedTheme) return;
		const draft = structuredClone(parsedTheme);
		mutator(draft);
		setThemeValue(JSON.stringify(draft, null, 2));
	};

	const saveTheme = async () => {
		if (!parsedTheme) {
			toast.error("Invalid JSON — please fix errors before saving");
			return;
		}
		if (!themeName.trim()) {
			toast.error("Theme name is required");
			return;
		}

		try {
			setIsLoading(true);

			if (isCreating) {
				const trimmed = themeName.trim();
				const response = await createAdminTheme(
					trimmed,
					parsedTheme as ThemeMap,
					false,
				);
				if (!response) {
					throw new Error("Failed to create theme");
				}
				toast.success("Theme created successfully");
				setIsCreating(false);
				try {
					const list = await getAdminThemes(0, -1);
					const created = list.find((t) => t.THEME_NAME === trimmed);
					if (created) {
						setThemeId(created.ID);
					}
				} catch {
					// non-fatal: refresh will still pick something
				}
				getThemes.refresh();
			} else {
				const response = await editAdminTheme(
					themeId,
					themeName,
					parsedTheme as ThemeMap,
					themeActive,
				);
				if (!response) {
					throw new Error("Failed to save theme");
				}
				toast.success("Theme saved");
				getThemes.refresh();
			}
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save theme",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const deleteTheme = async () => {
		if (!selectedTheme) return;
		try {
			setIsLoading(true);
			const response = await deleteAdminTheme(selectedTheme.ID);
			if (!response) {
				throw new Error("Failed to delete theme");
			}
			toast.success("Theme deleted");
			setThemeId("");
			getThemes.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to delete theme",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const activateTheme = async () => {
		try {
			setIsLoading(true);
			const response = await setActiveAdminTheme(themeId);
			if (!response) {
				throw new Error("Failed to activate theme");
			}
			toast.success("Theme activated");
			getThemes.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to activate theme",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleValidate = (markers: { message: string }[]) => {
		setJsonErrors(markers.map((m) => m.message));
	};

	if (!adminMode) {
		return <Navigate to={"/settings"} />;
	}

	if (getThemes.status === "LOADING") {
		return (
			<div className="flex items-center justify-center py-4">
				<Spinner />
			</div>
		);
	}

	const saveDisabled =
		isLoading || !isValidJson || !themeName.trim() || !hasChanges;
	const hasNoThemeSelected = !isCreating && !selectedTheme;

	return (
		<div className="mx-auto flex w-full flex-1 flex-col gap-4">
			{/* Header: theme picker + actions */}
			<div className="flex items-center justify-between gap-2">
				<Select
					value={isCreating ? NEW_THEME_ID : themeId}
					onValueChange={(value) => {
						if (value === NEW_THEME_ID) {
							startCreating();
							return;
						}
						setIsCreating(false);
						setThemeId(value);
					}}
				>
					<SelectTrigger className="w-[320px]">
						<SelectValue placeholder="Select Theme" />
					</SelectTrigger>
					<SelectContent>
						{getThemes.data?.map((t) => (
							<SelectItem key={t.ID} value={t.ID}>
								{t.THEME_NAME}
								{t.IS_ACTIVE ? " (active)" : ""}
							</SelectItem>
						))}
						{isCreating && (
							<SelectItem value={NEW_THEME_ID}>
								New theme (unsaved)
							</SelectItem>
						)}
					</SelectContent>
				</Select>
				<div className="flex gap-2">
					{isCreating ? (
						<Button
							variant="outline"
							onClick={cancelCreating}
							disabled={isLoading}
						>
							<XIcon />
							Cancel
						</Button>
					) : (
						<>
							<Button
								variant="outline"
								disabled={
									themeActive || isLoading || !selectedTheme
								}
								onClick={() => activateTheme()}
								data-test-id="activateTheme-btn"
							>
								Activate
							</Button>
							<Button
								variant="destructive"
								disabled={isLoading || !selectedTheme}
								onClick={() => deleteTheme()}
								data-test-id="deleteTheme-btn"
							>
								<TrashIcon />
								Delete
							</Button>
						</>
					)}
					<Button onClick={startCreating} disabled={isLoading}>
						<PlusIcon />
						New Theme
					</Button>
				</div>
			</div>

			{hasNoThemeSelected ? (
				<div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-12 text-muted-foreground">
					<p>No themes yet.</p>
					<Button onClick={startCreating}>
						<PlusIcon />
						Create your first theme
					</Button>
				</div>
			) : (
				<>
					<FieldGroup>
						<Field>
							<FieldLabel>Name</FieldLabel>
							<Input
								disabled={isLoading}
								value={themeName}
								onChange={(e) => setThemeName(e.target.value)}
								placeholder="Enter name"
							/>
						</Field>
					</FieldGroup>

					<Tabs
						value={activeTab}
						onValueChange={(v) => setActiveTab(v as ActiveTab)}
					>
						<div className="flex items-center justify-between">
							<TabsList>
								<TabsTrigger value="json">JSON</TabsTrigger>
								<TabsTrigger value="client">Client</TabsTrigger>
								<TabsTrigger value="playground">
									Playground
								</TabsTrigger>
							</TabsList>
							<Button
								onClick={saveTheme}
								disabled={saveDisabled}
								data-test-id="saveTheme-btn"
							>
								{isLoading ? <Spinner /> : null}
								{isCreating ? "Create" : "Save"}
							</Button>
						</div>

						<TabsContent value="client">
							{parsedTheme ? (
								<ClientForm
									theme={parsedTheme}
									disabled={isLoading}
									updateTheme={updateTheme}
								/>
							) : (
								<InvalidJsonNotice />
							)}
						</TabsContent>

						<TabsContent value="playground">
							{parsedTheme ? (
								<PlaygroundForm
									theme={parsedTheme}
									disabled={isLoading}
									updateTheme={updateTheme}
								/>
							) : (
								<InvalidJsonNotice />
							)}
						</TabsContent>

						<TabsContent value="json">
							<div className="flex flex-col gap-2">
								<div className="h-[60vh] w-full overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30">
									<Suspense
										fallback={
											<div className="flex h-full w-full items-center justify-center">
												<Spinner />
											</div>
										}
									>
										<MonacoEditor
											width={"100%"}
											height={"100%"}
											options={{
												minimap: { enabled: false },
												readOnly: isLoading,
												contextmenu: false,
												lineNumbers: "on",
												automaticLayout: true,
												scrollBeyondLastLine: false,
											}}
											value={themeValue}
											language={"json"}
											onChange={(newValue) => {
												setThemeValue(
													(newValue as string) ?? "",
												);
											}}
											onValidate={handleValidate}
											data-test-id="theme-editor"
										/>
									</Suspense>
								</div>
								{!isValidJson && (
									<div className="rounded-md border border-destructive/40 bg-destructive/5 p-2 text-destructive text-sm">
										JSON is not parseable. Save is disabled
										until this is fixed.
									</div>
								)}
								{isValidJson && jsonErrors.length > 0 && (
									<div className="flex flex-col gap-1 rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-amber-600 text-sm dark:text-amber-400">
										{jsonErrors.map((err, i) => (
											// biome-ignore lint/suspicious/noArrayIndexKey: marker order is stable
											<span key={i}>{err}</span>
										))}
									</div>
								)}
							</div>
						</TabsContent>
					</Tabs>
				</>
			)}
		</div>
	);
};

const InvalidJsonNotice: React.FC = () => (
	<div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-destructive text-sm">
		The JSON is invalid — fix it in the JSON tab to use the form editor.
	</div>
);

/* -------------------------------------------------------------------------- */
/*  Playground Form                                                            */
/* -------------------------------------------------------------------------- */

interface FormProps {
	theme: FullTheme;
	disabled: boolean;
	updateTheme: (mutator: (draft: FullTheme) => void) => void;
}

const ensurePlayground = (d: FullTheme): ThemeMap["playground"] => {
	if (!d.playground) {
		d.playground = structuredClone(EMPTY_PLAYGROUND);
	}
	return d.playground;
};

const PlaygroundForm: React.FC<FormProps> = ({
	theme,
	disabled,
	updateTheme,
}) => {
	const pg = theme.playground;

	return (
		<div className="flex flex-col gap-6">
			<FormSection title="General">
				<FieldGroup>
					<Field>
						<FieldLabel>Playground Name</FieldLabel>
						<Input
							disabled={disabled}
							value={pg?.name ?? ""}
							onChange={(e) =>
								updateTheme((d) => {
									ensurePlayground(d).name = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Banner</FieldLabel>
						<Input
							disabled={disabled}
							value={pg?.banner ?? ""}
							onChange={(e) =>
								updateTheme((d) => {
									ensurePlayground(d).banner = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Description</FieldLabel>
						<Textarea
							disabled={disabled}
							value={pg?.description ?? ""}
							rows={3}
							onChange={(e) =>
								updateTheme((d) => {
									ensurePlayground(d).description =
										e.target.value;
								})
							}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection
				title="Colors"
				description="Hex (e.g. #4f46e5), CSS variables, or named colors."
			>
				<FieldGroup>
					<ColorField
						label="Background"
						value={pg?.variables?.backgroundColor ?? ""}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								ensurePlayground(d).variables.backgroundColor =
									v;
							})
						}
					/>
					<ColorField
						label="Primary"
						value={pg?.variables?.primaryColor ?? ""}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								ensurePlayground(d).variables.primaryColor = v;
							})
						}
					/>
					<ColorField
						label="Secondary"
						value={pg?.variables?.secondaryColor ?? ""}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								ensurePlayground(d).variables.secondaryColor =
									v;
							})
						}
					/>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection
				title="Images"
				description="URLs or relative paths used throughout the app."
			>
				<FieldGroup>
					{IMAGE_FIELDS.map(({ key, label }) => (
						<Field key={key}>
							<FieldLabel>{label}</FieldLabel>
							<Input
								disabled={disabled}
								value={pg?.images?.[key] ?? ""}
								placeholder={`https://… or /path/to/${key}.png`}
								onChange={(e) =>
									updateTheme((d) => {
										ensurePlayground(d).images[key] =
											e.target.value;
									})
								}
							/>
						</Field>
					))}
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection title="Behavior">
				<FieldGroup>
					<SwitchField
						label="Sidebar expanded by default"
						checked={pg?.sidebar?.expandedByDefault ?? false}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								ensurePlayground(d).sidebar.expandedByDefault =
									v;
							})
						}
					/>
					<SwitchField
						label="Show chat history date"
						checked={pg?.sidebar?.chatHistoryDate ?? false}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								ensurePlayground(d).sidebar.chatHistoryDate = v;
							})
						}
					/>
					<Field>
						<FieldLabel>Tool auto-execution limit</FieldLabel>
						<Input
							type="number"
							min={0}
							disabled={disabled}
							value={
								pg?.toolAutoExecutionLimit == null
									? ""
									: String(pg.toolAutoExecutionLimit)
							}
							placeholder="Leave empty for default"
							onChange={(e) => {
								const raw = e.target.value;
								updateTheme((d) => {
									const p = ensurePlayground(d);
									if (raw === "") {
										p.toolAutoExecutionLimit = undefined;
									} else {
										const n = Number(raw);
										p.toolAutoExecutionLimit =
											Number.isFinite(n) ? n : undefined;
									}
								});
							}}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection title="Feature Flags">
				<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
					{FEATURE_FLAGS.map(({ key, label }) => (
						<SwitchField
							key={key}
							label={label}
							checked={pg?.featureFlags?.[key] ?? false}
							disabled={disabled}
							onChange={(v) =>
								updateTheme((d) => {
									const p = ensurePlayground(d);
									if (!p.featureFlags) {
										p.featureFlags = {};
									}
									p.featureFlags[key] = v;
								})
							}
						/>
					))}
				</div>
			</FormSection>

			<Separator />

			<FormSection
				title="HTML Content"
				description="Free-form HTML rendered in the app."
			>
				<FieldGroup>
					<Field>
						<FieldLabel>Footer HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={pg?.footer ?? ""}
							rows={4}
							onChange={(e) =>
								updateTheme((d) => {
									ensurePlayground(d).footer = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Landing HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={pg?.landing ?? ""}
							rows={4}
							onChange={(e) =>
								updateTheme((d) => {
									ensurePlayground(d).landing =
										e.target.value;
								})
							}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			<div className="mb-6 rounded-md border border-dashed p-3 text-muted-foreground text-sm">
				Sidebar items, default tools, graceful errors, overrides, and
				other advanced settings are editable in the JSON tab.
			</div>
		</div>
	);
};

/* -------------------------------------------------------------------------- */
/*  Client Form                                                                */
/* -------------------------------------------------------------------------- */

const ensureHomeIntro = (
	d: FullTheme,
): NonNullable<ClientTheme["homeIntroObj"]> => {
	if (!d.homeIntroObj) {
		d.homeIntroObj = {};
	}
	return d.homeIntroObj;
};

const ensureHelpDropdown = (
	d: FullTheme,
): NonNullable<ClientTheme["helpDropdown"]> => {
	if (!d.helpDropdown) {
		d.helpDropdown = {};
	}
	return d.helpDropdown;
};

const ClientForm: React.FC<FormProps> = ({ theme, disabled, updateTheme }) => {
	const client = theme as ClientTheme;

	return (
		<div className="flex flex-col gap-6">
			<FormSection title="Branding">
				<FieldGroup>
					<Field>
						<FieldLabel>Client Name</FieldLabel>
						<Input
							disabled={disabled}
							value={client.name ?? ""}
							onChange={(e) =>
								updateTheme((d) => {
									d.name = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Landing Page Title</FieldLabel>
						<Input
							disabled={disabled}
							value={client.landingPageName ?? ""}
							placeholder="Browser tab title"
							onChange={(e) =>
								updateTheme((d) => {
									d.landingPageName = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Logo</FieldLabel>
						<Input
							disabled={disabled}
							value={client.logo ?? ""}
							placeholder="Image URL, path, or engine ID"
							onChange={(e) =>
								updateTheme((d) => {
									d.logo = e.target.value;
								})
							}
						/>
					</Field>
					<SwitchField
						label="Logo value is a URL"
						checked={client.isLogoUrl ?? false}
						disabled={disabled}
						onChange={(v) =>
							updateTheme((d) => {
								d.isLogoUrl = v;
							})
						}
					/>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection
				title="Cookie Policy"
				description="HTML rendered in the cookie banner and preference modal."
			>
				<FieldGroup>
					<Field>
						<FieldLabel>Cookie Banner HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={client.cookiePolicyBannerReact ?? ""}
							rows={4}
							onChange={(e) =>
								updateTheme((d) => {
									d.cookiePolicyBannerReact = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Preference Modal Header</FieldLabel>
						<Input
							disabled={disabled}
							value={client.cookiePolicyModalHeaderReact ?? ""}
							placeholder="Privacy Preference Center"
							onChange={(e) =>
								updateTheme((d) => {
									d.cookiePolicyModalHeaderReact =
										e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Preference Modal Body HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={client.cookiePolicyModalBodyReact ?? ""}
							rows={6}
							onChange={(e) =>
								updateTheme((d) => {
									d.cookiePolicyModalBodyReact =
										e.target.value;
								})
							}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection title="Terms">
				<FieldGroup>
					<Field>
						<FieldLabel>Terms Header</FieldLabel>
						<Input
							disabled={disabled}
							value={client.termsHeaderReact ?? ""}
							onChange={(e) =>
								updateTheme((d) => {
									d.termsHeaderReact = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Terms HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={client.termsReact ?? ""}
							rows={4}
							onChange={(e) =>
								updateTheme((d) => {
									d.termsReact = e.target.value;
								})
							}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			<Separator />

			<FormSection
				title="Legal Notice Pages"
				description="Full-page HTML for the cookie and privacy notice routes."
			>
				<FieldGroup>
					<Field>
						<FieldLabel>Cookie Notice Page HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={client.cookiePolicyNoticePage ?? ""}
							rows={6}
							placeholder="Leave empty to hide the /cookie-notice route"
							onChange={(e) =>
								updateTheme((d) => {
									d.cookiePolicyNoticePage = e.target.value;
								})
							}
						/>
					</Field>
					<Field>
						<FieldLabel>Privacy Notice Page HTML</FieldLabel>
						<Textarea
							disabled={disabled}
							value={client.privacyNoticePage ?? ""}
							rows={6}
							placeholder="Leave empty to hide the /privacy-notice route"
							onChange={(e) =>
								updateTheme((d) => {
									d.privacyNoticePage = e.target.value;
								})
							}
						/>
					</Field>
				</FieldGroup>
			</FormSection>

			{/* ---------------- Legacy BI ---------------- */}
			<div className="mt-2 border-border border-t-2 pt-8">
				<div className="mb-6 flex flex-col gap-1">
					<h2 className="font-semibold text-lg tracking-tight">
						Legacy BI
					</h2>
					<p className="text-muted-foreground text-sm">
						Fields consumed only by system BI app
						(packages/legacy/dist).
					</p>
				</div>

				<div className="flex flex-col gap-6">
					<FormSection title="Branding (Legacy)">
						<FieldGroup>
							<SwitchField
								label="Include name alongside logo"
								checked={client.includeNameWithLogo ?? false}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										d.includeNameWithLogo = v;
									})
								}
							/>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection
						title="Home Intro"
						description="HTML rendered on the legacy home page."
					>
						<FieldGroup>
							<Field>
								<FieldLabel>Home Intro HTML</FieldLabel>
								<Textarea
									disabled={disabled}
									value={
										client.homeIntroObj?.homeIntroHtml ?? ""
									}
									rows={4}
									onChange={(e) =>
										updateTheme((d) => {
											ensureHomeIntro(d).homeIntroHtml =
												e.target.value;
										})
									}
								/>
							</Field>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection title="Images & Backgrounds">
						<FieldGroup>
							<Field>
								<FieldLabel>Login Image</FieldLabel>
								<Input
									disabled={disabled}
									value={client.loginImage ?? ""}
									onChange={(e) =>
										updateTheme((d) => {
											d.loginImage = e.target.value;
										})
									}
								/>
							</Field>
							<SwitchField
								label="Login image value is a URL"
								checked={client.isLoginImageUrl ?? false}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										d.isLoginImageUrl = v;
									})
								}
							/>
							<Field>
								<FieldLabel>Home Intro Image</FieldLabel>
								<Input
									disabled={disabled}
									value={client.homeIntroImage ?? ""}
									onChange={(e) =>
										updateTheme((d) => {
											d.homeIntroImage = e.target.value;
										})
									}
								/>
							</Field>
							<SwitchField
								label="Home intro image value is a URL"
								checked={client.isHomeIntroImageUrl ?? false}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										d.isHomeIntroImageUrl = v;
									})
								}
							/>
							<Field>
								<FieldLabel>Background Image</FieldLabel>
								<Input
									disabled={disabled}
									value={client.backgroundImage ?? ""}
									onChange={(e) =>
										updateTheme((d) => {
											d.backgroundImage = e.target.value;
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>
									Background Image Opacity
								</FieldLabel>
								<Input
									type="number"
									min={0}
									max={1}
									step={0.05}
									disabled={disabled}
									value={
										client.backgroundImageOpacity == null
											? ""
											: String(
													client.backgroundImageOpacity,
												)
									}
									placeholder="0 – 1"
									onChange={(e) => {
										const raw = e.target.value;
										updateTheme((d) => {
											if (raw === "") {
												d.backgroundImageOpacity =
													undefined;
											} else {
												const n = Number(raw);
												d.backgroundImageOpacity =
													Number.isFinite(n)
														? n
														: undefined;
											}
										});
									}}
								/>
							</Field>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection
						title="Help Dropdown"
						description="Contact & user-guide entries in the legacy help menu."
					>
						<FieldGroup>
							<Field>
								<FieldLabel>Contact Us Title</FieldLabel>
								<Input
									disabled={disabled}
									value={
										client.helpDropdown?.contactUsTitle ??
										""
									}
									onChange={(e) =>
										updateTheme((d) => {
											ensureHelpDropdown(
												d,
											).contactUsTitle = e.target.value;
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Contact Us Link</FieldLabel>
								<Input
									disabled={disabled}
									value={
										client.helpDropdown?.contactUsLink ?? ""
									}
									placeholder="email@example.com or https://…"
									onChange={(e) =>
										updateTheme((d) => {
											ensureHelpDropdown(
												d,
											).contactUsLink = e.target.value;
										})
									}
								/>
							</Field>
							<SwitchField
								label="Contact link is a URL"
								checked={
									client.helpDropdown?.isContactUsLinkUrl ??
									false
								}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										ensureHelpDropdown(
											d,
										).isContactUsLinkUrl = v;
									})
								}
							/>
							<Field>
								<FieldLabel>Contact Us Icon</FieldLabel>
								<Input
									disabled={disabled}
									value={
										client.helpDropdown?.contactUsIcon ?? ""
									}
									onChange={(e) =>
										updateTheme((d) => {
											ensureHelpDropdown(
												d,
											).contactUsIcon = e.target.value;
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Contact Us Description</FieldLabel>
								<Textarea
									disabled={disabled}
									value={
										client.helpDropdown
											?.contactUsDescription ?? ""
									}
									rows={2}
									onChange={(e) =>
										updateTheme((d) => {
											ensureHelpDropdown(
												d,
											).contactUsDescription =
												e.target.value;
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>Description Font Size</FieldLabel>
								<Input
									disabled={disabled}
									value={
										client.helpDropdown
											?.descriptionFontSize ?? ""
									}
									placeholder="regular | small | large"
									onChange={(e) =>
										updateTheme((d) => {
											ensureHelpDropdown(
												d,
											).descriptionFontSize =
												e.target.value;
										})
									}
								/>
							</Field>
							<SwitchField
								label="Show Contact Us heading"
								checked={
									client.helpDropdown?.showContactUsHeading ??
									false
								}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										ensureHelpDropdown(
											d,
										).showContactUsHeading = v;
									})
								}
							/>
							<SwitchField
								label="Show Contact Us section"
								checked={
									client.helpDropdown?.showContactUsSection ??
									false
								}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										ensureHelpDropdown(
											d,
										).showContactUsSection = v;
									})
								}
							/>
							<SwitchField
								label="Show User Guide section"
								checked={
									client.helpDropdown?.showUserGuideSection ??
									false
								}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										ensureHelpDropdown(
											d,
										).showUserGuideSection = v;
									})
								}
							/>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection title="Visualization Defaults">
						<FieldGroup>
							<Field>
								<FieldLabel>Color Palette</FieldLabel>
								<Input
									disabled={disabled}
									value={
										client.visualizationColorPalette ?? ""
									}
									placeholder="One, Two, …"
									onChange={(e) =>
										updateTheme((d) => {
											d.visualizationColorPalette =
												e.target.value;
										})
									}
								/>
							</Field>
							<ColorField
								label="Background Color"
								value={
									client.visualizationBackgroundColor ?? ""
								}
								disabled={disabled}
								onChange={(v) =>
									updateTheme((d) => {
										d.visualizationBackgroundColor = v;
									})
								}
							/>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection
						title="Cookie Policy (Legacy)"
						description="Extra HTML strings only the legacy app renders."
					>
						<FieldGroup>
							<Field>
								<FieldLabel>Cookie Policy Message</FieldLabel>
								<Textarea
									disabled={disabled}
									value={
										client.cookiePolicyMessageReact ?? ""
									}
									rows={3}
									onChange={(e) =>
										updateTheme((d) => {
											d.cookiePolicyMessageReact =
												e.target.value;
										})
									}
								/>
							</Field>
						</FieldGroup>
					</FormSection>

					<Separator />

					<FormSection title="Login Page">
						<FieldGroup>
							<Field>
								<FieldLabel>Login Center HTML</FieldLabel>
								<Textarea
									disabled={disabled}
									value={client.loginCenterHTML ?? ""}
									rows={4}
									onChange={(e) =>
										updateTheme((d) => {
											d.loginCenterHTML = e.target.value;
										})
									}
								/>
							</Field>
							<Field>
								<FieldLabel>
									Login & Signup Text HTML
								</FieldLabel>
								<Textarea
									disabled={disabled}
									value={
										client.loginAndSignupTextCustomHtml ??
										""
									}
									rows={3}
									onChange={(e) =>
										updateTheme((d) => {
											d.loginAndSignupTextCustomHtml =
												e.target.value;
										})
									}
								/>
							</Field>
						</FieldGroup>
					</FormSection>
				</div>
			</div>

			<div className="mb-6 rounded-md border border-dashed p-3 text-muted-foreground text-sm">
				Material theme overrides, home nav items, help banner entries,
				cookie policy lists, and home info cards are editable in the
				JSON tab.
			</div>
		</div>
	);
};

/* -------------------------------------------------------------------------- */
/*  Shared form helpers                                                        */
/* -------------------------------------------------------------------------- */

const FormSection: React.FC<{
	title: string;
	description?: string;
	children: React.ReactNode;
}> = ({ title, description, children }) => (
	<section className="flex flex-col gap-4">
		<div className="flex flex-col gap-1">
			<h3 className="font-semibold text-base tracking-tight">{title}</h3>
			{description && (
				<p className="text-muted-foreground text-sm">{description}</p>
			)}
		</div>
		{children}
	</section>
);

const SwitchField: React.FC<{
	label: string;
	checked: boolean;
	disabled?: boolean;
	onChange: (v: boolean) => void;
}> = ({ label, checked, disabled, onChange }) => {
	const id = useId();
	return (
		<div className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm">
			<label htmlFor={id} className="cursor-pointer">
				{label}
			</label>
			<Switch
				id={id}
				checked={checked}
				disabled={disabled}
				onCheckedChange={onChange}
			/>
		</div>
	);
};

const ColorField: React.FC<{
	label: string;
	value: string;
	disabled?: boolean;
	onChange: (v: string) => void;
}> = ({ label, value, disabled, onChange }) => {
	const colorForPicker = HEX_REGEX.test(value) ? value : "#000000";
	return (
		<Field>
			<FieldLabel>{label}</FieldLabel>
			<div className="flex items-center gap-2">
				<input
					type="color"
					disabled={disabled}
					value={colorForPicker}
					onChange={(e) => onChange(e.target.value)}
					className="h-9 w-12 cursor-pointer rounded border border-input bg-transparent disabled:cursor-not-allowed disabled:opacity-50"
					aria-label={`${label} color picker`}
				/>
				<Input
					disabled={disabled}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="#rrggbb"
				/>
			</div>
		</Field>
	);
};
