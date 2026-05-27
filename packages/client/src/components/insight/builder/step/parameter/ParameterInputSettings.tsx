import { autorun } from "mobx";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import { Blocks, DefaultBlocks, type StateStore } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Input,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from "@semoss/ui/next";
import { BaseSettingSection } from "@/components/blocks-workspace/blocks/settings/BaseSettingSection";
import { SelectInputValueSettings } from "@/components/blocks-workspace/blocks/settings/custom/SelectInputValueSettings";
import { InputSettings } from "@/components/blocks-workspace/blocks/settings/shared/InputSettings";
import { SelectInputSettings } from "@/components/blocks-workspace/blocks/settings/shared/SelectInputSettings";
import { SwitchSettings } from "@/components/blocks-workspace/blocks/settings/shared/SwitchSettings";
import { SelectedMenuSection } from "@/components/designer/SelectedMenuSection";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import type { FilterParameter } from "../../../insight.types";
import {
	type ParameterQueryConfig,
	ParameterQueryDialog,
} from "./ParameterQueryDialog";

// Form data type for parameter editor
interface ParameterFormData {
	name: string;
	inputType: FilterParameter["inputType"];
	required: boolean;
	defaultValue: string;
	hint: string;
	optionsText: string;
	optionsSourceType: FilterParameter["optionsSourceType"];
	optionsSourceQueryId: string;
	optionLabel: string;
	optionValue: string;
	optionSublabel: string;
	multiple: boolean;
	direction: "row" | "column";
	label: string;
	size: "small" | "medium";
	color: string;
}

interface ParameterInputSettingsProps {
	inputType: FilterParameter["inputType"];
	form: UseFormReturn<ParameterFormData>;
	blockState: StateStore;
	blockId: string;
}

// Input filter settings config (for text, number, date)
const getInputParameterConfig = () => ({
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Input Type",
					render: ({ id }: { id: string }) => (
						<SelectInputSettings
							id={id}
							path="type"
							label="Type"
							options={[
								{ value: "text", display: "Text" },
								{ value: "number", display: "Number" },
								{ value: "date", display: "Date" },
							]}
						/>
					),
				},
				{
					description: "Label",
					render: ({ id }: { id: string }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Hint",
					render: ({ id }: { id: string }) => (
						<InputSettings id={id} label="Hint" path="hint" />
					),
				},
				{
					description: "Default Value",
					render: ({ id }: { id: string }) => (
						<InputSettings
							id={id}
							label="Default Value"
							path="value"
						/>
					),
				},
				{
					description: "Required",
					render: ({ id }: { id: string }) => (
						<SwitchSettings
							id={id}
							label="Required"
							path="required"
						/>
					),
				},
				{
					description: "Disabled",
					render: ({ id }: { id: string }) => (
						<SwitchSettings
							id={id}
							label="Disabled"
							path="disabled"
						/>
					),
				},
			],
		},
	],
	styleMenu: [
		{
			name: "Miscellaneous",
			children: [
				{
					description: "Rows",
					render: ({ id }: { id: string }) => (
						<InputSettings
							id={id}
							label="Rows"
							path="rows"
							type="number"
							description="Number of rows for multiline text input"
						/>
					),
				},
			],
		},
	],
});

