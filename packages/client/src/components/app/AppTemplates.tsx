import { Bot, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Variable } from "@semoss/renderer";
import { runPixel } from "@semoss/sdk/react";
import { Modal, Stack, styled } from "@semoss/ui";
import { useRootStore } from "@/hooks";
import type { AppMetadata } from "./app.types";
import { BrowseTemplateTileCard } from "./BrowseTempateTitleCard";
import {
	cleanToValidJSON,
	constructLLMPrompt,
	SECTION_ORDER,
} from "./llmPromptHelper";
import { createAppFromTemplate } from "./templatehelpers";
import {
	AskLLMTemplate,
	BlocksGuideTemplate,
	CreateDiabetesRecordTemplate,
	CustomFrameToVisualizationTemplate,
	DeleteDiabetesRecordTemplate,
	GmailTemplate,
	LandingPageTemplate,
	MultiPageTemplate,
	NLPToGridTemplate,
	ReadDiabetesRecordTemplate,
	RowToNotebookTemplate,
	type Template,
	UpdateDiabetesRecordTemplate,
	VisualizeCSVTemplate,
} from "./templates";

export { SECTION_ORDER };
const DEFAULT_TEMPLATE = [
	LandingPageTemplate,
	RowToNotebookTemplate,
	AskLLMTemplate,
	CustomFrameToVisualizationTemplate,
	VisualizeCSVTemplate,
	NLPToGridTemplate,
	BlocksGuideTemplate,
	MultiPageTemplate,
	CreateDiabetesRecordTemplate,
	ReadDiabetesRecordTemplate,
	UpdateDiabetesRecordTemplate,
	DeleteDiabetesRecordTemplate,
	GmailTemplate,
	// AskCSVTemplate,
];

const StyledContainer = styled("div")(() => ({
	display: "flex",
	flexDirection: "row",
	flexWrap: "wrap",
	gap: "24px",
}));

interface AppTemplatesProps {
	onUse: (template: Template) => void;
	randomCount?: number;
}

interface ModelOption {
	label: string;
	value: string;
}

const escapeForPixelString = (str: string) => {
	return str
		.replace(/\\/g, "\\\\")
		.replace(/"/g, '\\"')
		.replace(/\r/g, "\\r")
		.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/%/g, "%25");
};

