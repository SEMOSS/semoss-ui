import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import type { ThemeMap } from "@semoss/shared";
import {
	Button,
	Card,
	CardContent,
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	Input,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	Spinner,
	Textarea,
	toast,
} from "@semoss/ui/next";
import { useGlobalBreadcrumbs, useRoot } from "@/hooks";

export const SettingsThemePage: React.FC = observer(() => {
	const { root } = useRoot();

	useGlobalBreadcrumbs([
		{
			name: "Settings",
			path: "/settings",
		},
		{
			name: "Theme",
			path: "/settings/theme",
		},
	]);

	const [themeSettings, setThemeSettings] = useState<ThemeMap["playground"]>(
		root.theme || {
			name: "",
			description: "",
			variables: {
				backgroundColor: "#ffffff",
				primaryColor: "#000000",
				secondaryColor: "#666666",
			},
			images: {
				app: "",
				logo: "",
				login: "",
				landing: "",
				workspace: "",
			},
			overrides: {
				"main-layout": {},
			},
			footer: "",
			landing: "",
			sidebar: {
				headerItems: [],
				footerItems: [],
			},
			dialog: undefined,
			defaultTools: [],
		},
	);

	const [isLoading, setIsLoading] = useState(false);

	/**
	 * Load defaults from root store on mount
	 */
	useEffect(() => {
		if (root.theme) {
			setThemeSettings(root.theme);
		}
	}, [root.theme]);

	/**
	 * Update basic text fields
	 */
	const handleBasicChange =
		(field: "name" | "description") =>
		(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			setThemeSettings((prev) => ({
				...prev,
				[field]: e.target.value,
			}));
		};

	/**
	 * Update color variables
	 */
	const handleColorChange =
		(colorKey: "backgroundColor" | "primaryColor" | "secondaryColor") =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setThemeSettings((prev) => ({
				...prev,
				variables: {
					...prev.variables,
					[colorKey]: e.target.value,
				},
			}));
		};

	/**
	 * Update image paths
	 */
	const handleImageChange =
		(imageKey: "app" | "logo" | "login" | "landing" | "workspace") =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			setThemeSettings((prev) => ({
				...prev,
				images: {
					...prev.images,
					[imageKey]: e.target.value,
				},
			}));
		};

	/**
	 * Update footer and landing HTML
	 */
	const handleHTMLChange =
		(field: "footer" | "landing") =>
		(e: React.ChangeEvent<HTMLTextAreaElement>) => {
			setThemeSettings((prev) => ({
				...prev,
				[field]: e.target.value,
			}));
		};

	/**
	 * Save theme settings
	 */
	const handleSave = async () => {
		try {
			setIsLoading(true);

			// TODO: API call would go here
			toast.success("Theme saved successfully");
		} catch (error) {
			console.error("Failed to save theme settings:", error);
			toast.error("Failed to save theme");
		} finally {
			setIsLoading(false);
		}
	};

	/**
	 * Reset theme to defaults from root store
	 */
	const handleReset = () => {
		setThemeSettings(root.theme);
		toast.success("Theme reset successfully");
	};

	return (
		<Card>
			<CardContent>
				<form>
					<FieldGroup>
						<FieldSet>
							<FieldLegend className="flex w-full items-center gap-2">
								Theme Settings
							</FieldLegend>
							<FieldDescription>
								Update your application theme and branding
							</FieldDescription>

							<FieldGroup>
								{/* Basic Information */}
								<Field>
									<FieldLabel>App Name</FieldLabel>
									<Input
										placeholder="Enter application name"
										value={themeSettings.name}
										onChange={handleBasicChange("name")}
									/>
								</Field>

								<Field>
									<FieldLabel>Description</FieldLabel>
									<Textarea
										placeholder="Enter application description"
										value={themeSettings.description}
										onChange={handleBasicChange(
											"description",
										)}
										className="resize-none"
									/>
								</Field>
							</FieldGroup>
						</FieldSet>

						<FieldSeparator />

						{/* Colors */}
						<FieldSet>
							<FieldLegend>Colors</FieldLegend>
							<FieldDescription>
								Define the color scheme for your application
							</FieldDescription>

							<FieldGroup>
								<Field>
									<FieldLabel>Background Color</FieldLabel>
									<InputGroup>
										<InputGroupAddon align="inline-start">
											<div
												className="size-5 border border-border"
												style={{
													backgroundColor:
														themeSettings.variables
															.backgroundColor,
												}}
											/>
										</InputGroupAddon>
										<InputGroupInput
											placeholder="Background Color"
											value={
												themeSettings.variables
													.backgroundColor
											}
											onChange={handleColorChange(
												"backgroundColor",
											)}
										/>
									</InputGroup>
								</Field>

								<Field>
									<FieldLabel>Primary Color</FieldLabel>
									<InputGroup>
										<InputGroupAddon align="inline-start">
											<div
												className="size-5 border border-border"
												style={{
													backgroundColor:
														themeSettings.variables
															.primaryColor,
												}}
											/>
										</InputGroupAddon>
										<InputGroupInput
											type="text"
											placeholder="Primary Color"
											value={
												themeSettings.variables
													.primaryColor
											}
											onChange={handleColorChange(
												"primaryColor",
											)}
										/>
									</InputGroup>
								</Field>

								<Field>
									<FieldLabel>Secondary Color</FieldLabel>
									<InputGroup>
										<InputGroupAddon align="inline-start">
											<div
												className="size-5 border border-border"
												style={{
													backgroundColor:
														themeSettings.variables
															.secondaryColor,
												}}
											/>
										</InputGroupAddon>
										<InputGroupInput
											type="text"
											placeholder="Secondary Color"
											value={
												themeSettings.variables
													.secondaryColor
											}
											onChange={handleColorChange(
												"secondaryColor",
											)}
										/>
									</InputGroup>
								</Field>
							</FieldGroup>
						</FieldSet>

						<FieldSeparator />

						{/* Images */}
						<FieldSet>
							<FieldLegend>Images</FieldLegend>
							<FieldDescription>
								Upload or provide URLs for your application
								images
							</FieldDescription>

							<FieldGroup>
								<Field>
									<FieldLabel>App Icon</FieldLabel>
									<Input
										placeholder="Enter image URL or path"
										value={themeSettings.images.app}
										onChange={handleImageChange("app")}
									/>
								</Field>

								<Field>
									<FieldLabel>Logo</FieldLabel>
									<Input
										placeholder="Enter image URL or path"
										value={themeSettings.images.logo}
										onChange={handleImageChange("logo")}
									/>
								</Field>

								<Field>
									<FieldLabel>Login Page Image</FieldLabel>
									<Input
										placeholder="Enter image URL or path"
										value={themeSettings.images.login}
										onChange={handleImageChange("login")}
									/>
								</Field>

								<Field>
									<FieldLabel>Landing Page Image</FieldLabel>
									<Input
										placeholder="Enter image URL or path"
										value={themeSettings.images.landing}
										onChange={handleImageChange("landing")}
									/>
								</Field>

								<Field>
									<FieldLabel>Workspace Image</FieldLabel>
									<Input
										placeholder="Enter image URL or path"
										value={themeSettings.images.workspace}
										onChange={handleImageChange(
											"workspace",
										)}
									/>
								</Field>
							</FieldGroup>
						</FieldSet>

						<FieldSeparator />

						{/* HTML Content */}
						<FieldSet>
							<FieldLegend>HTML Content</FieldLegend>
							<FieldDescription>
								Add custom HTML content to specific areas
							</FieldDescription>

							<FieldGroup>
								<Field>
									<FieldLabel>Footer Content</FieldLabel>
									<Textarea
										placeholder="Enter HTML content for footer"
										value={themeSettings.footer}
										onChange={handleHTMLChange("footer")}
										className="h-32 resize-none font-mono text-sm"
									/>
								</Field>

								<Field>
									<FieldLabel>
										Landing Page Content
									</FieldLabel>
									<Textarea
										placeholder="Enter HTML content for landing page"
										value={themeSettings.landing}
										onChange={handleHTMLChange("landing")}
										className="h-32 resize-none font-mono text-sm"
									/>
								</Field>
							</FieldGroup>
						</FieldSet>

						<FieldSeparator />

						{/* Save and Reset Buttons */}
						<div className="flex items-center gap-2">
							<Button
								type="button"
								onClick={handleSave}
								disabled={isLoading}
							>
								{isLoading ? <Spinner /> : "Save"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleReset}
								disabled={isLoading}
							>
								Reset
							</Button>
						</div>
					</FieldGroup>
				</form>
			</CardContent>
		</Card>
	);
});