const InputParameterSettings = ({
	form,
	blockState,
	blockId,
}: {
	form: UseFormReturn<ParameterFormData>;
	blockState: StateStore;
	blockId: string;
}) => {
	const { setValue } = form;
	const _baseId = useId();
	const [settingSection, setSettingSection] = useState<string | number>(0);
	const [contentAccordion, setContentAccordion] = useState<
		Record<string, boolean>
	>({
		"section--0": true,
	});
	const [styleAccordion, setStyleAccordion] = useState<
		Record<string, boolean>
	>({
		"section--0": true,
	});

	// Set up autorun to sync block changes back to form
	useEffect(() => {
		const dispose = autorun(() => {
			const block = blockState.getBlock(blockId);
			if (block) {
				// Sync block data back to form
				setValue("label", (block.data.label as string) || "");
				setValue("hint", (block.data.hint as string) || "");
				setValue("defaultValue", (block.data.value as string) || "");
				setValue("required", (block.data.required as boolean) || false);
			}
		});

		return () => {
			dispose();
		};
	}, [blockId, blockState, setValue]);

	const config = useMemo(() => getInputParameterConfig(), []);

	return (
		<div>
			<Tabs
				value={String(settingSection)}
				onValueChange={(val) => setSettingSection(Number(val))}
			>
				<TabsList className="w-full">
					<TabsTrigger value="0" className="flex-1">
						Settings
					</TabsTrigger>
					<TabsTrigger value="1" className="flex-1">
						Appearance
					</TabsTrigger>
				</TabsList>

				<TabsContent value="0">
					<SelectedMenuSection
						id={blockId}
						sectionTitle=""
						menu={config.contentMenu}
						accordion={contentAccordion}
						setAccordion={(acc: object) =>
							setContentAccordion(acc as Record<string, boolean>)
						}
					/>
				</TabsContent>

				<TabsContent value="1">
					<SelectedMenuSection
						id={blockId}
						sectionTitle=""
						menu={config.styleMenu}
						accordion={styleAccordion}
						setAccordion={(acc: object) =>
							setStyleAccordion(acc as Record<string, boolean>)
						}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

const formatOptionsToText = (options: unknown): string => {
	if (!options || !Array.isArray(options) || options.length === 0) return "";
	return (options as string[]).map((o) => `'${o}'`).join(", ");
};

const parseOptionsText = (text: string): string[] =>
	text
		.split(",")
		.map((s) =>
			s
				.trim()
				.replace(/^['"]|['"]$/g, "")
				.trim(),
		)
		.filter(Boolean);

const getSelectParameterConfig = () => ({
	contentMenu: [
		{
			name: "General",
			children: [
				{
					description: "Label",
					render: ({ id }: { id: string }) => (
						<InputSettings id={id} label="Label" path="label" />
					),
				},
				{
					description: "Options Configuration",
					render: ({ id }: { id: string }) => {
						const { data, setData } = useBlockSettings(id);
						const [showQueryDialog, setShowQueryDialog] =
							useState(false);

						// Determine current mode based on what data is present
						const hasSqlQuery = !!(data as Record<string, unknown>)
							.parameterSqlQuery;

						// Initialize tab to SQL mode if SQL query exists, otherwise Manual
						const [activeTab, setActiveTab] = useState<number>(
							hasSqlQuery ? 1 : 0,
						);

						// Initialize optionsText from data.options on mount
						const [optionsText, setOptionsText] = useState<string>(
							formatOptionsToText(data.options),
						);

						// Track if we're currently loading to prevent duplicate calls
						const [isAutoLoading, setIsAutoLoading] =
							useState(false);

						// Helper function to execute SQL query and load options
						const loadSqlOptions = useCallback(
							async (databaseId: string, sqlQuery: string) => {
								// Prevent duplicate calls
								if (isAutoLoading) {
									console.log(
										"Already loading, skipping duplicate call",
									);
									return;
								}

								try {
									setIsAutoLoading(true);
									// Set loading state
									setData(
										"loading" as keyof typeof data,
										true as never,
									);

									// Escape double quotes in SQL query
									const escapedQuery = sqlQuery.replace(
										/"/g,
										'\\"',
									);

									// Build pixel query for preview (limit 100 rows for parameters)
									const reactorPixel = `Database(database=["${databaseId}"]) | Query("${escapedQuery}") | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["param_query_preview"])]) ; META | Frame() | QueryAll() | Limit(100) | Collect(500);`;

									const response =
										await runPixel(reactorPixel);
									const type =
										response.pixelReturn[0]?.operationType;

									if (type && type.indexOf("ERROR") !== -1) {
										const error =
											response.pixelReturn[0]?.output;
										console.error(
											"SQL query error:",
											error,
										);
										toast.error(
											`Failed to load options: ${String(error)}`,
										);
										setData(
											"loading" as keyof typeof data,
											false as never,
										);
										setIsAutoLoading(false);
										return;
									}

									const output = response.pixelReturn[1]
										?.output as {
										data: {
											values: unknown[][];
											headers: string[];
										};
									};

									// Set the options in the format the select block expects
									if (output?.data) {
										setData(
											"options" as keyof typeof data,
											{
												data: {
													values:
														output.data.values ||
														[],
													headers:
														output.data.headers ||
														[],
												},
											} as never,
										);
									}

									// Clear loading state
									setData(
										"loading" as keyof typeof data,
										false as never,
									);
								} catch (error) {
									console.error(
										"Error loading SQL options:",
										error,
									);
									toast.error(
										`Failed to load options: ${error instanceof Error ? error.message : String(error)}`,
									);
									setData(
										"loading" as keyof typeof data,
										false as never,
									);
								} finally {
									setIsAutoLoading(false);
								}
							},
							[isAutoLoading, setData],
						);

						// Auto-load SQL options when SQL config is present but options aren't loaded
						// Using autorun to properly react to MobX observable changes
						// biome-ignore lint/correctness/useExhaustiveDependencies: autorun tracks MobX observables
						useEffect(() => {
							const dispose = autorun(() => {
								const parameterDatabaseId = (
									data as Record<string, unknown>
								).parameterDatabaseId as string | undefined;
								const parameterSqlQuery = (
									data as Record<string, unknown>
								).parameterSqlQuery as string | undefined;
								const currentOptions = data.options;

								// If SQL config exists but options are not loaded, execute the query
								// Check for: no options, empty array, or object without data.values
								const needsLoading =
									parameterDatabaseId &&
									parameterSqlQuery &&
									(!currentOptions ||
										(Array.isArray(currentOptions) &&
											currentOptions.length === 0) ||
										(typeof currentOptions === "object" &&
											!Array.isArray(currentOptions) &&
											!(
												currentOptions as {
													data?: {
														values?: unknown[];
													};
												}
											).data?.values?.length));

								if (needsLoading) {
									console.log(
										"Auto-loading SQL options for parameter:",
										{
											databaseId: parameterDatabaseId,
											hasQuery: !!parameterSqlQuery,
											currentOptions,
										},
									);
									loadSqlOptions(
										parameterDatabaseId,
										parameterSqlQuery,
									);
								}
							});

							return () => dispose();
						}, [loadSqlOptions]);

						// Handle tab change with data clearing
						const _handleTabChange = (
							_e: React.SyntheticEvent,
							newValue: string | number,
						) => {
							const tabValue =
								typeof newValue === "number" ? newValue : 0;

							if (tabValue === 0) {
								// Switching to Manual mode - sync optionsText and clear SQL data
								setOptionsText(
									formatOptionsToText(data.options),
								);
								setData(
									"parameterDatabaseId" as keyof typeof data,
									undefined,
								);
								setData(
									"parameterDatabaseName" as keyof typeof data,
									undefined,
								);
								setData(
									"parameterSqlQuery" as keyof typeof data,
									undefined,
								);
								setData(
									"optionLabel" as keyof typeof data,
									undefined,
								);
								setData(
									"optionValue" as keyof typeof data,
									undefined,
								);
								setData(
									"optionSublabel" as keyof typeof data,
									undefined,
								);
							} else if (tabValue === 1) {
								// Switching to SQL mode - clear manual options
								setData("options" as keyof typeof data, []);
								setOptionsText("");
							}
							setActiveTab(tabValue);
						};

						return (
							<>
								<BaseSettingSection label="Options Source">
									<Tabs
										value={String(activeTab)}
										onValueChange={(val) =>
											setActiveTab(Number(val))
										}
									>
										<TabsList className="w-full">
											<TabsTrigger
												value="0"
												className="flex-1"
											>
												Manual
											</TabsTrigger>
											<TabsTrigger
												value="1"
												className="flex-1"
											>
												Query
											</TabsTrigger>
										</TabsList>

										<TabsContent value="0">
											<div className="mt-2">
												<Input
													value={optionsText}
													placeholder="'Option A', 'Option B', 'Option C'"
													onChange={(
														e: React.ChangeEvent<HTMLInputElement>,
													) => {
														setOptionsText(
															e.target.value,
														);
														setData(
															"options" as keyof typeof data,
															parseOptionsText(
																e.target.value,
															) as never,
														);
													}}
												/>
												<p className="mt-1 text-muted-foreground text-sm">
													Enter comma-separated values
												</p>
											</div>
										</TabsContent>

										<TabsContent value="1">
											<div className="mt-2">
												<Button
													variant={
														hasSqlQuery
															? "outline"
															: "default"
													}
													size="sm"
													className="w-full"
													onClick={() =>
														setShowQueryDialog(true)
													}
												>
													{hasSqlQuery
														? "Edit SQL Query"
														: "Configure SQL Query"}
												</Button>

												{hasSqlQuery && (
													<div className="mt-2 rounded bg-muted p-2">
														<p className="font-mono text-muted-foreground text-sm">
															{(
																(
																	data as Record<
																		string,
																		unknown
																	>
																)
																	.parameterSqlQuery as string
															)?.substring(
																0,
																100,
															) || ""}
															{(
																(
																	data as Record<
																		string,
																		unknown
																	>
																)
																	.parameterSqlQuery as string
															)?.length > 100
																? "..."
																: ""}
														</p>
													</div>
												)}
											</div>
										</TabsContent>
									</Tabs>
								</BaseSettingSection>

								{/* Query Dialog */}
								<ParameterQueryDialog
									open={showQueryDialog}
									onClose={() => setShowQueryDialog(false)}
									parameterName={
										((data as Record<string, unknown>)
											.label as string) || "Parameter"
									}
									initialData={{
										databaseId: (
											data as Record<string, unknown>
										).parameterDatabaseId as
											| string
											| undefined,
										databaseName: (
											data as Record<string, unknown>
										).parameterDatabaseName as
											| string
											| undefined,
										sqlQuery: (
											data as Record<string, unknown>
										).parameterSqlQuery as
											| string
											| undefined,
										optionLabel: (
											data as Record<string, unknown>
										).optionLabel as string | undefined,
										optionValue: (
											data as Record<string, unknown>
										).optionValue as string | undefined,
										optionSublabel: (
											data as Record<string, unknown>
										).optionSublabel as string | undefined,
									}}
									onSave={(config: ParameterQueryConfig) => {
										// Save query configuration
										setData(
											"parameterDatabaseId" as keyof typeof data,
											config.databaseId as never,
										);
										setData(
											"parameterDatabaseName" as keyof typeof data,
											config.databaseName as never,
										);
										setData(
											"parameterSqlQuery" as keyof typeof data,
											config.sqlQuery as never,
										);
										setData(
											"optionLabel" as keyof typeof data,
											config.optionLabel as never,
										);
										setData(
											"optionValue" as keyof typeof data,
											config.optionValue as never,
										);
										setData(
											"optionSublabel" as keyof typeof data,
											config.optionSublabel as never,
										);

										// Save preview data as options in the format SelectOptionsSettings expects
										if (config.previewData) {
											setData(
												"options" as keyof typeof data,
												{
													data: {
														values: config
															.previewData.rows,
														headers:
															config.previewData
																.headers,
													},
												},
											);
										} else {
											// If no preview data, trigger auto-load
											if (
												config.databaseId &&
												config.sqlQuery
											) {
												setTimeout(() => {
													loadSqlOptions(
														config.databaseId,
														config.sqlQuery,
													);
												}, 100);
											}
										}
									}}
								/>
							</>
						);
					},
				},
				{
					description: "Hint",
					render: ({ id }: { id: string }) => (
						<InputSettings id={id} label="Hint" path="hint" />
					),
				},
				{
					description: "Default Value",
					render: ({ id }: { id: string }) => (
						<SelectInputValueSettings id={id} path="value" />
					),
				},
				{
					description: "Multiple Selection",
					render: ({ id }: { id: string }) => (
						<SwitchSettings
							id={id}
							label="Multiple Selection"
							path="multiple"
						/>
					),
				},
				{
					description: "Required",
					render: ({ id }: { id: string }) => (
						<SwitchSettings
							id={id}
							label="Required"
							path="required"
						/>
					),
				},
			],
		},
	],
	styleMenu: [
		{
			name: "General",
			children: [
				{
					description: "Disabled",
					render: ({ id }: { id: string }) => (
						<SwitchSettings
							id={id}
							label="Disabled"
							path="disabled"
						/>
					),
				},
			],
		},
	],
});

const SelectParameterSettings = ({
	form,
	blockState,
	blockId,
}: {
	form: UseFormReturn<ParameterFormData>;
	blockState: StateStore;
	blockId: string;
}) => {
	const { setValue } = form;
	const _baseId = useId();
	const [settingSection, setSettingSection] = useState<string | number>(0);
	const [contentAccordion, setContentAccordion] = useState<
		Record<string, boolean>
	>({ "section--0": true });
	const [styleAccordion, setStyleAccordion] = useState<
		Record<string, boolean>
	>({ "section--0": true });

	useEffect(() => {
		const dispose = autorun(() => {
			const block = blockState.getBlock(blockId);
			if (block) {
				setValue(
					"label",
					((block.data.label as string) || "") as string,
				);
				setValue("hint", ((block.data.hint as string) || "") as string);

				const formValue = Array.isArray(block.data.value)
					? JSON.stringify(block.data.value)
					: String(block.data.value || "");

				setValue("defaultValue", formValue);
				setValue(
					"multiple",
					((block.data.multiple as boolean) || false) as boolean,
				);
				setValue(
					"required",
					((block.data.required as boolean) || false) as boolean,
				);
			}
		});
		return () => {
			dispose();
		};
	}, [blockId, blockState, setValue]);

	const config = useMemo(() => getSelectParameterConfig(), []);

	return (
		<div>
			<Tabs
				value={String(settingSection)}
				onValueChange={(val) => setSettingSection(Number(val))}
			>
				<TabsList className="w-full">
					<TabsTrigger value="0" className="flex-1">
						Settings
					</TabsTrigger>
					<TabsTrigger value="1" className="flex-1">
						Appearance
					</TabsTrigger>
				</TabsList>

				<TabsContent value="0">
					<SelectedMenuSection
						id={blockId}
						sectionTitle=""
						menu={config.contentMenu}
						accordion={contentAccordion}
						setAccordion={(acc: object) =>
							setContentAccordion(acc as Record<string, boolean>)
						}
					/>
				</TabsContent>

				<TabsContent value="1">
					<SelectedMenuSection
						id={blockId}
						sectionTitle=""
						menu={config.styleMenu}
						accordion={styleAccordion}
						setAccordion={(acc: object) =>
							setStyleAccordion(acc as Record<string, boolean>)
						}
					/>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export const ParameterInputSettings = (props: ParameterInputSettingsProps) => {
	const { inputType, form, blockState, blockId } = props;

	switch (inputType) {
		case "text":
		case "number":
		case "date":
			return (
				<Blocks state={blockState} registry={DefaultBlocks}>
					<InputParameterSettings
						form={form}
						blockState={blockState}
						blockId={blockId}
					/>
				</Blocks>
			);
		case "select":
			return (
				<Blocks state={blockState} registry={DefaultBlocks}>
					<SelectParameterSettings
						form={form}
						blockState={blockState}
						blockId={blockId}
					/>
				</Blocks>
			);
		default:
			return (
				<p className="text-muted-foreground text-sm">
					Settings for {inputType} will be available soon
				</p>
			);
	}
};
