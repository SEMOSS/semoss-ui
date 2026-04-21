import { Copy, ExternalLink, X } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { darkTheme, lightTheme } from "@semoss/ui";
import {
	Button,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Tabs,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks";
import {
	BaseSettingSection,
	ColorSettings,
	JsonSettings,
	SizeSettings,
} from "../../settings";
import { BLOCK_TYPE_THEME } from "../block-defaults.constants";
import type { BlockSettingsConfig } from "../settings.types";

export const DefaultStyles: CSSProperties = {
	display: "flex",
	flexDirection: "column",
	padding: "24px",
	gap: "8px",
	fontFamily: "roboto",
};

const capitalize = (s) => {
	return String(s[0]).toUpperCase() + String(s).slice(1);
};

// export the config for the block
export const config: BlockSettingsConfig = {
	type: BLOCK_TYPE_THEME,
	icon: Copy,
	contentMenu: [
		{
			name: "Theme Type",
			children: [
				{
					description: "Theme Type",
					render: ({ id }) => {
						const { setData } = useBlockSettings(id);
						const [themeType, setThemeType] =
							useState<string>("light");
						const options = [
							{
								value: "light",
								display: "Light",
							},
							{
								value: "dark",
								display: "Dark",
							},
						];
						const onChange = (value: string) => {
							setThemeType(value);
							setData(
								"theme",
								value === "light" ? lightTheme : darkTheme,
							);
						};
						return (
							<Select
								value={themeType}
								onValueChange={(value) => {
									onChange(value);
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{options.map((option) => (
										<SelectItem
											key={option.value}
											value={option.value}
										>
											{option.display}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						);
					},
				},
			],
		},
	],
	styleMenu: [
		{
			name: "Theme colors",
			children: [
				{
					description: "Theme colors",
					render: ({ id }) => {
						const [selectedFirstTab, setSelectedFirstTab] =
							useState<string>("primary");
						const [selectedSecondtTab, setSelectedSecondTab] =
							useState<string>("warning");
						const firstTabSet = ["primary", "secondary", "error"];
						const secondTabSet = ["warning", "info", "success"];
						const variants = ["main", "dark", "light"];
						return (
							<div className="flex flex-col gap-2 rounded-xl bg-background">
								<Tabs
									value={selectedFirstTab}
									onValueChange={(value) => {
										setSelectedFirstTab(value);
									}}
								>
									<TabsList>
										{firstTabSet.map(
											(key, _idx: number) => (
												<TabsTrigger
													key={key}
													value={key}
												>
													{capitalize(key)}
												</TabsTrigger>
											),
										)}
									</TabsList>
								</Tabs>
								{variants.map((variant, _idx: number) => (
									<ColorSettings
										key={variant}
										id={id}
										label={`${capitalize(variant)} Color`}
										path={`theme.palette.${selectedFirstTab}.${variant}`}
									/>
								))}
								<Tabs
									value={selectedSecondtTab}
									onValueChange={(value) => {
										setSelectedSecondTab(value);
									}}
								>
									<TabsList>
										{secondTabSet.map(
											(key, _idx: number) => (
												<TabsTrigger
													key={key}
													value={key}
												>
													{capitalize(key)}
												</TabsTrigger>
											),
										)}
									</TabsList>
								</Tabs>
								{variants.map((variant, _idx: number) => (
									<ColorSettings
										key={variant}
										id={id}
										label={`${capitalize(variant)} Color`}
										path={`theme.palette.${selectedSecondtTab}.${variant}`}
									/>
								))}
							</div>
						);
					},
				},
			],
		},
		{
			name: "Text and Background",
			children: [
				{
					description: "Text and Background",
					render: ({ id }) => {
						const [selectedFirstTab, setSelectedFirstTab] =
							useState<string>("text");
						const firstTabSet = ["text", "background"];
						const paperVariants = ["paper", "default"];
						const textVariants = [
							"primary",
							"secondary",
							"disabled",
							"main",
						];
						return (
							<div className="flex flex-col gap-2 rounded-xl bg-background">
								<Tabs
									value={selectedFirstTab}
									onValueChange={(value) => {
										setSelectedFirstTab(value);
									}}
								>
									<TabsList>
										{firstTabSet.map(
											(key, _idx: number) => (
												<TabsTrigger
													key={key}
													value={key}
												>
													{capitalize(key)}
												</TabsTrigger>
											),
										)}
									</TabsList>
								</Tabs>
								{selectedFirstTab === "background" &&
									paperVariants.map(
										(variant, _idx: number) => (
											<ColorSettings
												key={variant}
												id={id}
												label={`${capitalize(variant)} Color`}
												path={`theme.palette.${selectedFirstTab}.${variant}`}
											/>
										),
									)}
								{selectedFirstTab === "text" &&
									textVariants.map(
										(variant, _idx: number) => (
											<ColorSettings
												key={variant}
												id={id}
												label={`${capitalize(variant)} Color`}
												path={`theme.palette.${selectedFirstTab}.${variant}`}
											/>
										),
									)}
							</div>
						);
					},
				},
			],
		},
		{
			name: "Spacing",
			children: [
				{
					description: "Spacing",
					render: ({ id }) => (
						<SizeSettings
							id={id}
							label="Spacing"
							path="theme.spacing"
						/>
					),
				},
			],
		},
		{
			name: "MUI Theme Editor",
			children: [
				{
					description: "Edit MUI Theme",
					render: ({ id }) => {
						const [open, setOpen] = useState(false);
						return (
							<>
								<BaseSettingSection label={"Edit MUI Theme"}>
									<Button
										variant="ghost"
										size="icon-sm"
										onClick={() => setOpen(true)}
										disabled={false}
									>
										<ExternalLink className="size-4" />
									</Button>
								</BaseSettingSection>
								<Dialog
									open={open}
									onOpenChange={(o) => setOpen(o)}
								>
									<DialogContent className="max-w-4xl">
										<DialogHeader>
											<div className="flex flex-row items-center justify-between">
												<DialogTitle>
													Edit MUI theme
												</DialogTitle>
												<Button
													variant="ghost"
													size="icon-sm"
													onClick={() =>
														setOpen(false)
													}
												>
													<X className="size-4" />
												</Button>
											</div>
										</DialogHeader>
										<Separator />
										<JsonSettings
											id={id}
											path="theme"
											height="500px"
											callback={() => setOpen(false)}
										/>
									</DialogContent>
								</Dialog>
							</>
						);
					},
				},
			],
		},
	],
};
