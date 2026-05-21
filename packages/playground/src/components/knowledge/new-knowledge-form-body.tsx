import { FileIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
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

export interface NewKnowledgeFormBodyProps {
	/**
	 * Form id. An external submit button can target this form via
	 * `<button type="submit" form={formId}>` so the same body works inside
	 * a Dialog footer or inside a routed overlay view.
	 */
	formId: string;

	/** Fired after the knowledge store is created and embeddings have run. */
	onSuccess: (knowledge: MCPConfig) => void;

	/**
	 * Fired whenever the form's internal loading state changes. Parents use
	 * this to disable their close affordances and footer buttons while the
	 * pixel calls are in flight.
	 */
	onLoadingChange?: (loading: boolean) => void;
}

/**
 * Form fields + create flow for a new VECTOR knowledge store. Renders only the
 * field grid; chrome (title, footer buttons) is provided by the parent.
 */
export const NewKnowledgeFormBody = observer(
	({ formId, onSuccess, onLoadingChange }: NewKnowledgeFormBodyProps) => {
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

		useEffect(() => {
			onLoadingChange?.(isLoading);
		}, [isLoading, onLoadingChange]);

		const submitForm = async () => {
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

				setIsLoading(true);

				const createVectorEngine = await actions.run<
					[{ engine_id: string }]
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

				await actions.run<[{ engine_id: string }]>(
					`CreateEmbeddingsFromDocuments(
				engine=["${engineId}"],
				filePaths=[${filePaths}]
			);`,
				);

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
				toast.error(
					e instanceof Error
						? e.message
						: t("notifications:knowledge.createError"),
				);
			} finally {
				setIsLoading(false);
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
									className="w-full max-w-none justify-start"
									name={
										embeddingEngine?.engine_display_name ||
										embeddingEngine?.engine_name ||
										""
									}
									value={embeddingEngine?.engine_id || ""}
									engineTypes={["MODEL"]}
									metaFilters={[{ tag: "embeddings" }]}
									onChange={(e) => setEmbeddingEngine(e)}
									popoverContentProps={{
										align: "start",
									}}
									showEngineId
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
								const next = e.target.files;
								if (next) {
									setFiles(Array.from(next));
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
	},
);
