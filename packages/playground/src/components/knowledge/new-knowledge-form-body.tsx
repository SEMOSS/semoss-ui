import { FileIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { type Engine, EngineSelect, NewEngineInput } from "@semoss/shared";
import {
	Button,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { MCPConfig } from "@/types";

interface NewKnowledgeFormBodyProps {
	/** HTML id attached to the inner <form>. Use form="<this-id>" on an
	 *  external submit button to trigger submission from outside. */
	formId: string;

	/** Fired after a successful create with the new knowledge MCP entry */
	onSuccess: (knowledge: MCPConfig) => void;

	/** Notifies the parent when the form is busy (used to disable buttons) */
	onLoadingChange?: (loading: boolean) => void;
}

/**
 * Renders just the form fields + submission logic for creating a new
 * knowledge MCP. Pairs with an external submit button via `formId`.
 */
export const NewKnowledgeFormBody: React.FC<NewKnowledgeFormBodyProps> =
	observer(({ formId, onSuccess, onLoadingChange }) => {
		const { actions } = useInsight();
		const { root } = useRoot();
		const { t } = useTranslation([
			"knowledge",
			"validation",
			"notifications",
			"common",
		]);

		const showEmbeddingOptions =
			root.theme.featureFlags?.allowEmbeddingOptions;
		const defaultEmbedderId = root.theme.defaultEmbedderId ?? "";
		const runMCP = root.theme.featureFlags?.enableKnowledgeMCP;

		const [isLoading, setIsLoading] = useState(false);
		const [name, setName] = useState("");
		const [description, setDescription] = useState("");
		const [embeddingEngine, setEmbeddingEngine] = useState<Engine | null>(
			null,
		);
		const [files, setFiles] = useState<File[]>([]);

		const updateLoading = (loading: boolean) => {
			setIsLoading(loading);
			onLoadingChange?.(loading);
		};

		const submitForm = async () => {
			let embeddingsResponse:
				| Awaited<ReturnType<typeof actions.run>>
				| undefined;
			try {
				if (!name.trim()) {
					toast.error(t("validation:nameRequired"));
					return;
				}

				let embedderId = showEmbeddingOptions
					? embeddingEngine?.engine_id
					: defaultEmbedderId;
				if (!embedderId && !showEmbeddingOptions) {
					const res = await actions.run<[Engine[]]>(
						`MyEngines(engineTypes=["MODEL"], metaFilters=[{"tag":"embeddings"}], limit=[1], offset=[0]);`,
					);
					embedderId = res.pixelReturn[0].output[0]?.engine_id;
				}
				if (!embedderId) {
					toast.error(t("validation:embeddingRequired"));
					return;
				}

				if (files.length === 0) {
					toast.error(t("validation:filesRequired"));
					return;
				}

				if (!description) {
					toast.error(t("validation:descriptionRequired"));
					return;
				}

				updateLoading(true);

				const createVectorEngine = await actions.run<
					[
						{
							engine_id: string;
						},
					]
				>(`CreateVectorDatabaseEngine(
				database=["${name}"],
				conDetails=[{"VECTOR_TYPE": "FAISS", "EMBEDDER_ENGINE_ID": "${embedderId}","DESCRIPTION":"${description}","TAGS":""}]
			);`);

				const engineId =
					createVectorEngine.pixelReturn[0].output.engine_id;
				if (!engineId) {
					throw new Error(t("notifications:knowledge.createError"));
				}

				const uploaded = await actions.upload(files, "");

				const filePaths = uploaded
					.map(({ fileLocation }) => `"${fileLocation}"`)
					.join(", ");

				embeddingsResponse = await actions.run<
					[
						{
							engine_id: string;
						},
					]
				>(`CreateEmbeddingsFromDocuments(
				engine=["${engineId}"],
				filePaths=[${filePaths}]
			);`);

				if (runMCP) {
					await actions.run<[{ success: boolean }]>(
						`MakeEngineMCP("${engineId}");`,
					);
				}

				toast.success(
					t("notifications:knowledge.createSuccess", { name }),
				);

				onSuccess({
					type: "VECTOR",
					id: engineId,
					name: name,
				});
			} catch (e) {
				console.log(embeddingsResponse?.pixelReturn[0]?.output);
				toast.error(e.message);
			} finally {
				updateLoading(false);
			}
		};

		return (
			<form
				id={formId}
				onSubmit={(e) => {
					e.preventDefault();
					submitForm();
				}}
			>
				<FieldGroup>
					<Field>
						<FieldLabel>{t("knowledge:form.nameLabel")}</FieldLabel>
						<NewEngineInput
							value={name}
							onChange={(v) => setName(v)}
							disabled={isLoading}
							required
						/>
					</Field>
					<Field>
						<FieldLabel>
							{t("knowledge:form.descriptionLabel")}
						</FieldLabel>
						<Textarea
							placeholder={t(
								"knowledge:form.descriptionPlaceholder",
							)}
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							disabled={isLoading}
							required
						/>
					</Field>

					{showEmbeddingOptions && (
						<Field>
							<FieldLabel>
								{t("knowledge:form.embeddingLabel")}
							</FieldLabel>
							<div className="rounded-md border border-input bg-transparent px-1 py-1 shadow-xs dark:bg-input/30">
								<EngineSelect
									className="ml-0 w-full max-w-none justify-start"
									name={
										embeddingEngine?.engine_display_name ||
										embeddingEngine?.engine_name ||
										""
									}
									value={embeddingEngine?.engine_id || ""}
									engineTypes={["MODEL"]}
									metaFilters={[{ tag: "embeddings" }]}
									onChange={(e) => setEmbeddingEngine(e)}
									showEngineId
									showEngineIcon
								/>
							</div>
						</Field>
					)}

					<Field>
						<FieldLabel>
							{t("knowledge:form.filesLabel")}
						</FieldLabel>
						<Input
							placeholder={t("common:placeholders.uploadFiles")}
							type="file"
							multiple
							accept=".pdf,.txt,.docx,.doc,.md"
							onChange={(e) => {
								const files = e.target.files;
								if (files) {
									setFiles(Array.from(files));
								}
							}}
							disabled={isLoading}
							required
						/>
						{files.length > 0 ? (
							<div className="flex flex-row items-center gap-2 pt-4">
								{files.map((f, fIdx) => {
									const fileKey = `${f.name}-${f.size}-${f.lastModified}`;
									return (
										<Tooltip key={fileKey}>
											<TooltipTrigger asChild>
												<div className="group relative flex size-22 cursor-pointer flex-row items-center justify-center overflow-hidden border border-border bg-muted">
													<FileIcon className="size-6 text-muted-foreground" />
													<div className="absolute top-0 right-0 z-10 hidden group-hover:inline-flex">
														<Button
															variant="ghost"
															size="icon-sm"
															onClick={() => {
																const updated =
																	[...files];
																updated.splice(
																	fIdx,
																	1,
																);
																setFiles(
																	updated,
																);
															}}
														>
															<XIcon />
														</Button>
													</div>
												</div>
											</TooltipTrigger>
											<TooltipContent>
												{f.name}
											</TooltipContent>
										</Tooltip>
									);
								})}
							</div>
						) : null}
					</Field>
				</FieldGroup>
			</form>
		);
	});
