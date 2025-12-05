/**
 * Page Documentation (10/10/2023)
 *
 * Different Connection types:
 * Model(LLM), Vector Databases, Functions, Traditional Dbs, Storage
 *
 * Steps and (props...) from the useStepper hook will give you the steps that
 * have been completed through the selection process.
 *
 * Steps is important for this page as based on the step in the process you will
 * see different steps in the connection process for all engines
 *
 * TODO seperate links: Just seperate the steps into
 * - /import
 * - /import/model
 * - /import/model/OpenAi
 */

import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
	Box,
	Breadcrumbs,
	Card,
	Grid,
	Link,
	Search,
	Stack,
	styled,
	Tabs,
	Tooltip,
	Typography,
} from "@semoss/ui";
import { BuildDb } from "@/assets/img/BuildDb";
import { ConnectDb } from "@/assets/img/ConnectDb";
import { ConnectModel } from "@/assets/img/ConnectModel";
import { ConnectStorage } from "@/assets/img/ConnectStorage";
import { CopyDb } from "@/assets/img/CopyDb";
import { Help } from "@/components/help";
import { useStepper } from "@/hooks";
import type { ENGINE_TYPES } from "@/types";
import { formatToDataTestId } from "@/utility";
import { CopyDatabaseForm } from "../../components/import/refactor/CopyDatabaseForm";
import { UploadData } from "../../components/import/refactor/UploadData";
import { EstablishConnectionPage, ImportConnectionPage } from ".";
import { CONNECTION_OPTIONS } from "./import.constants";

const StyledContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "auto",
	flexDirection: "column",
	alignItems: "flex-start",
}));

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
	display: "flex",
	width: "100%",
	alignItems: "flex-start",
	gap: theme.spacing(3),
}));

const StyledStack = styled("div")(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	gap: theme.spacing(1),
}));

