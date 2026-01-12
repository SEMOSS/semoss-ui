import {
	DeleteOutline,
	ExpandMore,
	InfoOutlined as InfoIcon,
} from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
	type Block,
	type BlockDef,
	type Paths,
	type PDFViewerBlockDef,
	useBlock,
} from "@semoss/renderer";
import { runPixel, upload } from "@semoss/sdk/react";
import {
	Accordion,
	Autocomplete,
	Box,
	FileDropzone,
	List,
	lightTheme,
	Stack,
	styled,
	Tabs,
	TextField,
	Tooltip,
	Typography,
	useNotification,
} from "@semoss/ui";
import { useRootStore } from "@/hooks";

//styled section for the selected tab
const StyledSubSection = styled("div")(() => ({
	padding: "0.5rem",
	width: "100%",
	marginTop: "10px",
}));

//styled span of the selected tab
const StyledSpanFrame = styled("span")(({ theme }) => ({
	fontSize: "1rem",
	color: theme.palette.secondary.dark,
	paddingLeft: "9px",
	position: "relative",
}));

const StyledMenuSection = styled(Accordion)(({ theme }) => ({
	boxShadow: "none",
	borderRadius: "0 !important",
	border: "0px",
	borderBottom: `1px solid ${theme.palette.divider}`,
	"&:before": { display: "none" },
	"&.Mui-expanded": { margin: "0" },
}));

const StyledMenuSectionTitle = styled(Accordion.Trigger)(({ theme }) => ({
	minHeight: "auto !important",
	height: theme.spacing(6),
}));

const StyledDeleteIcon = styled(DeleteOutline)(({ theme }) => ({
	color: theme.palette.error.main,
	cursor: "pointer",
}));

const StyledTypographyEror = styled(Typography)(({ theme }) => ({
	color: theme.palette.error.main,
	paddingLeft: "32px",
}));

const StyledAutocomplete = styled(Autocomplete)({
	paddingLeft: "9px",
	marginTop: "12px",
});

const StyledEngineContent = styled(Accordion.Content)(({ theme }) => ({
	borderBottom: `1px solid ${theme.palette.divider}`,
	marginTop: "5px",
}));

interface Option {
	id: string;
	path: string;
	display: string;
	group: string;
	engineId?: string;
	app_name?: string;
}

type engineIdType = {
	app_id: string;
	app_type: string;
	app_name: string;
};

interface PDFViewerSettings<D extends BlockDef = BlockDef> {
	/**
	 * Id of the block that is being worked with
	 */
	id: string;

	/**
	 * Path to update
	 */
	path: Paths<Block<D>["data"], 4>;
}

