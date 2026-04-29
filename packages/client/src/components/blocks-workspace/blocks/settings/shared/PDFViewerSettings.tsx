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
import {
	FileDropzone,
	P,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
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
	<div className="w-full pt-1">{children}</div>
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
		const [allEngines, setAllEngines] = useState<engineIdType[]>([]);
		const tabs = ["Insight", "Engine", "App"];
		const [selectedPdfPath, setSelectedPdfPath] = useState(
			data?.selectedPdf || "",
		);
		const [selectedTab, setSelectedTab] = useState(tabs[1]);
		const [uploadFiles, setUploadFiles] = useState<File>(null);
		const [isLoading, setIsLoading] = useState(false);
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

		useEffect(() => {
			const getengineId = `MyEngines(engineTypes=[${allEngineTypes.map((type) => `"${type}"`).join(",")}]);`;
			runPixel(getengineId)
				.then((res) => {
					const output = res?.pixelReturn?.[0]?.output;
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
					setAllEngines(engineIds);
				})
				.catch((error) =>
					console.error("Error fetching engines:", error),
				);
		}, []);

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
							<InsightTab options={options} />
						</SubSection>
					</TabsContent>

					<TabsContent value="Engine">
						<SubSection>
							<EngineTab
								allEngines={allEngines}
								setData={setData}
								setSelectedPdfPath={setSelectedPdfPath}
							/>
						</SubSection>
					</TabsContent>

					<TabsContent value="App">
						<SubSection>
							<AppTab
								appId={appId || ""}
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
	<div className="mt-1">
		<select className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none">
			{options.map((option) => (
				<option key={option.id} value={option.path}>
					{option.display}
				</option>
			))}
		</select>
	</div>
);

const ENGINE_TYPE_LABELS: Record<string, string> = {
	MODEL: "Models",
	DATABASE: "Databases",
	VECTOR: "Vectors",
	FUNCTION: "Functions",
	STORAGE: "Storage",
};

