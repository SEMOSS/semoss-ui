import { AutoAwesome, EditRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
	Autocomplete,
	Box,
	Button,
	IconButton,
	Modal,
	Stack,
	styled,
	TextField,
	Tooltip,
	useNotification,
} from "@semoss/ui";
import { MarkdownEditor } from "@/components/common";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { formatToDataTestId } from "@/utility";

const StyledEditorContainer = styled("div")(({ theme }) => ({
	marginBottom: theme.spacing(1),
}));

const StyledModalHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
});

/**
 * Edit the engine details
 */
export const EditEngineDetails = observer(() => {
	// get the notification
	const notification = useNotification();

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
	const [selectedModel, setSelectedModel] = useState<string>("");

	// show hide model selection
	const [canShowModels, setCanShowModels] = useState<boolean>(false);

	// track model generation state
	const [generateLoading, setGenerateLoading] = useState<boolean>(false);

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

	const { handleSubmit, control, setValue } = useForm<
		Record<string, unknown>
	>({
		defaultValues: metadata || {},
	});

	const generateUsingLLM = async (queryType: string) => {
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
	};

	const handleGenerate = async () => {
		setGenerateLoading(true);
		// generate the markdown and description
		await generateUsingLLM("markdown");
		await generateUsingLLM("description");
		setGenerateLoading(false);
	};

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
			notification.add({
				color: "warning",
				message: "Nothing to Save",
			});

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
					notification.add({
						color: "error",
						message: output,
					});

					return;
				}

				notification.add({
					color: "success",
					message: additionalOutput[0].output,
				});

				// close it and succesfully message
				setOpen(false);

				// refresh the values
				refresh();
			})
			.catch((error) => {
				notification.add({
					color: "error",
					message: error.message,
				});
			});
	});

	if (!canEdit) {
		return null;
	}

	return (
		<>
			<Button
				startIcon={<EditRounded />}
				variant="contained"
				onClick={() => setOpen(true)}
				data-testid={formatToDataTestId(
					`editEngineDetails-${name}-edit-btn`,
				)}
			>
				Edit
			</Button>
			<Modal
				open={open}
				maxWidth={"md"}
				onClose={() => {
					setOpen(false);
				}}
			>
				<Modal.Title>
					<StyledModalHeader>
						<>Edit {name} Details</>
						{!canShowModels && (
							<Tooltip title="Generate">
								<IconButton
									onClick={() =>
										setCanShowModels(!canShowModels)
									}
									color="primary"
									sx={{ marginLeft: "auto" }}
								>
									<AutoAwesome />
								</IconButton>
							</Tooltip>
						)}
					</StyledModalHeader>
				</Modal.Title>
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
				<Modal.Content>
					<Stack spacing={3}>
						{/* div included to prevent the first title from clipping */}
						<div />
						{engineMetaKeys.map((key) => {
							const { metakey, display_options } = key;
							const label =
								metakey.slice(0, 1).toUpperCase() +
								metakey.slice(1);

							if (display_options === "markdown") {
								return (
									<StyledEditorContainer key={metakey}>
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
									</StyledEditorContainer>
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
												<TextField
													multiline
													minRows={3}
													maxRows={3}
													label={label}
													value={
														(field.value as string) ||
														""
													}
													onChange={(e) =>
														field.onChange(
															e.target.value,
														)
													}
													InputLabelProps={
														isDescription
															? { shrink: true }
															: undefined
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
											);
										}}
									/>
								);
							} else if (display_options === "single-typeahead") {
								return (
									<Controller
										key={metakey}
										name={metakey}
										control={control}
										render={({ field }) => {
											return (
												<Autocomplete<string, false>
													label={label}
													options={
														filterOptions[metakey]
															? filterOptions[
																	metakey
																]
															: []
													}
													value={
														(field.value as string) ||
														""
													}
													onChange={(
														event,
														newValue,
													) => {
														field.onChange(
															newValue,
														);
													}}
													data-testid={formatToDataTestId(
														`editEngineDetails-${label}-autocomplete`,
													)}
												/>
											);
										}}
									/>
								);
							} else if (display_options === "multi-typeahead") {
								return (
									<Controller
										key={metakey}
										name={metakey}
										control={control}
										render={({ field }) => {
											return (
												<Autocomplete<
													string,
													true,
													false,
													true
												>
													freeSolo={true}
													multiple={true}
													renderInput={(params) => (
														<TextField
															{...params}
															label={label}
															helperText={`Press enter to add ${metakey}`}
														/>
													)}
													options={
														filterOptions[metakey]
															? filterOptions[
																	metakey
																]
															: []
													}
													value={
														field.value &&
														Array.isArray(
															field.value,
														)
															? field.value.filter(
																	(tag) =>
																		typeof tag ===
																			"string" &&
																		tag.trim() !==
																			"",
																)
															: []
													}
													onChange={(_, newValue) => {
														// Filter out empty or whitespace-only tags
														const filteredValue =
															newValue.filter(
																(tag) =>
																	typeof tag ===
																		"string" &&
																	tag.trim() !==
																		"",
															);
														field.onChange(
															filteredValue,
														);
													}}
													data-testid={formatToDataTestId(
														`editEngineDetails-${label}-autocomplete`,
													)}
												/>
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
											const formattedValue =
												typeof field.value === "string"
													? [field.value]
													: field.value;

											return (
												<Autocomplete<
													string,
													true,
													false,
													true
												>
													multiple={true}
													label={label}
													options={
														filterOptions[metakey]
															? filterOptions[
																	metakey
																]
															: []
													}
													value={
														(formattedValue as string[]) ||
														[]
													}
													onChange={(
														event,
														newValue,
													) => {
														field.onChange(
															newValue,
														);
													}}
													data-testid={formatToDataTestId(
														`editEngineDetails-${label}-autocomplete`,
													)}
												/>
											);
										}}
									/>
								);
							}

							// return null;
						})}
					</Stack>
				</Modal.Content>
				<Modal.Actions>
					<Button
						variant="text"
						onClick={() => {
							// close it
							setOpen(false);
						}}
						data-testid={`editEngineDetails-close-btn`}
					>
						Close
					</Button>
					<Button
						variant="contained"
						onClick={() => onSubmit()}
						data-testid={`editEngineDetails-submit-btn`}
					>
						Submit
					</Button>
				</Modal.Actions>
			</Modal>
		</>
	);
});