export const PDFViewerSettings = observer(
	<D extends BlockDef = BlockDef>({ id }: PDFViewerSettings<D>) => {
		const { data, setData, insightId } = useBlock<PDFViewerBlockDef>(id);
		const notification = useNotification();
		const { appId } = useParams();
		const { configStore, monolithStore } = useRootStore();
		const [appOptions, setAppOptions] = useState([]);
		const [engineOptions, setEngineOptions] = useState<
			{
				file_name: string;
				file_type: string;
				app_type: string;
				file_path: string;
				engineId: string;
				app_name: string;
			}[]
		>([]);
		const tabs = ["Insight", "Engine", "App"];
		const [selectedPdfPath, setSelectedPdfPath] = useState(
			data?.selectedPdf || "",
		);
		const [selectedTab, setSelectedTab] = useState(tabs[1]);
		const [uploadFiles, setUploadFiles] = useState<File>(null);
		const [isLoading, setIsLoading] = useState(false);
		const uploadedRefresh = configStore.store.reloadFiles;
		const [engineAutocompleteOpen, setEngineAutocompleteOpen] =
			useState(false);
		const allEngineTypes = [
			"MODEL",
			"DATABASE",
			"VECTOR",
			"FUNCTION",
			"STORAGE",
		];

		const groupAliasMapper = (
			type: string,
			category: "insight" | "engine",
		) => {
			if (category === "insight") {
				switch (type) {
					case "upload":
						return "Upload Blocks";
					case "notebook":
						return "Notebooks";
					case "cell":
						return "Cells";
					default:
						return "Others";
				}
			} else if (category === "engine") {
				switch (type) {
					case "MODEL":
						return "Models";
					case "DATABASE":
						return "Databases";
					case "VECTOR":
						return "Vectors";
					case "FUNCTION":
						return "Functions";
					case "STORAGE":
						return "Storage";
					default:
						return "Others";
				}
			}
			return "Others";
		};

		// Example options with group (replace with your real data)
		const options: Option[] = [
			{
				id: "upload1",
				path: "upload1",
				display: "Upload Block 1",
				group: groupAliasMapper("upload", "insight"),
			},
			{
				id: "notebook1",
				path: "notebook1",
				display: "Notebook 1",
				group: groupAliasMapper("notebook", "insight"),
			},
			{
				id: "cell1",
				path: "cell1",
				display: "Cell 1",
				group: groupAliasMapper("cell", "insight"),
			},
		];

		const getAssetsApp = useMemo(
			() =>
				runPixel(
					`BrowseAppAssets(project=["${appId}"], filePath=["/"]);`,
				),
			[appId, uploadedRefresh],
		);

		const deleteFile = async (fileDeletePath: string) => {
			await monolithStore.runQuery(
				`DeleteAsset(filePath=["${fileDeletePath}"], space=["${appId}"]);`,
			);
			configStore.setReloadFiles("Delete");
		};

		const refreshFiles = async () => {
			const result = await getAssetsApp;
			const outputArray = result?.pixelReturn?.[0]?.output;

			// Check if uploadedFiles exists in outputArray
			if (
				uploadFiles &&
				Array.isArray(outputArray) &&
				!outputArray.some(
					(item) =>
						item.name === uploadFiles.name ||
						item.path === selectedPdfPath,
				)
			) {
				setUploadFiles(null);
				setData("selectedPdf", "", true);
				setData("engineId", "", true);
				setSelectedPdfPath("");
			}
		};

		useEffect(() => {
			if (uploadedRefresh === "Delete") {
				refreshFiles();
			}
		}, [uploadedRefresh]);
		
		useEffect(() => {
			setSelectedPdfPath(data.selectedPdf || "");
			if (!data.selectedPdf){
				setUploadFiles(null);
			}
		}, [data.selectedPdf]);

		useEffect(() => {
			// Fetch Engine Ids
			const getengineId = `MyEngines(engineTypes=[${allEngineTypes.map((type) => `"${type}"`).join(",")}]);`;

			//Fetch Engine Details
			const engineIdResponse = runPixel(getengineId);

			// Fetch App Assets
			const fetchAssetsAndEngines = async () => {
				try {
					const result = await getAssetsApp;
					const outputArray = result?.pixelReturn?.[0]?.output;
					const outputNames = Array.isArray(outputArray)
						? outputArray
								.filter(
									(item) =>
										typeof item.name === "string" &&
										item.name
											.toLowerCase()
											.endsWith(".pdf"),
								)
								.map((item) => ({
									name: item.name,
									path: item.path,
								}))
						: [];
					setAppOptions(outputNames);
				} catch (error) {
					console.error("Error fetching assets:", error);
				}

				// Fetch Engine IDs
				try {
					const output = (await engineIdResponse).pixelReturn?.[0]
						?.output;
					const engineIds = Array.isArray(output)
						? Array.from(
								new Map(
									output.map((item) => [
										item.app_id,
										{
											app_id: item.app_id,
											app_type: item.app_type,
											app_name: item.app_name,
										},
									]),
								).values(),
							)
						: [];
					fetchEngineOptions(engineIds);
				} catch (error) {
					console.error("Error fetching engines:", error);
				}
			};

			fetchAssetsAndEngines();
		}, []);

		const fetchEngineOptions = async (engineIdsList: engineIdType[]) => {
			let pdfFiles: {
				file_name: string;
				app_type: string;
				file_type: string;
				file_path: string;
				engineId: string;
				app_name: string;
			}[] = [];
			const getFiles = engineIdsList.map((id) => ({
				promise: runPixel<any>(
					`BrowseEngineAssets(engine=["${id.app_id}"], filePath=["/"]);`,
				),
				app_type: id.app_type,
				app_id: id.app_id,
				app_name: id.app_name,
			}));

			for (const obj of getFiles) {
				try {
					const resolvedResult = await obj.promise;
					const output =
						resolvedResult.pixelReturn?.[0]?.output || [];
					const files = output.map((item: any) => ({
						file_name: item.type === "pdf" ? item.name : "",
						file_path: item.type === "pdf" ? item.path : "",
						file_type: item.type === "pdf" ? item.type : "",
						app_type: obj.app_type || "",
						engineId: obj.app_id || "",
						app_name: obj.app_name || "",
					}));
					pdfFiles = [...pdfFiles, ...files];
				} catch (e) {
					console.error("Error fetching engine assets:", e);
				}
			}
			setEngineOptions([...pdfFiles]);
		};

		const engineOptionList: Option[] = useMemo(() => {
			// Build group info and files by type in one pass
			const filesByType: Record<string, Option[]> = {};
			const allEngineGroups = allEngineTypes.map((type) => ({
				type,
				group: groupAliasMapper(type, "engine"),
			}));

			allEngineTypes.forEach((type) => {
				filesByType[type] = [];
			});

			engineOptions.forEach((item, idx) => {
				if (!filesByType[item.app_type])
					filesByType[item.app_type] = [];
				filesByType[item.app_type].push({
					id: `${item.app_type}-${item.file_name}-${idx}`,
					path: item.file_path,
					display: item.file_name,
					group: groupAliasMapper(item.app_type, "engine"),
					engineId: item.engineId,
					app_name: item.app_name,
				});
			});

			return allEngineGroups.flatMap(({ type, group }) =>
				filesByType[type].length > 0
					? filesByType[type]
					: [
							{
								id: `${type}-empty`,
								path: "",
								display: "",
								group,
							},
						],
			);
		}, [engineOptions]);

		const nestedEngineOptions = engineOptionList.reduce(
			(acc, option) => {
				if (!option.group || !option.app_name) return acc;
				if (!acc[option.group]) acc[option.group] = {};
				if (!acc[option.group][option.app_name])
					acc[option.group][option.app_name] = [];
				acc[option.group][option.app_name].push(option);
				return acc;
			},
			{} as Record<string, Record<string, Option[]>>,
		);

		const addFile = async (file: File) => {
			try {
				setIsLoading(true);
				let uploadTemp = null;

				uploadTemp = await upload(
					file,
					insightId,
					appId,
					"version/assets/",
				);

				let fileLocation = uploadTemp[0]?.fileLocation
						.replace(/\/+/g, "\\")      
						.replace(/\\+/g, "\\");

				if(uploadTemp){
					setUploadFiles({
						...file,
						name: uploadTemp[0]?.fileName,
					});
					setData("selectedPdf", fileLocation, true);
					setData("engineId", "", true);
					setSelectedPdfPath(fileLocation || "");
					
					configStore.setReloadFiles("Upload");
				}

				notification.add({
					color: "success",
					message: `Upload successful! File saved in the ${fileLocation}`,
				});
				if (!uploadTemp) {
					throw new Error("Error missing uploading app");
				}
			} catch (e) {
				notification.add({
					color: "error",
					message: "Error uploading PDF",
				});
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<Stack>
				<Tabs
					value={selectedTab}
					onChange={(_, value: string) => {
						setSelectedTab(value);
					}}
					color="primary"
					sx={{
						"& .MuiTabs-flexContainer": {
							justifyContent: "space-between",
							width: "100%",
						},
					}}
				>
					{tabs.map((key, idx: number) => (
						<Tabs.Item
							key={`${key}-${idx}`}
							label={
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: "14px",
									}}
								>
									<span>{key}</span>
									<Tooltip
										title={
											key === "Insight"
												? "Insight is in process"
												: key === "Engine"
													? "Pre-Stored files in engine storage"
													: key === "App"
														? "Files stored in app asset"
														: `Info about ${key}`
										}
										disableInteractive={false}
									>
										<InfoIcon
											sx={{
												cursor: "pointer",
												pointerEvents: "auto",
											}}
										/>
									</Tooltip>
								</Box>
							}
							value={key}
							disabled={key === "Insight"}
						/>
					))}
				</Tabs>
				<StyledSubSection>
					<StyledSpanFrame>
						{selectedTab === "App" && uploadFiles
							? "File Selected"
							: selectedTab}
					</StyledSpanFrame>
					{selectedTab === "Insight" && (
						<InsightTab options={options} />
					)}
					{selectedTab === "Engine" && (
						<EngineTab
							engineOptionList={engineOptionList}
							nestedEngineOptions={nestedEngineOptions}
							selectedPdfPath={selectedPdfPath}
							engineAutocompleteOpen={engineAutocompleteOpen}
							setEngineAutocompleteOpen={
								setEngineAutocompleteOpen
							}
							setData={setData}
							setSelectedPdfPath={setSelectedPdfPath}
						/>
					)}
					{selectedTab === "App" && (
						<AppTab
							appOptions={appOptions}
							selectedPdfPath={selectedPdfPath}
							setData={setData}
							setSelectedPdfPath={setSelectedPdfPath}
							uploadFiles={uploadFiles}
							setUploadFiles={setUploadFiles}
							isLoading={isLoading}
							addFile={addFile}
							deleteFile={deleteFile}
						/>
					)}
				</StyledSubSection>
			</Stack>
		);
	},
);

