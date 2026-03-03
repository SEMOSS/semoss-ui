import { FileIcon, XIcon } from "lucide-react";
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
import type { MCPConfig } from "@/types";

interface NewKnowledgeMCPOverlayProps {
	/** Open */
	open: boolean;

	/** Callback triggered when the tool model is closed */
	onClose: (knowledge?: MCPConfig) => void;
}

export const NewKnowledgeOverlay: React.FC<NewKnowledgeMCPOverlayProps> = (
	props,
) => {
	const { open, onClose } = props;
	const { actions } = useInsight();
	const { t } = useTranslation([
		"knowledge",
		"validation",
		"notifications",
		"common",
	]);

	const [isLoading, setIsLoading] = useState(false);
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [embeddingEngine, setEmbeddingEngine] = useState<Engine | null>(null);
	const [files, setFiles] = useState<File[]>([]);
	const [tag, setTag] = useState("");

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

			if (!embeddingEngine) {
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

			// create the base vector engine
			const createVectorEngine = await actions.run<
				[
					{
						database_id: string;
					},
				]
			>(`CreateVectorDatabaseEngine(
				database=["${name}"],
				conDetails=[{"VECTOR_TYPE": "FAISS", "EMBEDDER_ENGINE_ID": "${embeddingEngine.app_id}","DESCRIPTION":"${description}","TAGS":""}]
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

			await actions.run<
				[
					{
						success: boolean;
					},
				]
			>(`MakeEngineMCP("${engineId}");`);

			if (tag.length > 0) {
				await actions.run<[boolean]>(
					`SetEngineMetadata(engine=["${engineId}"],meta=[{"tag":["${tag}"]}]);`,
				);
			}
			// Success
			toast.success(t("notifications:knowledge.createSuccess", { name }));

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

	return (
		<Dialog open={open} onOpenChange={() => resetForm()}>
			<DialogContent
				className="w-full sm:max-w-4xl"
				aria-describedby={t("knowledge:newSource.title")}
			>
				<DialogHeader>
					<DialogTitle>{t("knowledge:newSource.title")}</DialogTitle>
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
								onChange={(e) => setDescription(e.target.value)}
								disabled={isLoading}
								required
							/>
						</Field>

						<Field>
							<FieldLabel>Tag</FieldLabel>
							<Input
								placeholder="e.g. MCP"
								value={tag}
								onChange={(e) => setTag(e.target.value)}
								disabled={isLoading}
							/>
						</Field>

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
														<FileIcon className="size-6 text-muted-foreground" />{" "}
														<div className="absolute top-0 right-0 z-10 hidden group-hover:inline-flex">
															<Button
																variant="ghost"
																size={"icon-sm"}
																onClick={() => {
																	const updated =
																		[
																			...files,
																		];

																	// remove it
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
						{isLoading ? <Spinner /> : t("common:buttons.create")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
