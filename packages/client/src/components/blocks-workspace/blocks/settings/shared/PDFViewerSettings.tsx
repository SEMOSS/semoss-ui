// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Info, Trash2 } from "lucide-react";
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
import { FileDropzone } from "@semoss/ui";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
	Muted,
	P,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";

//styled section for the selected tab
const SubSection = ({ children }: { children: React.ReactNode }) => (
	<div className="mt-[10px] w-full p-2">{children}</div>
);

interface Option {
	id: string;
	path: string;
	display: string;
	group: string;
	engineId?: string;
	engine_name?: string;
}

interface AppOption {
	name: string;
	path: string;
}

type SetPdfViewerData = (
	path: "engineId" | "selectedPdf",
	value: string,
	tempOverrideMode?: boolean,
) => void;

type EngineAsset = {
	type?: string;
	name?: string;
	path?: string;
};

type engineIdType = {
	engine_id: string;
	engine_type: string;
	engine_name: string;
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
		const { appId } = useParams();
		const [appOptions, setAppOptions] = useState<AppOption[]>([]);
		const [engineOptions, setEngineOptions] = useState<
			{
				file_name: string;
				file_type: string;
				engine_type: string;
				file_path: string;
				engineId: string;
				engine_name: string;
			}[]
		>([]);
		const tabs = ["Insight", "Engine", "App"];
		const [selectedPdfPath, setSelectedPdfPath] = useState(
			data?.selectedPdf || "",
		);
		const [selectedTab, setSelectedTab] = useState(tabs[1]);
		const [uploadFiles, setUploadFiles] = useState<File>(null);
		const [isLoading, setIsLoading] = useState(false);
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
			[appId],
		);

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
										item.engine_id,
										{
											engine_id: item.engine_id,
											engine_type: item.engine_type,
											engine_name: item.engine_name,
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
				engine_type: string;
				file_type: string;
				file_path: string;
				engineId: string;
				engine_name: string;
			}[] = [];
			const getFiles = engineIdsList.map((id) => ({
				promise: runPixel<unknown[]>(
					`BrowseEngineAssets(engine=["${id.engine_id}"], filePath=["/"]);`,
				),
				engine_type: id.engine_type,
				engine_id: id.engine_id,
				engine_name: id.engine_name,
			}));

			for (const obj of getFiles) {
				try {
					const resolvedResult = await obj.promise;
					const output = resolvedResult.pixelReturn?.[0]?.output;
					const outputList = Array.isArray(output)
						? (output as EngineAsset[])
						: [];
					const files = outputList.map((item) => ({
						file_name: item.type === "pdf" ? item.name || "" : "",
						file_path: item.type === "pdf" ? item.path || "" : "",
						file_type: item.type === "pdf" ? item.type || "" : "",
						engine_type: obj.engine_type || "",
						engineId: obj.engine_id || "",
						engine_name: obj.engine_name || "",
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
				if (!filesByType[item.engine_type])
					filesByType[item.engine_type] = [];
				filesByType[item.engine_type].push({
					id: `${item.engine_type}-${item.file_name}-${idx}`,
					path: item.file_path,
					display: item.file_name,
					group: groupAliasMapper(item.engine_type, "engine"),
					engineId: item.engineId,
					engine_name: item.engine_name,
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
				if (!option.group || !option.engine_name) return acc;
				if (!acc[option.group]) acc[option.group] = {};
				if (!acc[option.group][option.engine_name])
					acc[option.group][option.engine_name] = [];
				acc[option.group][option.engine_name].push(option);
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

				setData("selectedPdf", uploadTemp[0].fileLocation, true);
				setData("engineId", "", true);
				setSelectedPdfPath(uploadTemp[0].fileLocation || "");

				toast.success(
					`Upload successful! File saved in the ${uploadTemp[0].fileLocation}`,
				);
				if (!uploadTemp) {
					throw new Error("Error missing uploading app");
				}
			} catch (e) {
				toast.error("Error uploading PDF");
				console.error(e);
			} finally {
				setIsLoading(false);
			}
		};

		return (
			<div className="flex flex-col gap-1">
				<Tabs value={selectedTab} onValueChange={setSelectedTab}>
					<TabsList className="w-full justify-between">
						{tabs.map((key) => (
							<TabsTrigger
								key={key}
								value={key}
								disabled={key === "Insight"}
								className="flex items-center gap-2"
							>
								<span>{key}</span>
								<Tooltip>
									<TooltipTrigger asChild>
										<Info className="size-4 cursor-pointer" />
									</TooltipTrigger>
									<TooltipContent>
										{key === "Insight"
											? "Insight is in process"
											: key === "Engine"
												? "Pre-Stored files in engine storage"
												: key === "App"
													? "Files stored in app asset"
													: `Info about ${key}`}
									</TooltipContent>
								</Tooltip>
							</TabsTrigger>
						))}
					</TabsList>

					<TabsContent value="Insight">
						<SubSection>
							<span className="relative pl-[9px] text-secondary text-sm">
								{selectedTab}
							</span>
							<InsightTab options={options} />
						</SubSection>
					</TabsContent>

					<TabsContent value="Engine">
						<SubSection>
							<span className="relative pl-[9px] text-secondary text-sm">
								{selectedTab}
							</span>
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
						</SubSection>
					</TabsContent>

					<TabsContent value="App">
						<SubSection>
							<span className="relative pl-[9px] text-secondary text-sm">
								{selectedTab === "App" && uploadFiles
									? "File Selected"
									: selectedTab}
							</span>
							<AppTab
								appOptions={appOptions}
								selectedPdfPath={selectedPdfPath}
								setData={setData}
								setSelectedPdfPath={setSelectedPdfPath}
								uploadFiles={uploadFiles}
								setUploadFiles={setUploadFiles}
								isLoading={isLoading}
								addFile={addFile}
							/>
						</SubSection>
					</TabsContent>
				</Tabs>
			</div>
		);
	},
);

const InsightTab: React.FC<{ options: Option[] }> = ({ options }) => (
	<div className="mt-3 pl-[9px]">
		<select className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none">
			{options.map((option) => (
				<option key={option.id} value={option.path}>
					{option.display}
				</option>
			))}
		</select>
	</div>
);

const EngineTab: React.FC<{
	engineOptionList: Option[];
	nestedEngineOptions: Record<string, Record<string, Option[]>>;
	selectedPdfPath: string;
	engineAutocompleteOpen: boolean;
	setEngineAutocompleteOpen: (open: boolean) => void;
	setData: SetPdfViewerData;
	setSelectedPdfPath: (path: string) => void;
}> = ({
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	engineOptionList,
	nestedEngineOptions,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	selectedPdfPath,
	// biome-ignore lint/correctness/noUnusedFunctionParameters: required by interface
	engineAutocompleteOpen,
	setEngineAutocompleteOpen,
	setData,
	setSelectedPdfPath,
}) => (
	<div className="mt-3 pl-[9px]">
		<Accordion type="multiple" className="w-full">
			{Object.entries(nestedEngineOptions).map(([group, engines]) => (
				<AccordionItem key={group} value={group}>
					<AccordionTrigger className="font-bold text-sm">
						{group}
					</AccordionTrigger>
					<AccordionContent>
						{Object.entries(engines).map(([engineName, files]) => {
							const allEmpty = files.every(
								(f) => !f.display || !f.display.trim(),
							);
							return (
								<Accordion
									key={engineName}
									type="multiple"
									className="w-full"
								>
									<AccordionItem value={engineName}>
										<AccordionTrigger className="pl-4 font-bold text-sm">
											{engineName}
										</AccordionTrigger>
										<AccordionContent>
											<ul className="mt-[5px] border-border border-b">
												{allEmpty ? (
													<li className="pl-8 text-destructive text-sm">
														No Files found
													</li>
												) : (
													files.map((option) => {
														if (
															!option.display?.trim()
														)
															return null;
														return (
															<li
																key={
																	option.engineId ||
																	option.path
																}
																className="pl-8"
															>
																<button
																	type="button"
																	onClick={() => {
																		setData(
																			"engineId",
																			option.engineId ||
																				"",
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
																	className="cursor-pointer border-none bg-transparent p-0 text-left text-sm hover:underline"
																>
																	<Muted>
																		{
																			option.display
																		}
																	</Muted>
																</button>
															</li>
														);
													})
												)}
											</ul>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							);
						})}
					</AccordionContent>
				</AccordionItem>
			))}
		</Accordion>
	</div>
);

const AppTab: React.FC<{
	appOptions: AppOption[];
	selectedPdfPath: string;
	setData: SetPdfViewerData;
	setSelectedPdfPath: (path: string) => void;
	uploadFiles: File | null;
	setUploadFiles: (file: File | null) => void;
	isLoading: boolean;
	addFile: (file: File) => void;
}> = ({
	appOptions,
	selectedPdfPath,
	setData,
	setSelectedPdfPath,
	uploadFiles,
	setUploadFiles,
	isLoading,
	addFile,
}) => (
	<div className="mt-3 flex flex-col gap-2 pl-[9px]">
		{uploadFiles ? (
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<P>{uploadFiles.name}</P>
					<button
						type="button"
						onClick={() => setUploadFiles(null)}
						className="rounded p-1 hover:bg-accent"
					>
						<Trash2 className="size-4 cursor-pointer text-destructive" />
					</button>
				</div>
				<div className="flex items-center pt-2">
					<Info className="size-4 cursor-pointer text-secondary" />
					<span className="relative pl-[9px] text-secondary text-sm">
						Delete current file to upload a new one
					</span>
				</div>
			</div>
		) : (
			<div className="flex flex-col gap-2">
				<select
					className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
					value={selectedPdfPath}
					onChange={(e) => {
						const opt = appOptions.find(
							(o) => o.path === e.target.value,
						);
						setData("selectedPdf", opt?.path || "", true);
						setData("engineId", "", true);
						setSelectedPdfPath(opt?.path || "");
					}}
				>
					<option value="">Select File</option>
					{appOptions.map((opt) => (
						<option key={opt.path} value={opt.path}>
							{opt.name}
						</option>
					))}
				</select>
				<div className="mb-2 flex items-center justify-center">
					<span className="relative pl-[9px] text-secondary text-sm">
						Or
					</span>
				</div>
				<FileDropzone
					multiple={false}
					value={uploadFiles}
					disabled={isLoading}
					onChange={(newValue: File) => {
						setUploadFiles(newValue);
						addFile(newValue);
					}}
				/>
			</div>
		)}
	</div>
);