const InsightTab: React.FC<{ options: Option[] }> = ({ options }) => (
	<StyledAutocomplete
		fullWidth
		id={"PDFViewer-Insight"}
		multiple={false}
		options={options}
		groupBy={(option) =>
			typeof option === "object" && "group" in option
				? String(option.group)
				: ""
		}
		getOptionLabel={(option) =>
			typeof option === "object" && "display" in option
				? String(option.display)
				: ""
		}
		renderOption={(props, option) => (
			<li
				{...props}
				key={
					typeof option === "object" && "id" in option
						? String(option.id)
						: undefined
				}
			>
				<Typography variant="body2">
					{typeof option === "object" && "display" in option
						? String(option.display)
						: ""}
				</Typography>
			</li>
		)}
		renderGroup={(params) => (
			<li key={params.key}>
				<StyledMenuSection>
					<StyledMenuSectionTitle expandIcon={<ExpandMore />}>
						<Typography variant="body2">{params.group}</Typography>
					</StyledMenuSectionTitle>
					<Accordion.Content>
						<List disablePadding>{params.children}</List>
					</Accordion.Content>
				</StyledMenuSection>
			</li>
		)}
		renderInput={(params) => (
			<TextField
				{...params}
				placeholder="Select File"
				size="small"
				variant="outlined"
			/>
		)}
	/>
);