const StyledCard = styled(Card, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{
	disabled: boolean;
}>(({ theme, disabled }) => {
	return {
		backgroundColor: disabled ? theme.palette.grey["100"] : "white",
		"&:hover": {
			boxShadow: disabled
				? "0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)"
				: `0px 5px 22px 0px ${theme.palette.primaryContrast["shadow"]}`,
			cursor: "pointer",
		},
	};
});
const StyledCardContent = styled(Card.Content)(() => ({
	display: "flex",
	padding: "16px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "16px",
	alignSelf: "stretch",
}));

const StyledBox = styled(Box)({
	boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
	width: "100%",
	padding: "16px 16px 16px 16px",
	marginBottom: "32px",
});

const StyledInnerBox = styled("div")<{ isModel?: boolean }>(
	({ theme, isModel }) => ({
		display: "flex",
		alignItems: isModel ? "flex-start" : "center",
		gap: theme.spacing(1),
		flexDirection: isModel ? "column" : "row",
	}),
);

const StyledCardImage = styled("img")<{ isModel?: boolean }>(({ isModel }) => ({
	display: "flex",
	height: "30px",
	width: "30px",
	alignItems: "flex-start",
	gap: "10px",
	alignSelf: "stretch",
	overflowClipMargin: "content-box",
	overflow: "clip",
	objectFit: "cover",
	borderRadius: isModel ? "8px" : "inherit",
}));

const StyledCardText = styled("p")({
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	margin: "0",
});

const StyledCardModelText = styled("p")({
	overflow: "hidden",
	textOverflow: "ellipsis",
	whiteSpace: "nowrap",
	margin: "2px 0 0",
	alignSelf: "stretch",
	fontSize: "14px",
	fontWeight: "500",
	lineHeight: "143%",
	letterSpacing: "0.17px",
	color: "#212121",
});

const StyledTypographyText = styled(Typography)((theme) => ({
	display: "flex",
	alignItems: "center",
	padding: "0 10px",
	backgroundColor: "#EBEBEB",
	borderRadius: "16px",
	marginLeft: "auto !important",
	fontSize: "13px",
	color: "#212121",
}));

const StyledFormTypeBox = styled(Box, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{
	disabled: boolean;
}>(({ theme, disabled }) => {
	return {
		maxWidth: "215px",
		maxHeight: "75px",
		borderRadius: "12px",
		cursor: "pointer",
		display: "block",
		justifyContent: "center",
		alignItems: "center",
		border: "1px solid rgba(0,0,0,0.1)",
		padding: "16px 24px",
		boxShadow:
			"0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)",
		backgroundColor: disabled ? theme.palette.grey["100"] : "white",

		"&:hover": {
			cursor: "pointer",
			boxShadow: disabled
				? "0px 5px 22px 0px rgba(0, 0, 0, 0.04), 0px 4px 4px 0.5px rgba(0, 0, 0, 0.03)"
				: `0px 5px 22px 0px ${theme.palette.primaryContrast["shadow"]}`,
		},
	};
});

const StyledFormTypeModelBox = styled(Box, {
	shouldForwardProp: (prop) => prop !== "disabled",
})<{
	disabled: boolean;
}>(({ disabled }) => {
	return {
		maxWidth: "215px",
		borderRadius: "8px",
		cursor: "pointer",
		display: "block",
		justifyContent: "center",
		alignItems: "center",
		border: "1px solid #C4C4C4",
		padding: "16px",
		backgroundColor: "#fff",
		opacity: disabled ? 0.6 : 1,

		"&:hover": {
			cursor: disabled ? "auto" : "pointer",
			border: disabled ? "1px solid #C4C4C4" : "1.5px solid #0471F0",
			backgroundColor: disabled ? "white" : "#F5F9FE",
		},
	};
});

const StyledSpan = styled("span")({
	"&:hover": {
		cursor: "pointer",
	},
});

const StyledCategoryTitle = styled(Box)({
	fontSize: "20px",
	fontWeight: "bold",
	padding: "16px",
});

const StyledTab = styled(Tabs.Item)({
	fontSize: "14px",
	fontWeight: "500",
	letterSpacing: "0.4px",
	color: "rgba(0, 0, 0, 0.60)",
});

const IconMapper = {
	"Connect to Database": <ConnectDb />,
	"Copy Database": <CopyDb />,
	"Build Database": <BuildDb />,
	"Connect to Storage": <ConnectStorage />,
	"Connect to Model": <ConnectModel />,
	"Connect to Vector Database": <ConnectStorage />,
	"Connect to Function": <ConnectModel />,
};

interface ImportPageContentProps {
	/**
	 * What engine are you trying to import
	 */
	name: string;

	/**
	 * What engine are you trying to import
	 */
	type: ENGINE_TYPES;
}

/**
 * @deprecated
 */
export const ImportPageContent: React.FC<ImportPageContentProps> = ({
	name,
	type,
}) => {
	const { steps, setSteps, setIsLoading, isLoading } = useStepper();

	const navigate = useNavigate();

	const [search, setSearch] = React.useState("");

	const [connectionOptions, setConnectionOptions] =
		React.useState(CONNECTION_OPTIONS);
	const [selectedTab, setSelectedTab] = React.useState(0);

	const modelOptions = connectionOptions.MODEL;

	const scrollToTopRef = useRef(null);

	const isModelPage = steps.length > 0 && steps[0].data === "MODEL";

	const ModelCard = ({ model, setSteps, steps }) => {
		const textRef = useRef<HTMLParagraphElement>(null);
		const [isTruncated, setIsTruncated] = React.useState(false);

		useEffect(() => {
			const el = textRef.current;
			if (el) {
				setIsTruncated(el.scrollWidth > el.clientWidth);
			}
		}, [model.name]);

		const cardContent = (
			<StyledFormTypeModelBox
				disabled={model.disable}
				onClick={() => {
					if (!model.disable) {
						setSteps(
							[
								...steps,
								{
									id: model.id,
									title: model.name,
									description: `Fill out ${
										model.name
									} details in order to add ${steps[0].data.toLowerCase()} to catalog`,
									data: model.fields,
								},
							],
							steps.length + 1,
						);
					}
				}}
				data-testid={formatToDataTestId(
					`importPageContent-connect-to-${model.name}-img`,
				)}
			>
				<StyledInnerBox isModel={true}>
					{model.disable ? (
						<Stack direction="row" width={"100%"} spacing={1}>
							<StyledCardImage isModel={true} src={model.icon} />
							<StyledTypographyText variant="body1">
								Coming Soon
							</StyledTypographyText>
						</Stack>
					) : (
						<StyledCardImage isModel={true} src={model.icon} />
					)}

					<StyledCardModelText ref={textRef}>
						{model.name}
					</StyledCardModelText>
				</StyledInnerBox>
			</StyledFormTypeModelBox>
		);

		return isTruncated ? (
			<Tooltip
				title={model.name}
				placement="bottom"
				arrow
				componentsProps={{
					tooltip: {
						sx: {
							backgroundColor: "#757575",
							fontFamily: "Inter",
							fontStyle: "normal",
							letterSpacing: "0.4px",
						},
					},
				}}
			>
				<span style={{ display: "block" }}>{cardContent}</span>
			</Tooltip>
		) : (
			cardContent
		);
	};

	const getTabLabels = () => {
		const tabs = new Set<string>();
		tabs.add("All");

		const commercial = modelOptions["Commercially Hosted"];
		if (commercial && typeof commercial === "object") {
			Object.keys(commercial).forEach((key) => tabs.add(key));
		}

		["Locally Hosted", "Embedded", "File Uploads"].forEach((key) => {
			if (modelOptions[key]) {
				tabs.add(key);
			}
		});

		return Array.from(tabs);
	};

	const tabLabels = getTabLabels();

	const getAllModels = () => {
		let allModels: any[] = [];

		const commercial = modelOptions["Commercially Hosted"];
		if (commercial && typeof commercial === "object") {
			Object.values(commercial).forEach((models: any) => {
				allModels = allModels.concat(models);
			});
		}

		["Locally Hosted", "Embedded", "File Uploads"].forEach((key) => {
			const models = modelOptions[key];
			if (Array.isArray(models)) {
				allModels = allModels.concat(models);
			}
		});

		return allModels;
	};

	const getModelsForTab = (tab: string) => {
		if (tab === "All") return getAllModels();

		const commercial = modelOptions["Commercially Hosted"];
		if (commercial && commercial[tab]) {
			return commercial[tab];
		}

		if (modelOptions[tab]) {
			return modelOptions[tab];
		}

		return [];
	};

	useEffect(() => {
		const paramedStep = {
			title: "",
			description: "",
			data: "",
		};

		// Based on where you came from in application, we can skip first step in connection process
		switch (type.toLowerCase()) {
			case "":
				break;
			case "database":
				paramedStep.title = "Connect to Database";
				paramedStep.description =
					"In today's data-driven world, the ability to effortlessly establish connections with various database types is pivotal for unlocking the full potential of your applications and analytical processes. Whether you're a developer, data analyst, or business professional, this page serves as your gateway to understanding the array of database options at your disposal.";
				paramedStep.data = "DATABASE";

				setSteps([...steps, paramedStep], steps.length + 1);
				break;
			case "model":
				paramedStep.title = "Connect to Model";
				paramedStep.description =
					"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
				paramedStep.data = "MODEL";

				setSteps([...steps, paramedStep], steps.length + 1);
				break;
			case "vector":
				paramedStep.title = "Connect to Vector Database";
				paramedStep.description =
					"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
				paramedStep.data = "VECTOR";

				setSteps([...steps, paramedStep], steps.length + 1);
				break;
			case "function":
				paramedStep.title = "Connect to Function";
				paramedStep.description =
					"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
				paramedStep.data = "FUNCTION";

				setSteps([...steps, paramedStep], steps.length + 1);
				break;
			case "storage":
				paramedStep.title = "Connect to Storage";
				paramedStep.description =
					"In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications. Whether you're a seasoned AI practitioner, a language aficionado, or an industry visionary, this page serves as your guiding star to grasp the spectrum of database options available within the LLM landscape.";
				paramedStep.data = "STORAGE";

				setSteps([...steps, paramedStep], steps.length + 1);
				break;
		}
	}, [type]);

	useEffect(() => {
		const scrollIntoView = () => {
			if (scrollToTopRef.current) {
				scrollToTopRef.current.scrollIntoView({
					behavior: "smooth",
					block: "center",
					inline: "start",
				});
			}
		};

		const delayScroll = () => {
			setTimeout(scrollIntoView, 100); // 5000 milliseconds = 5 seconds
		};

		delayScroll(); // Trigger the delayed scroll when the component mounts
	}, [steps.length]);

	useEffect(() => {
		setUniqueIdsOnConnectionOptions();
	}, []);

	const setUniqueIdsOnConnectionOptions = async () => {
		setIsLoading(true);
		await assignUniqueIds(CONNECTION_OPTIONS);
		setIsLoading(false);

		setConnectionOptions(CONNECTION_OPTIONS);
	};

	/**
	 * Assigns unique IDs for each connection type
	 * @param obj
	 * @param prefix
	 */
	function assignUniqueIds(obj, prefix = "") {
		if (Array.isArray(obj)) {
			// If it's an array, iterate through its elements
			for (let i = 0; i < obj.length; i++) {
				assignUniqueIds(obj[i], `${prefix}[${i}]`);
			}
		} else if (typeof obj === "object" && obj !== null) {
			// If it's an object, iterate through its properties
			for (const key in obj) {
				// if (obj.hasOwnProperty(key)) {
				const currentPrefix = prefix ? `${prefix}.${key}` : key;

				// Assign unique ID to the 'name', 'disable', 'fields' properties
				if (key === "name" || key === "disable" || key === "fields") {
					obj[`id`] = `${currentPrefix}${obj["name"]}`;
				}

				// Recursively traverse nested objects
				assignUniqueIds(obj[key], currentPrefix);
				// }
			}
		}
	}

	const renderModelsGrid = (models) => (
		<Grid container columns={6} columnSpacing={2} rowSpacing={2}>
			{models
				.filter((m) =>
					m.name.toLowerCase().includes(search.toLowerCase()),
				)
				.map((model, idx) => (
					<Grid key={idx} item lg={1} md={1} xs={1} xl={1} sm={1}>
						<ModelCard
							model={model}
							steps={steps}
							setSteps={setSteps}
						/>
					</Grid>
				))}
		</Grid>
	);

	const mapEngineOptions = () => {
		const entries = Object.values(connectionOptions[steps[0].data]);

		// Change in structure, quick 20 minute ask from Leadership
		if (Array.isArray(entries[0])) {
			return (
				<Box sx={{ width: "100%" }}>
					{Object.entries(connectionOptions[steps[0].data]).map(
						(kv: [string, any[]], i) => {
							return (
								<Box key={i}>
									<StyledCategoryTitle>
										{kv[0]}
									</StyledCategoryTitle>
									<Box>
										<Grid
											container
											columns={6}
											columnSpacing={2}
											rowSpacing={2}
										>
											{kv[1].map((stage, idx) => {
												if (
													stage.name
														.toLowerCase()
														.includes(
															search.toLowerCase(),
														)
												) {
													return (
														<Grid
															key={idx}
															item
															lg={1}
															md={1}
															xs={1}
															xl={1}
															sm={1}
														>
															<StyledFormTypeBox
																disabled={
																	stage.disable
																}
																data-testid={formatToDataTestId(
																	`importPageContent-${stage.name}-card`,
																)}
																onClick={() => {
																	if (
																		!stage.disable
																	) {
																		setSteps(
																			[
																				...steps,
																				{
																					id: `${kv[0]}.${stage.name}`,
																					title: stage.name,
																					description: `Fill out ${
																						stage.name
																					} details in order to add ${steps[0].data.toLowerCase()} to catalog`,
																					data: stage.fields,
																				},
																			],
																			steps.length +
																				1,
																		);
																	}
																}}
															>
																<StyledInnerBox>
																	<StyledCardImage
																		src={
																			stage.icon
																		}
																	/>
																	<StyledCardText>
																		{
																			stage.name
																		}
																	</StyledCardText>
																</StyledInnerBox>
															</StyledFormTypeBox>
														</Grid>
													);
												}
											})}
										</Grid>
									</Box>
								</Box>
							);
						},
					)}
				</Box>
			);
		} else {
			const e = Object.entries(connectionOptions[steps[0].data]);
			e.shift();

			return (
				<Box sx={{ width: "100%" }}>
					<Tabs
						value={selectedTab}
						onChange={(_, newValue) => setSelectedTab(newValue)}
						variant="scrollable"
						sx={{ mt: 2, borderBottom: "2px solid #E0E0E0" }}
					>
						{tabLabels.map((label, i) => (
							<StyledTab
								key={i}
								label={label}
								data-testid={formatToDataTestId(
									`connect-to-${label}-tab`,
								)}
							/>
						))}
					</Tabs>
					<Box sx={{ mt: 4 }}>
						{renderModelsGrid(
							getModelsForTab(tabLabels[selectedTab]),
						)}
					</Box>
				</Box>
			);
		}
	};

	return (
		<Stack direction="column" gap={2}>
			<StyledStack>
				{steps.length ? (
					<Breadcrumbs separator="/">
						<Breadcrumbs.Item
							//@ts-expect-error: TODO FIX Type
							as={Link}
							underline="none"
							color="inherit"
							variant="body1"
							onClick={() => {
								setSteps([], -1);
								if (window.history.length > 1) {
									navigate(-1);
								} else {
									navigate("/");
								}
							}}
						>
							{name} Catalog
						</Breadcrumbs.Item>
						{steps.map((step, i) => {
							return (
								<Breadcrumbs.Item
									//@ts-expect-error: TODO FIX Type
									as={Link}
									underline="none"
									color={
										steps.length - 1 === i
											? "text.disabled"
											: "inherit"
									}
									variant="body1"
									key={i}
									onClick={() => {
										const newSteps = [];
										for (let j = 0; j < i + 1; j++) {
											newSteps.push(steps[j]);
										}

										setSteps(newSteps, i + 1);
									}}
								>
									{step.title}
								</Breadcrumbs.Item>
							);
						})}
					</Breadcrumbs>
				) : (
					<div>&nbsp;</div>
				)}
				<Typography
					variant="h4"
					sx={isModelPage ? { fontWeight: 500 } : undefined}
				>
					{steps.length && steps[steps.length - 1].title}
				</Typography>
				<Typography
					variant="body1"
					color="inherit"
				>
					{steps.length && steps[steps.length - 1].description}
				</Typography>
			</StyledStack>
			<StyledContainer>
				{/* Search Second Step: TODO - only one search */}
				{steps.length === 1 &&
					steps[0].title !== "Copy Database" &&
					steps[0].title !== "Upload Database" && (
						<StyledSearchbarContainer>
							<Search
								size="small"
								value={search}
								onChange={(e) => {
									setSearch(e.target.value);
								}}
								fullWidth
							/>
						</StyledSearchbarContainer>
					)}
				{/*  When Step changes scroll top into view */}
				<div ref={scrollToTopRef} style={{ height: "0px" }}>
					&nbsp;
				</div>
				{/* Step 2a: Selection for options that require more info */}
				{/* This is shared between vector, function, database, model and storage */}
				{steps.length === 1 &&
					steps[0].title !== "Copy Database" &&
					steps[0].title !== "Upload Database" &&
					!isLoading &&
					mapEngineOptions()}
				{/* Step 2b: Show Form for Copy and Upload ( this is only a 2-step process) */}
				{steps.length === 1 &&
					(steps[0].title === "Copy Database" ||
						steps[0].title === "Upload Database") && (
						<StyledBox>
							{steps[0].title === "Copy Database" ? (
								<UploadData />
							) : (
								<CopyDatabaseForm />
							)}
						</StyledBox>
					)}
				{/* Step 3:  Will be the form to capture specific engine connection details */}
				{steps.length === 2 && <ImportConnectionPage />}
				{/* Step 4: If there is a step in the process after inputting connection details: metamodel for example */}
				{steps.length === 3 && <EstablishConnectionPage />}
			</StyledContainer>
			<Help />
		</Stack>
	);
};
