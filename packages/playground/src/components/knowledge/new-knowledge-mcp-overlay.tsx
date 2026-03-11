import { FileIcon, XIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
import { type Engine, EngineSelect, NewEngineInput } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Field,
	FieldGroup,
	FieldLabel,
	Input,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
} from "@semoss/ui/next";
import { useRoot } from "@/hooks";
import type { MCPConfig } from "@/types";

interface NewKnowledgeMCPOverlayProps {
	/** Open */
	open: boolean;

	/** Callback triggered when the tool model is closed */
	onClose: (knowledge?: MCPConfig) => void;
}

export const NewKnowledgeOverlay: React.FC<NewKnowledgeMCPOverlayProps> =
	observer((props) => {
		const { open, onClose } = props;
		const { actions } = useInsight();
		const { root } = useRoot();
		const { t } = useTranslation([
			"knowledge",
			"validation",
			"notifications",
			"common",
		]);

		const [isLoading, setIsLoading] = useState(false);
		const [name, setName] = useState("");
		const [description, setDescription] = useState("");
		const [embeddingEngine, setEmbeddingEngine] = useState<Engine | null>(
			null,
		);
		const [files, setFiles] = useState<File[]>([]);
		const showEmbeddingOptions = root.theme.allowEmbeddingOptions !== false;
		const defaultEmbedderId = root.theme.defaultEmbedderId ?? "";
		const runMCP = root.theme.enableKnowledgeMCP !== false;

		const [tagInput, setTagInput] = useState("");
		const [tags, setTags] = useState<string[]>([]);

		/**
		 * Reset the form
		 */
		const resetForm = () => {
			setName("");
			setDescription("");
			setFiles([]);
			onClose();
		};
		/**
		 * Submit the form
		 * @returns
		 */
		const submitForm = async () => {
			try {
				if (!name.trim()) {
					toast.error(t("validation:nameRequired"));
					return;
				}

				let embedderId = showEmbeddingOptions
					? embeddingEngine?.app_id
					: defaultEmbedderId;
				if (!embedderId && !showEmbeddingOptions) {
					const res = await actions.run<[Engine[]]>(
						`MyEngines(engineTypes=["MODEL"], metaFilters=[{"tag":"embeddings"}], limit=[1], offset=[0]);`,
					);
					embedderId = res.pixelReturn[0].output[0]?.app_id;
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
				const allowedExtensions = [
					"pdf",
					"doc",
					"docx",
					"txt",
					"csv",
					"ppt",
					"pptx",
				];
				const rejectedFiles = files.filter((file) => {
					const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
					return !allowedExtensions.includes(ext);
				});

				if (rejectedFiles.length > 0) {
					rejectedFiles.forEach((file) => {
						toast.error(
							`${file.name} could not be added — unsupported file type`,
						);
					});

					const validFiles = files.filter((file) => {
						const ext =
							file.name.split(".").pop()?.toLowerCase() ?? "";
						return allowedExtensions.includes(ext);
					});
					if (validFiles.length === 0) return;
					setFiles(validFiles);
					return;
				}

				setIsLoading(true);

				// create the base vector engine
				const createVectorEngine = await actions.run<
					[
						{
							database_id: string;
						},
					]
				>(`CreateVectorDatabaseEngine(
				database=["${name}"],
				conDetails=[{"VECTOR_TYPE": "FAISS", "EMBEDDER_ENGINE_ID": "${embedderId}","DESCRIPTION":"${description}","TAGS":"${tags.join("|")}"}]
			);`);

				const engineId =
					createVectorEngine.pixelReturn[0].output.database_id;
				if (!engineId) {
					throw new Error(t("notifications:knowledge.createError"));
				}

				// upload the files
				const uploaded = await actions.upload(files, "");

				// create the embeddings
				const filePaths = uploaded
					.map(({ fileLocation }) => `"${fileLocation}"`)
					.join(", ");

				await actions.run<
					[
						{
							database_id: string;
						},
					]
				>(`CreateEmbeddingsFromDocuments(
				engine=["${engineId}"],
				filePaths=[${filePaths}]
			);`);

				if (runMCP) {
					await actions.run<
						[
							{
								success: boolean;
							},
						]
					>(`MakeEngineMCP("${engineId}");`);
				}

				if (tags.length > 0) {
					await actions.run<[boolean]>(
						`SetEngineMetadata(engine=["${engineId}"],meta=[{"tag":["${tags}"]}]);`,
					);
				}
				// Success
				toast.success(
					t("notifications:knowledge.createSuccess", { name }),
				);

				onClose({
					type: "VECTOR",
					id: engineId,
					name: name,
				});
			} catch (e) {
				toast.error(e.message);
			} finally {
				setIsLoading(false);
			}
		};

		const _handleTagKeyDown = (
			e: React.KeyboardEvent<HTMLInputElement>,
		) => {
			if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
				e.preventDefault();
				const newTag = tagInput.trim().replace(/,$/, "");
				if (newTag && !tags.includes(newTag)) {
					setTags((prev) => [...prev, newTag]);
				}
				setTagInput("");
			}
			if (e.key === "Backspace" && !tagInput && tags.length > 0) {
				setTags((prev) => prev.slice(0, -1));
			}
		};

		const _removeTag = (tagToRemove: string) => {
			setTags((prev) => prev.filter((t) => t !== tagToRemove));
		};

		return (
			<Dialog open={open} onOpenChange={() => resetForm()}>
				<DialogContent
					className="w-full sm:max-w-4xl"
					aria-describedby={t("knowledge:newSource.title")}
				>
					<DialogHeader>
						<DialogTitle>
							{t("knowledge:newSource.title")}
						</DialogTitle>
						<DialogDescription>
							{t("knowledge:newSource.description")}
						</DialogDescription>
					</DialogHeader>

					<form
						onSubmit={(e) => {
							e.preventDefault();
							submitForm();
						}}
					>
						<FieldGroup>
							<Field>
								<FieldLabel>
									{t("knowledge:form.nameLabel")}
								</FieldLabel>
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
									onChange={(e) =>
										setDescription(e.target.value)
									}
									disabled={isLoading}
									required
								/>
							</Field>
							<Field>
								<FieldLabel>Tags</FieldLabel>
								<div
									className={`flex min-h-[40px] flex-wrap gap-1 rounded-md border bg-background p-2 ${isLoading ? "pointer-events-none opacity-50" : ""}`}
								>
									{tags.map((t) => (
										<span
											key={t}
											className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground text-xs"
										>
											{t}
											<button
												type="button"
												onClick={() =>
													setTags((prev) =>
														prev.filter(
															(x) => x !== t,
														),
													)
												}
												className="leading-none hover:text-destructive"
											>
												×
											</button>
										</span>
									))}
									<input
										placeholder={
											tags.length === 0
												? "e.g. MCP (Enter or comma to add)"
												: ""
										}
										value={tagInput}
										onChange={(e) =>
											setTagInput(e.target.value)
										}
										onKeyDown={(e) => {
											if (
												(e.key === "Enter" ||
													e.key === ",") &&
												tagInput.trim()
											) {
												e.preventDefault();
												const newTag = tagInput
													.trim()
													.replace(/,$/, "");
												if (
													newTag &&
													!tags.includes(newTag)
												) {
													setTags((prev) => [
														...prev,
														newTag,
													]);
												}
												setTagInput("");
											}
											if (
												e.key === "Backspace" &&
												!tagInput &&
												tags.length > 0
											) {
												setTags((prev) =>
													prev.slice(0, -1),
												);
											}
										}}
										disabled={isLoading}
										className="min-w-[160px] flex-1 bg-transparent text-sm outline-none"
									/>
								</div>
							</Field>

							{showEmbeddingOptions && (
								<Field>
									<FieldLabel>
										{t("knowledge:form.embeddingLabel")}
									</FieldLabel>
									<EngineSelect
										name={embeddingEngine?.app_name || ""}
										value={embeddingEngine?.app_id || ""}
										engineTypes={["MODEL"]}
										metaFilters={[{ tag: "embeddings" }]}
										onChange={(e) => setEmbeddingEngine(e)}
									/>
								</Field>
							)}

							<Field>
								<FieldLabel>
									{t("knowledge:form.filesLabel")}
								</FieldLabel>
								<Input
									placeholder={t(
										"common:placeholders.uploadFiles",
									)}
									type="file"
									multiple
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
									<div className="pt-4">
										<div className="mb-2 text-muted-foreground text-sm">
											{files.length} file
											{files.length > 1 ? "s" : ""}{" "}
											selected
										</div>
										<div className="max-h-48 overflow-y-auto rounded-md border border-border bg-muted/30">
											<div className="grid grid-cols-1 gap-1 p-2">
												{files.map((f, fIdx) => {
													const fileKey = `${f.name}-${f.size}-${f.lastModified}`;
													const fileSizeKB =
														Math.round(
															f.size / 1024,
														);

													return (
														<div
															key={fileKey}
															className="group flex items-center justify-between gap-2 rounded px-2 py-1.5 hover:bg-muted/50"
														>
															<div className="flex min-w-0 flex-1 items-center gap-2">
																<FileIcon className="size-4 flex-shrink-0 text-muted-foreground" />
																<div className="min-w-0 flex-1">
																	<Tooltip>
																		<TooltipTrigger
																			asChild
																		>
																			<div className="truncate text-sm">
																				{
																					f.name
																				}
																			</div>
																		</TooltipTrigger>
																		<TooltipContent>
																			{
																				f.name
																			}
																		</TooltipContent>
																	</Tooltip>
																	<div className="text-muted-foreground text-xs">
																		{fileSizeKB <
																		1024
																			? `${fileSizeKB} KB`
																			: `${Math.round((fileSizeKB / 1024) * 10) / 10} MB`}
																	</div>
																</div>
															</div>
															<Button
																variant="ghost"
																size="icon-sm"
																className="flex-shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
																onClick={() => {
																	const updated =
																		[
																			...files,
																		];
																	updated.splice(
																		fIdx,
																		1,
																	);
																	setFiles(
																		updated,
																	);
																}}
															>
																<XIcon className="size-3" />
															</Button>
														</div>
													);
												})}
											</div>
										</div>
									</div>
								) : null}
							</Field>
						</FieldGroup>
					</form>

					<DialogFooter>
						<Button
							variant="ghost"
							disabled={isLoading}
							onClick={() => {
								resetForm();
							}}
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							variant="default"
							disabled={isLoading}
							onClick={() => submitForm()}
						>
							{isLoading ? (
								<Spinner />
							) : (
								t("common:buttons.create")
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		);
	});