const EngineTab: React.FC<{
	engineOptionList: Option[];
	nestedEngineOptions: Record<string, Record<string, Option[]>>;
	selectedPdfPath: string;
	engineAutocompleteOpen: boolean;
	setEngineAutocompleteOpen: (open: boolean) => void;
	setData: any;
	setSelectedPdfPath: (path: string) => void;
}> = ({
	engineOptionList,
	nestedEngineOptions,
	selectedPdfPath,
	engineAutocompleteOpen,
	setEngineAutocompleteOpen,
	setData,
	setSelectedPdfPath,
}) => (
	<StyledAutocomplete
		fullWidth
		id={"PDFViewer-Engine"}
		multiple={false}
		options={engineOptionList}
		groupBy={(option) =>
			typeof option === "object" && "group" in option
				? String(option.group)
				: ""
		}
		getOptionLabel={(option) =>
			typeof option === "object" && "display" in option
				? String(option.display)
				: ""
		}
		value={
			engineOptionList.find((opt) => opt.path === selectedPdfPath) || 
			(selectedPdfPath
				? {
						path: selectedPdfPath,
						display: selectedPdfPath.split(/[/\\]/).pop(),
				  }
				: null)
		}
		open={engineAutocompleteOpen}
		onOpen={() => setEngineAutocompleteOpen(true)}
		onClose={() => setEngineAutocompleteOpen(false)}
		renderOption={(props, option) => (
			<li
				{...props}
				key={
					typeof option === "object" && "id" in option
						? String(option.id)
						: undefined
				}
			>
				<Typography variant="body2">
					{typeof option === "object" && "display" in option
						? String(option.display)
						: String(option)}
				</Typography>
			</li>
		)}
		renderGroup={(params) => {
			const appNames = Object.keys(
				nestedEngineOptions[params.group] || {},
			);
			return (
				<li key={params.key}>
					<StyledMenuSection>
						<StyledMenuSectionTitle expandIcon={<ExpandMore />}>
							<Typography variant="body2" fontWeight="bold">
								{params.group}
							</Typography>
						</StyledMenuSectionTitle>
						<Accordion.Content>
							<List disablePadding>
								{appNames.map((appName) => {
									const optionsForApp =
										nestedEngineOptions[params.group][
											appName
										] || [];
									const allEmpty = optionsForApp.every(
										(option) =>
											!option.display ||
											!option.display.trim(),
									);
									return (
										<StyledMenuSection key={appName}>
											<StyledMenuSectionTitle
												expandIcon={<ExpandMore />}
											>
												<Typography
													variant="body2"
													sx={{ pl: 2 }}
													fontWeight="bold"
												>
													{appName}
												</Typography>
											</StyledMenuSectionTitle>
											<StyledEngineContent>
												<List disablePadding>
													{allEmpty ? (
														<StyledTypographyEror variant="body2">
															No Files found
														</StyledTypographyEror>
													) : (
														optionsForApp.map(
															(option) =>
																option.display?.trim() ? (
																	<li
																		key={
																			option.engineId
																		}
																		style={{
																			paddingLeft:
																				"32px",
																			cursor: "pointer",
																		}}
																		onClick={() => {
																			setData(
																				"engineId",
																				option.engineId,
																				true,
																			);
																			setData(
																				"selectedPdf",
																				option.path,
																				true,
																			);
																			setSelectedPdfPath(
																				option.path,
																			);
																			setEngineAutocompleteOpen(
																				false,
																			);
																		}}
																	>
																		<Typography variant="body2">
																			{
																				option.display
																			}
																		</Typography>
																	</li>
																) : null,
														)
													)}
												</List>
											</StyledEngineContent>
										</StyledMenuSection>
									);
								})}
							</List>
						</Accordion.Content>
					</StyledMenuSection>
				</li>
			);
		}}
		renderInput={(params) => (
			<TextField
				{...params}
				placeholder="Select File"
				size="small"
				variant="outlined"
			/>
		)}
		onChange={(_, value) => {
			if (!value) {
				setData("selectedPdf", "", true);
				setData("engineId", "", true);
				setSelectedPdfPath("");
			}
		}}
	/>
);

