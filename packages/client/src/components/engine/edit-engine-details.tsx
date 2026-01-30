import { Pencil, WandIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { MarkdownEditor } from "@/components/common";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";

/**
 * Edit the engine details
 */
export const EditEngineDetails = observer(() => {
	// get the configStore
	const { configStore, monolithStore } = useRootStore();

	// get the engine information
	const { type, active } = useEngine();

	// get the properties
	const { id, name, metadata, role, refresh } = active;

	// set if it can edit
	const canEdit = role === "OWNER" || role === "EDITOR";

	// get a list of the keys
	const engineMetaKeys = configStore.store.config.databaseMetaKeys.filter(
		(k) => {
			// filter the fields to the ones that are passed in
			return Object.hasOwn(metadata, k.metakey);
		},
	);

	// track if open
	const [open, setOpen] = useState(false);

	// track the options
	const [filterOptions, setFilterOptions] = useState<
		Record<string, string[]>
	>(() => {
		return engineMetaKeys.reduce((prev, current) => {
			prev[current.metakey] = [];

			return prev;
		}, {});
	});
	// selectedmodel to be used for text generation
	//const [selectedModel, setSelectedModel] = useState<string>("");

	// show hide model selection
	const [canShowModels, setCanShowModels] = useState<boolean>(false);

	// track model generation state
	//const [generateLoading, setGenerateLoading] = useState<boolean>(false);

	// get the values
	const getEngineMetaValues = usePixel<
		{
			METAKEY: string;
			METAVALUE: string;
			count: number;
		}[]
	>(canEdit ? `META | GetDatabaseMetaValues ( metaKeys = ['tags'] ) ;` : "", {
		data: [],
	});

	useEffect(() => {
		if (getEngineMetaValues.status !== "SUCCESS") {
			return;
		}

		// format the catalog data into a map
		const updated = getEngineMetaValues.data.reduce((prev, current) => {
			if (!prev[current.METAKEY]) {
				prev[current.METAKEY] = [];
			}

			prev[current.METAKEY].push(current.METAVALUE);

			return prev;
		}, {});

		// add metakeys that don't get options from projects/engines but stored in config call
		const metaKeysWithOpts = engineMetaKeys.filter((k) => {
			return k.display_options === "select-box";
		});

		metaKeysWithOpts.forEach((filter) => {
			if (filter.display_values) {
				const split = filter.display_values.split(",");
				const formatted = [];
				split.forEach((val) => {
					formatted.push(val);
				});

				updated[filter.metakey] = formatted;
			}
		});

		setFilterOptions(updated);
	}, [getEngineMetaValues.status, getEngineMetaValues.data]);

	const {
		handleSubmit,
		control,
		//setValue
	} = useForm<Record<string, unknown>>({
		defaultValues: metadata || {},
	});
	//const generateUsingLLM = async (queryType: string) => {
	// // generate the query based on the query type
	// const query =
	//     queryType === 'markdown'
	//         ? `Create me some markdown in the 600 character range for my ${engineData.database_type} that is named ${engineData.database_name}`
	//         : `Create me a description in the 150 character range, for my ${engineData.database_type} that is named ${engineData.database_name}`;
	// // query the LLM model
	// const LLMresponse = await monolithStore.runQuery(
	//     `LLM(engine="${selectedModel}", command=["<encode>${query}</encode>"])`,
	// );
	// const { output: LLMOutput } = LLMresponse.pixelReturn[0];
	// // update the value
	// setValue(queryType, LLMOutput.response);
	//};

	// const handleGenerate = async () => {
	// 	setGenerateLoading(true);
	// 	// generate the markdown and description
	// 	await generateUsingLLM("markdown");
	// 	await generateUsingLLM("description");
	// 	setGenerateLoading(false);
	// };

	/**
	 * @name onSubmit
	 * @desc approve, deny, delete selected members/users
	 * @param data - form data
	 */
	const onSubmit = handleSubmit((data: object) => {
		// copy over the defined keys
		const meta = {};
		if (data) {
			for (const key in data) {
				if (data[key] !== undefined) {
					meta[key] = data[key];
				}
			}
		}

		if (Object.keys(meta).length === 0) {
			toast.info("Nothing to Save");

			return;
		}

		monolithStore
			.runQuery(
				`SetEngineMetadata(engine=["${id}"], meta=[${JSON.stringify(
					meta,
				)}], jsonCleanup=[true])`,
			)
			.then((response) => {
				const { output, additionalOutput, operationType } =
					response.pixelReturn[0];

				// track the errors
				if (operationType.indexOf("ERROR") > -1) {
					toast.error(output as string);

					return;
				}

				toast.success(additionalOutput[0].output);

				// close it and succesfully message
				setOpen(false);

				// refresh the values
				refresh();
			})
			.catch((error) => {
				toast.error(`Error updating ${type} details: ${error.message}`);
			});
	});

	if (!canEdit) {
		return null;
	}

	return (
		<>
			<Button
				variant="default"
				onClick={() => setOpen(true)}
				data-testid={formatToDataTestId(
					`editEngineDetails-${name}-edit-btn`,
				)}
			>
				<Pencil className="size-4" />
				Edit
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="flex max-h-[90vh] flex-col overflow-hidden sm:max-w-2xl">
					<DialogHeader>
						<div className="flex w-full items-center justify-between">
							<DialogTitle>Edit {name} Details</DialogTitle>
							{/* TODO: need to be implemented */}
							{/* {!canShowModels && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												setCanShowModels(!canShowModels)
											}
										>
											<WandIcon className="size-4" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>Generate</TooltipContent>
								</Tooltip>
							)} */}
						</div>
					</DialogHeader>
					{/* 
                {canShowModels && (
                    <Stack>
                        <Stack
                            direction="row"
                            paddingX={3}
                            alignItems={'center'}
                        >
                            <Select
                                size="small"
                                sx={{
                                    width: '90%',
                                    '.MuiInputBase-root': {
                                        borderRadius: '4px',
                                    },
                                }}
                                name="Select LLM"
                                id="llm"
                                variant="outlined"
                                label="Select LLM"
                                onChange={(e) =>
                                    setSelectedModel(e.target.value)
                                }
                                value={selectedModel}
                                disabled={generateLoading}
                            >
                                {llmModels.map((model) => {
                                    return (
                                        <Select.Item
                                            value={model.app_id}
                                            key={model.app_id + '_modId'}
                                        >
                                            {model.app_name as string}
                                        </Select.Item>
                                    );
                                })}
                            </Select>
                            <Tooltip title="Cancel">
                                <IconButton
                                    onClick={() => {
                                        setCanShowModels(!canShowModels);
                                        setSelectedModel('');
                                    }}
                                    disabled={generateLoading}
                                    sx={{ color: '#a9a9a9', padding: 0 }}
                                >
                                    <Cancel sx={{ fontSize: '28px' }} />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Apply">
                                <IconButton
                                    onClick={handleGenerate}
                                    disabled={!selectedModel}
                                    color="primary"
                                >
                                    {generateLoading ? (
                                        <CircularProgress size={24} />
                                    ) : (
                                        <CheckCircle
                                            sx={{ fontSize: '28px' }}
                                        />
                                    )}
                                </IconButton>
                            </Tooltip>
                        </Stack>
                        <Stack
                            paddingX={3}
                            direction="row"
                            alignItems="flex-start"
                        >
                            <InfoOutlined
                                color="error"
                                sx={{ fontSize: '16px' }}
                            />
                            <Typography
                                variant="body2"
                                sx={{ fontSize: '12px', color: 'red' }}
                            >
                                The existing content of the fields 'Markdown'
                                and 'Description' will be replaced once you
                                click 'Apply'.
                            </Typography>
                        </Stack>
                    </Stack>
                )} */}
					<div className="flex-1 space-y-6 overflow-y-auto">
						{/* div included to prevent the first title from clipping */}
						{/* <div /> */}
						{engineMetaKeys.map((key) => {
							const { metakey, display_options } = key;
							const label =
								metakey.slice(0, 1).toUpperCase() +
								metakey.slice(1);

							if (display_options === "markdown") {
								return (
									<div key={metakey} className="mb-1">
										<Controller
											name={metakey}
											control={control}
											render={({ field }) => {
												return (
													<MarkdownEditor
														value={
															(field.value as string) ||
															""
														}
														onChange={(value) =>
															field.onChange(
																value,
															)
														}
													/>
												);
											}}
										/>
									</div>
								);
							} else if (display_options === "textarea") {
								const isDescription = metakey === "description";
								return (
									<Controller
										key={metakey}
										name={metakey}
										control={control}
										render={({ field }) => {
											return (
												<div className="space-y-2">
													<Label htmlFor={metakey}>
														{label}
													</Label>
													<textarea
														id={metakey}
														className="flex max-h-[72px] min-h-[72px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
														value={
															(field.value as string) ||
															""
														}
														onChange={(e) =>
															field.onChange(
																e.target.value,
															)
														}
														placeholder={
															isDescription
																? `Please provide a description for this ${type.toLocaleLowerCase()} to help others find it and understand how to use it.`
																: undefined
														}
														data-testid={formatToDataTestId(
															`editEngineDetails-${label}-txtArea`,
														)}
													/>
												</div>
											);
										}}
									/>
								);
							} else if (display_options === "single-typeahead") {
								return (
									<Controller
										key={metakey}
										control={control}
										name={metakey}
										render={({ field }) => {
											const currentValue =
												(field.value as string) || "";

											return (
												<div className="space-y-2">
													<Label htmlFor={metakey}>
														{label}
													</Label>
													<div className="relative">
														<input
															id={metakey}
															type="text"
															className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
															placeholder={`Select ${label.toLowerCase()}...`}
															value={currentValue}
															onChange={(e) => {
																field.onChange(
																	e.target
																		.value,
																);
															}}
															list={`${metakey}-list`}
															data-testid={formatToDataTestId(
																`editEngineDetails-${label}-autocomplete`,
															)}
														/>
														<datalist
															id={`${metakey}-list`}
														>
															{(
																filterOptions[
																	metakey
																] || []
															).map((option) => (
																<option
																	key={option}
																	value={
																		option
																	}
																/>
															))}
														</datalist>
													</div>
												</div>
											);
										}}
									/>
								);
							} else if (display_options === "multi-typeahead") {
								return (
									<Controller
										key={metakey}
										control={control}
										name={metakey}
										render={({ field }) => {
											const [inputValue, setInputValue] =
												useState("");
											const selectedTags = (
												field.value &&
												Array.isArray(field.value)
													? field.value.filter(
															(tag) =>
																typeof tag ===
																	"string" &&
																tag.trim() !==
																	"",
														)
													: []
											) as string[];

											const addTag = (tag: string) => {
												const trimmed = tag.trim();
												if (
													trimmed &&
													!selectedTags.includes(
														trimmed,
													)
												) {
													const newTags = [
														...selectedTags,
														trimmed,
													];
													field.onChange(newTags);
													setInputValue("");
												}
											};

											const removeTag = (tag: string) => {
												const newTags =
													selectedTags.filter(
														(t) => t !== tag,
													);
												field.onChange(newTags);
											};

											return (
												<div className="space-y-2">
													<Label htmlFor={metakey}>
														{label}
													</Label>
													<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
														{selectedTags.map(
															(tag) => (
																<span
																	key={tag}
																	className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-foreground text-sm"
																>
																	{tag}
																	<button
																		type="button"
																		onClick={(
																			e,
																		) => {
																			e.preventDefault();
																			removeTag(
																				tag,
																			);
																		}}
																		className="hover:opacity-70"
																	>
																		<XIcon className="size-3" />
																	</button>
																</span>
															),
														)}
														<input
															type="text"
															value={inputValue}
															onChange={(e) =>
																setInputValue(
																	e.target
																		.value,
																)
															}
															onKeyDown={(e) => {
																if (
																	e.key ===
																	"Enter"
																) {
																	e.preventDefault();
																	addTag(
																		inputValue,
																	);
																}
															}}
															placeholder={`Press enter to add ${metakey}`}
															className="min-w-[100px] flex-1 bg-transparent text-sm outline-none"
															data-testid={formatToDataTestId(
																`editEngineDetails-${label}-autocomplete`,
															)}
														/>
													</div>
												</div>
											);
										}}
									/>
								);
							} else if (display_options === "select-box") {
								return (
									<Controller
										key={metakey}
										name={metakey}
										control={control}
										render={({ field }) => {
											const selectedValues = (
												(Array.isArray(field.value)
													? field.value
													: typeof field.value ===
															"string"
														? [field.value]
														: []) as string[]
											).filter((v) => v);

											const toggleValue = (
												value: string,
											) => {
												if (
													selectedValues.includes(
														value,
													)
												) {
													field.onChange(
														selectedValues.filter(
															(v) => v !== value,
														),
													);
												} else {
													field.onChange([
														...selectedValues,
														value,
													]);
												}
											};

											return (
												<div className="space-y-2">
													<Label htmlFor={metakey}>
														{label}
													</Label>
													<div className="flex flex-wrap gap-2 rounded-md border border-input bg-transparent p-2">
														{(
															filterOptions[
																metakey
															] || []
														).map((option) => (
															<label
																key={option}
																className="flex cursor-pointer items-center gap-2"
															>
																<input
																	type="checkbox"
																	checked={selectedValues.includes(
																		option,
																	)}
																	onChange={() =>
																		toggleValue(
																			option,
																		)
																	}
																	className="rounded border-input"
																/>
																<span className="text-sm">
																	{option}
																</span>
															</label>
														))}
													</div>
												</div>
											);
										}}
									/>
								);
							}

							return null;
						})}
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setOpen(false);
							}}
							data-testid={`editEngineDetails-close-btn`}
						>
							Close
						</Button>
						<Button
							variant="default"
							onClick={() => onSubmit()}
							data-testid={`editEngineDetails-submit-btn`}
						>
							Submit
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});