const EngineTab: React.FC<{
	allEngines: engineIdType[];
	setData: SetPdfViewerData;
	setSelectedPdfPath: (path: string) => void;
}> = ({ allEngines, setData, setSelectedPdfPath }) => {
	const [selectedType, setSelectedType] = useState("");
	const [selectedEngineId, setSelectedEngineId] = useState("");
	const [files, setFiles] = useState<{ name: string; path: string }[]>([]);
	const [loadingFiles, setLoadingFiles] = useState(false);
	const [selectedFilePath, setSelectedFilePath] = useState("");

	const engineTypes = useMemo(() => {
		const seen = new Set<string>();
		return allEngines
			.map((e) => e.engine_type)
			.filter((t) => {
				if (seen.has(t)) return false;
				seen.add(t);
				return true;
			});
	}, [allEngines]);

	const engines = useMemo(() => {
		if (!selectedType) return [];
		const seen = new Set<string>();
		return allEngines
			.filter((e) => e.engine_type === selectedType)
			.filter((e) => {
				if (seen.has(e.engine_id)) return false;
				seen.add(e.engine_id);
				return true;
			})
			.map((e) => ({ id: e.engine_id, name: e.engine_name }));
	}, [allEngines, selectedType]);

	useEffect(() => {
		if (engineTypes.length > 0 && !selectedType) {
			setSelectedType(engineTypes[0]);
		}
	}, [engineTypes]);

	useEffect(() => {
		if (engines.length > 0) {
			setSelectedEngineId(engines[0].id);
		} else {
			setSelectedEngineId("");
			setFiles([]);
		}
	}, [engines]);

	useEffect(() => {
		if (!selectedEngineId) return;
		setLoadingFiles(true);
		setSelectedFilePath("");
		runPixel<unknown[]>(
			`SearchEngineAssets(engine=["${selectedEngineId}"], filePath=["/"], search=[".pdf"]);`,
		)
			.then((result) => {
				const output = result?.pixelReturn?.[0]?.output;
				setFiles(
					Array.isArray(output)
						? output.map(
								(item: { name?: string; path?: string }) => ({
									name: item.name || "",
									path: item.path || "",
								}),
							)
						: [],
				);
			})
			.catch(() => setFiles([]))
			.finally(() => setLoadingFiles(false));
	}, [selectedEngineId]);

	return (
		<div className="mt-1 flex flex-col gap-2">
			{engineTypes.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					No engines available
				</p>
			) : (
				<Select
					value={selectedType}
					onValueChange={(val) => {
						setSelectedType(val);
						setSelectedEngineId("");
					}}
				>
					<SelectTrigger className="w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{engineTypes.map((t) => (
							<SelectItem key={t} value={t}>
								{ENGINE_TYPE_LABELS[t] ?? t}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}

			{selectedType &&
				(engines.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No {ENGINE_TYPE_LABELS[selectedType] ?? selectedType}{" "}
						exist
					</p>
				) : (
					<Select
						value={selectedEngineId}
						onValueChange={(val) => setSelectedEngineId(val)}
					>
						<SelectTrigger className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{engines.map((e) => (
								<SelectItem key={e.id} value={e.id}>
									<span className="flex flex-col text-left">
										<span>{e.name}</span>
										<span className="text-[11px] text-muted-foreground">
											id: {e.id}
										</span>
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				))}

			{selectedEngineId &&
				(loadingFiles ? (
					<p className="text-muted-foreground text-sm">Loading...</p>
				) : files.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No PDF files found
					</p>
				) : (
					<select
						className="w-full rounded border border-input bg-background px-3 py-2 text-sm focus:outline-none"
						value={selectedFilePath}
						onChange={(e) => {
							const path = e.target.value;
							setSelectedFilePath(path);
							setData("engineId", selectedEngineId, true);
							setData("selectedPdf", path, true);
							setSelectedPdfPath(path);
						}}
					>
						<option value="">Select File</option>
						{files.map((f) => (
							<option key={f.path} value={f.path}>
								{f.name}
							</option>
						))}
					</select>
				))}
		</div>
	);
};

const AppTab: React.FC<{
	appId: string;
	selectedPdfPath: string;
	setData: SetPdfViewerData;
	setSelectedPdfPath: (path: string) => void;
	uploadFiles: File | null;
	setUploadFiles: (file: File | null) => void;
	isLoading: boolean;
	addFile: (file: File) => void;
}> = ({
	appId,
	selectedPdfPath,
	setData,
	setSelectedPdfPath,
	uploadFiles,
	setUploadFiles,
	isLoading,
	addFile,
}) => {
	const [appOptions, setAppOptions] = useState<AppOption[]>([]);
	const [loadingOptions, setLoadingOptions] = useState(true);

	useEffect(() => {
		setLoadingOptions(true);
		runPixel(
			`SearchAppAssets(project=["${appId}"], filePath=["/"], search=[".pdf"]);`,
		)
			.then((result) => {
				const output = result?.pixelReturn?.[0]?.output;
				setAppOptions(
					Array.isArray(output)
						? output.map(
								(item: { name?: string; path?: string }) => ({
									name: item.name || "",
									path: item.path || "",
								}),
							)
						: [],
				);
			})
			.catch(() => setAppOptions([]))
			.finally(() => setLoadingOptions(false));
	}, [appId]);

	return (
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
						<Info className="size-4 cursor-pointer text-foreground" />
						<span className="relative pl-[9px] text-base text-foreground">
							Delete current file to upload a new one
						</span>
					</div>
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{loadingOptions ? (
						<p className="text-muted-foreground text-sm">
							Loading...
						</p>
					) : appOptions.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No PDF files in app assets
						</p>
					) : (
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
					)}
					<div className="mb-2 flex items-center justify-center">
						<span className="relative pl-[9px] text-base text-foreground">
							Or
						</span>
					</div>
					<FileDropzone
						extensions={[".pdf"]}
						description="Click to browse or drop a PDF"
						disabled={isLoading}
						onChange={(file) => {
							const f = Array.isArray(file) ? file[0] : file;
							if (!f) return;
							setUploadFiles(f);
							addFile(f);
						}}
					/>
				</div>
			)}
		</div>
	);
};