const AppTab: React.FC<{
	appOptions: any[];
	selectedPdfPath: string;
	setData: any;
	setSelectedPdfPath: (path: string) => void;
	uploadFiles: File | null;
	setUploadFiles: (file: File | null) => void;
	isLoading: boolean;
	addFile: (file: File) => void;
	deleteFile: (fileDeletePath: string) => void;
}> = ({
	appOptions,
	selectedPdfPath,
	setData,
	setSelectedPdfPath,
	uploadFiles,
	setUploadFiles,
	isLoading,
	addFile,
	deleteFile,
}) => (
	<Stack sx={{ paddingLeft: "9px", marginTop: "12px" }}>
		{uploadFiles ? (
			<Stack>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="body1">{uploadFiles.name}</Typography>
					<StyledDeleteIcon
						onClick={() => {
							deleteFile(selectedPdfPath);
						}}
					/>
				</Box>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						paddingTop: "8px",
					}}
				>
					<InfoIcon
						sx={{
							cursor: "pointer",
							color: lightTheme.palette.secondary.dark,
						}}
					/>
					<StyledSpanFrame>
						Delete current file to upload a new one
					</StyledSpanFrame>
				</Box>
			</Stack>
		) : (
			<Stack>
				<Autocomplete
					fullWidth
					id={"PDFViewer-App"}
					multiple={false}
					value={
						appOptions.find((opt) => opt.path === selectedPdfPath) ||
						(selectedPdfPath
							? {
									path: selectedPdfPath,
									name: selectedPdfPath.split(/[/\\]/).pop(),
							  }
							: null)
					}
					options={appOptions}
					getOptionLabel={(option) => {
						const typedOption = option as { name?: string };
						return typedOption.name || "";
					}}
					onChange={(_, value) => {
						setData("selectedPdf", value?.path || "", true);
						setData("engineId", "", true);
						setSelectedPdfPath(value?.path || "");
					}}
					freeSolo={false}
					renderInput={(params) => (
						<TextField
							{...params}
							placeholder="Select File"
							size="small"
							variant="outlined"
						/>
					)}
				/>
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						alignItems: "center",
						marginBottom: "8px",
					}}
				>
					<StyledSpanFrame>Or</StyledSpanFrame>
				</Box>
				<FileDropzone
					multiple={false}
					value={uploadFiles}
					disabled={isLoading}
					onChange={(newValue: File) => {
						setUploadFiles(newValue);
						addFile(newValue);
					}}
				/>
			</Stack>
		)}
	</Stack>
);