export const AppTemplates = (props: AppTemplatesProps) => {
	const { randomCount, onUse = () => null } = props;
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [name, setName] = useState("");
	const [prompt, setPrompt] = useState("");
	const [selectedLLM, setSelectedLLM] = useState<string>("");
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const [modelList, setModelList] = useState<ModelOption[]>([]);
	const [isLoadingModels, setIsLoadingModels] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);
	const { monolithStore } = useRootStore();
	const navigate = useNavigate();

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				menuRef.current &&
				!menuRef.current.contains(event.target as Node)
			) {
				setIsMenuOpen(false);
			}
		};

		if (isMenuOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isMenuOpen]);

	const fetchModelList = async () => {
		setIsLoadingModels(true);
		try {
			const pixel = `MyEngines(engineTypes=["MODEL"])`;
			const res = await runPixel(pixel);

			const list = res.pixelReturn[0].output as Array<{
				database_subtype: string;
				database_type: string;
				database_name: string;
				database_id: string;
				app_name: string;
			}>;

			const models = list.map((model) => ({
				label: model.database_name,
				value: model.database_id,
			}));

			setModelList(models);
		} catch (error) {
			console.error("Error fetching model list:", error);
			setModelList([]);
		} finally {
			setIsLoadingModels(false);
		}
	};

	const handleOpenModal = () => {
		setIsModalOpen(true);
		fetchModelList();
	};

	const handleCloseModal = () => {
		setIsModalOpen(false);
		setName("");
		setPrompt("");
		setSelectedLLM("");
		setIsMenuOpen(false);
		setModelList([]);
	};

	const handleCreate = async () => {
		if (!name.trim() || !prompt.trim() || !selectedLLM) {
			alert("Please fill in all fields");
			return;
		}

		setIsGenerating(true);

		try {
			const llmPrompt = constructLLMPrompt(name, prompt);
			const escapedPrompt = escapeForPixelString(llmPrompt);

			const pixelCommand = `LLM(
  engine = "${selectedLLM}",
  command = "${escapedPrompt}",
  paramValues = [ {"max_completion_tokens": 7000, "temperature": 0.0} ]
);`;

			console.log("Calling LLM with:", {
				engine: selectedLLM,
				appName: name,
				userPrompt: prompt,
			});

			const response = await runPixel(pixelCommand);

			const generatedRaw = response.pixelReturn[0].output as {
				response?: string;
			};

			console.log("RAW from LLM:", generatedRaw);

			const cleanJSON = cleanToValidJSON(generatedRaw?.response || "");

			console.log("CLEAN JSON:", cleanJSON);

			let isValidJSON = false;
			try {
				JSON.parse(cleanJSON);
				isValidJSON = true;
			} catch (parseErr) {
				console.error("Invalid JSON after cleaning:", parseErr);
				alert(
					"Generated JSON is invalid. Please check the console for details.",
				);
				return;
			}

			if (isValidJSON) {
				try {
					const appId = await createAppFromTemplate(
						cleanJSON,
						monolithStore,
						{
							title: name,
							description: prompt,
						},
					);

					if (appId) {
						console.log("App created successfully with ID:", appId);
						navigate(`/app/${appId}/view`);
						handleCloseModal();
					} else {
						throw new Error("App creation returned no ID");
					}
				} catch (err) {
					console.error("Failed to create app from template:", err);
					alert(
						"Failed to create app from generated template. See console for details.",
					);
				}
			}
		} catch (error) {
			console.error("Error generating app:", error);
			alert("Failed to generate app. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	const handleLLMSelect = (value: string) => {
		setSelectedLLM(value);
		setIsMenuOpen(false);
	};

	const getSelectedModelLabel = () => {
		const selected = modelList.find((model) => model.value === selectedLLM);
		return selected ? selected.label : "Select LLM";
	};

	const getAppMetadataFromTemplate = (template: Template): AppMetadata => {
		return {
			project_id: template.name,
			project_name: template.name,
			project_type: "BLOCKS",
			project_cost: "",
			project_global: "",
			project_catalog_name: "",
			project_created_by: "SYSTEM",
			project_date_last_edited: "",
			project_created_by_type: "",
			project_date_created: "",
			project_has_portal: false,
			tag: template.tags,
			description: template.description,
		};
	};

	const includeMCPDriverToTemplateState = (template: Template): Template => {
		if (
			template.state.queries &&
			!template.state.queries?.["mcp_driver"] &&
			template.state.variables &&
			!template.state.variables?.["mcp_driver"] &&
			!template.state.variables?.["mcp_driver--1"]
		) {
			return {
				...template,
				state: {
					...template.state,
					queries: {
						...template.state.queries,
						mcp_driver: {
							id: "mcp_driver",
							cells: [
								{
									id: "1",
									widget: "code",
									parameters: {
										code: "",
										type: "py",
									},
								},
							],
						},
					},
					variables: {
						...template.state.variables,
						mcp_driver: {
							type: "query",
							to: "mcp_driver",
							cellId: "1",
						} as Variable,
						"mcp_driver--1": {
							type: "cell",
							to: "mcp_driver",
							cellId: "1",
						},
					},
				},
			};
		}
		return template;
	};

	return (
		<Stack
			direction={"row"}
			alignItems={"flex-start"}
			alignSelf={"stretch"}
			spacing={3}
		>
			<StyledContainer>
				{DEFAULT_TEMPLATE.map((t, idx) => {
					if (randomCount && idx > randomCount) {
						return;
					}
					const app = getAppMetadataFromTemplate(t);
					return (
						<BrowseTemplateTileCard
							key={`default-template-${app.project_name}`}
							app={app}
							onAction={() =>
								onUse(includeMCPDriverToTemplateState(t))
							}
						/>
					);
				})}
				<div
					className="h-[269px] w-[307px] cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
					onClick={handleOpenModal}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							handleOpenModal();
						}
					}}
					role="button"
					tabIndex={0}
				>
					<div className="flex h-[138px] w-full items-center justify-center bg-gray-50">
						<img
							src="https://img.freepik.com/free-vector/technology-face-circuit-diagram-background_1017-18300.jpg?semt=ais_hybrid&w=740&q=80"
							alt="AI Assisted App"
							className="h-[123px] w-[283px] object-cover"
						/>
					</div>
					<div className="flex flex-col gap-2 p-4">
						<h1 className="overflow-hidden text-ellipsis whitespace-nowrap font-normal text-base text-gray-900 leading-[143%] tracking-[0.17px]">
							AI ASSISTED APP
						</h1>
						<p
							className="line-clamp-2 h-10 overflow-hidden text-ellipsis break-words font-normal text-gray-600 text-xs leading-[19.92px] tracking-[0.4px]"
							title="Create custom applications using AI assistance. Describe your requirements and let AI generate a tailored app template for you."
						>
							Create custom applications using AI assistance.
							Describe your requirements and let AI generate a
							tailored app template for you.
						</p>
					</div>
				</div>
			</StyledContainer>

			<Modal
				open={isModalOpen}
				onClose={handleCloseModal}
				maxWidth="md"
				fullWidth
			>
				<div className="min-w-[500px] rounded-lg bg-white p-6">
					<div className="mb-6 flex items-center justify-between">
						<h2 className="font-semibold text-gray-900 text-xl">
							AI Drag and Drop
						</h2>

						<div className="relative" ref={menuRef}>
							<button
								type="button"
								onClick={() => setIsMenuOpen(!isMenuOpen)}
								className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 text-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								aria-label="Select LLM"
								aria-expanded={isMenuOpen}
								aria-haspopup="true"
								disabled={isLoadingModels || isGenerating}
							>
								<Bot className="h-5 w-5" />
								<span className="font-medium">
									{isLoadingModels
										? "Loading..."
										: getSelectedModelLabel()}
								</span>
								<ChevronDown
									className={`h-4 w-4 transition-transform ${isMenuOpen ? "rotate-180" : ""}`}
								/>
							</button>

							{isMenuOpen && (
								<div className="absolute top-full right-0 z-10 mt-2 max-h-60 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
									{modelList.length === 0 ? (
										<div className="px-4 py-3 text-center text-gray-500 text-sm">
											No models available
										</div>
									) : (
										modelList.map((model) => (
											<button
												key={model.value}
												type="button"
												onClick={() =>
													handleLLMSelect(model.value)
												}
												className={`w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 ${
													selectedLLM === model.value
														? "bg-blue-50 font-medium text-blue-600"
														: "text-gray-700"
												}`}
											>
												{model.label}
											</button>
										))
									)}
								</div>
							)}
						</div>
					</div>

					<div className="mb-6 space-y-4">
						<div>
							<label
								htmlFor="app-name"
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Name
							</label>
							<input
								type="text"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="Enter application name"
								disabled={isGenerating}
								className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
							/>
						</div>

						<div>
							<label
								htmlFor="app-prompt"
								className="mb-2 block font-medium text-gray-700 text-sm"
							>
								Prompt
							</label>
							<textarea
								value={prompt}
								onChange={(e) => setPrompt(e.target.value)}
								placeholder="Describe what you want to create..."
								rows={4}
								disabled={isGenerating}
								className="w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-gray-50"
							/>
						</div>
					</div>

					<div className="flex justify-end gap-2">
						<button
							type="button"
							className="rounded-md bg-gray-100 px-4 py-2 font-medium text-gray-700 text-sm transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							onClick={handleCloseModal}
							disabled={isGenerating}
						>
							Cancel
						</button>
						<button
							type="button"
							className="rounded-md bg-blue-600 px-4 py-2 font-medium text-sm text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
							onClick={handleCreate}
							disabled={
								!name.trim() ||
								!prompt.trim() ||
								!selectedLLM ||
								isGenerating
							}
						>
							{isGenerating ? "Generating..." : "Create"}
						</button>
					</div>
				</div>
			</Modal>
		</Stack>
	);
};
