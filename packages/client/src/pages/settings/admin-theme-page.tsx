import { PlusIcon, TrashIcon } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import type { ThemeMap } from "@semoss/shared";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from "@semoss/ui/next";
import {
	createAdminTheme,
	deleteAdminTheme,
	editAdminTheme,
	setActiveAdminTheme,
} from "@/api/theme";
import { useAPI, useSettings } from "@/hooks";

export const AdminThemePage: React.FC = () => {
	const { adminMode } = useSettings();

	const getThemes = useAPI(["getAdminThemes", 0, -1], {
		data: [],
	});

	const [themeId, setThemeId] = useState<string>("");
	const [themeName, setThemeName] = useState("");
	const [themeValue, setThemeValue] = useState("");
	const [themeActive, setThemeActive] = useState(false);

	const [isLoading, setIsLoading] = useState(false);
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [newThemeName, setNewThemeName] = useState("");

	const selectedTheme = getThemes.data?.find((t) => t.ID === themeId);

	// set the active theme based on the data
	// biome-ignore lint/correctness/useExhaustiveDependencies: this is okay
	useEffect(() => {
		if (getThemes.status !== "SUCCESS" || !getThemes.data) {
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

	// update the editor when selected theme changes
	useEffect(() => {
		setThemeId(selectedTheme?.ID || "");
		setThemeName(selectedTheme?.THEME_NAME || "");
		setThemeValue(
			selectedTheme
				? JSON.stringify(selectedTheme.THEME_MAP, null, 2)
				: "",
		);
		setThemeActive(selectedTheme?.IS_ACTIVE || false);
	}, [selectedTheme]);

	/**
	 * @name saveTheme
	 * @desc Set the current theme as active
	 */
	const saveTheme = async () => {
		try {
			setIsLoading(true);

			// Validate JSON
			let parsedTheme: ThemeMap;
			try {
				parsedTheme = JSON.parse(themeValue);
			} catch (_error) {
				throw new Error("Invalid JSON format");
			}

			const response = await editAdminTheme(
				themeId,
				themeName,
				parsedTheme,
				themeActive,
			);

			if (!response) {
				throw new Error("Failed to save theme");
			}

			getThemes.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to save theme",
			);
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * @name handleDeleteTheme
	 * @desc Delete the current theme
	 */
	const deleteTheme = async () => {
		try {
			setIsLoading(true);

			const response = await deleteAdminTheme(selectedTheme?.ID || "");

			if (!response) {
				throw new Error("Failed to delete theme");
			}

			getThemes.refresh();

			toast.success("Theme deleted successfully");
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

	/**
	 * @name activateTheme
	 * @desc Set the current theme as active
	 */
	const activateTheme = async () => {
		try {
			setIsLoading(true);

			const response = await setActiveAdminTheme(themeId);

			if (!response) {
				throw new Error("Failed to delete theme");
			}

			getThemes.refresh();

			toast.success("Theme activated successfully");
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

	/**
	 * @name handleCreateTheme
	 * @desc Create a new theme
	 */
	const createTheme = async () => {
		try {
			setIsLoading(true);

			if (!newThemeName.trim()) {
				throw new Error("Theme name is required");
			}

			// Create with empty theme object
			const emptyTheme: ThemeMap = {
				playground: {
					name: newThemeName,
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
						headerItems: [],
						footerItems: [],
						chatHistoryDate: false,
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
					},
				},
			};

			const response = await createAdminTheme(
				newThemeName,
				emptyTheme,
				true,
			);

			if (!response) {
				throw new Error("Failed to create theme");
			}

			toast.success("Theme created successfully");

			setIsCreateDialogOpen(false);
			setNewThemeName("");
			getThemes.refresh();
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create theme",
			);
		} finally {
			setIsLoading(false);
		}
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

	return (
		<div className={"mx-auto flex w-full flex-1 flex-col gap-6"}>
			{/* Theme List Section */}
			<div className="flex items-center justify-between">
				<Select
					value={themeId}
					onValueChange={(value) => {
						setThemeId(value);
					}}
				>
					<SelectTrigger className="w-[280px]">
						<SelectValue placeholder="Select Theme" />
					</SelectTrigger>
					<SelectContent>
						{getThemes.data?.map((t) => (
							<SelectItem key={t.ID} value={t.ID}>
								{t.THEME_NAME}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button onClick={() => setIsCreateDialogOpen(true)}>
					<PlusIcon />
					Create Theme
				</Button>
			</div>

			<FieldGroup>
				<Field>
					<FieldLabel>Name</FieldLabel>
					<Input
						disabled={isLoading}
						value={themeName}
						onChange={(e) => {
							setThemeName(e.target.value);
						}}
						placeholder="Enter name"
					/>
				</Field>

				<Field orientation="horizontal">
					<FieldLabel>JSON</FieldLabel>
					<div className="flex gap-2">
						<Button
							disabled={
								isLoading ||
								!selectedTheme ||
								(themeName === selectedTheme.THEME_NAME &&
									themeValue ===
										JSON.stringify(
											selectedTheme.THEME_MAP,
											null,
											2,
										))
							}
							onClick={() => {
								saveTheme();
							}}
							data-test-id="saveTheme-btn"
						>
							Save
						</Button>
						<Button
							variant="outline"
							disabled={themeActive || isLoading}
							onClick={() => activateTheme()}
							data-test-id="activateTheme-btn"
						>
							Activate
						</Button>
						<Button
							disabled={isLoading}
							variant="destructive"
							onClick={() => deleteTheme()}
							data-test-id="deleteTheme-btn"
						>
							<TrashIcon />
							Delete
						</Button>
					</div>
				</Field>
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
								minimap: {
									enabled: false,
								},
								readOnly: isLoading,
								contextmenu: false,
							}}
							value={themeValue}
							language={"json"}
							onChange={(newValue) => {
								setThemeValue(newValue as string);
							}}
							data-test-id="theme-editor"
						/>
					</Suspense>
				</div>
			</FieldGroup>

			{/* Create Theme Dialog */}
			<Dialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Create Theme</DialogTitle>
					</DialogHeader>
					<Field>
						<FieldLabel>Theme Name</FieldLabel>
						<Input
							value={newThemeName}
							onChange={(e) => setNewThemeName(e.target.value)}
							placeholder="Enter theme name"
						/>
					</Field>
					<DialogFooter>
						<Button
							variant="outline"
							disabled={isLoading}
							onClick={() => {
								setIsCreateDialogOpen(false);
								setNewThemeName("");
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => createTheme()}
							disabled={isLoading || !newThemeName.trim()}
						>
							{isLoading ? <Spinner /> : "Create"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};
