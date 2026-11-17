import { useEffect, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { throwOnPixelErrors } from "@semoss/sdk";
import { useSessionInsight } from "@semoss/sdk/react";
import { type Engine, EngineSelect, NewEngineInput } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	Form,
	FormField,
	FormTextarea,
	Input,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { MCPConfig } from "../../types";
import { useChatConfig } from "../chat/config/use-chat-config";
import { FilePreviewGrid } from "../conversation/attachments/file-preview-grid";

/** Props for {@link NewKnowledgeForm}. */
interface NewKnowledgeFormProps {
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
	onLoadingChange?: (isLoading: boolean) => void;
}

/**
 * Form fields and create flow for a new VECTOR knowledge store: it creates the
 * engine, uploads the files, embeds them, and, when the theme turns it on,
 * makes the engine an MCP. Renders only the field grid; chrome (title, footer
 * buttons) is provided by the parent.
 */
export const NewKnowledgeForm = ({
	formId,
	onSuccess,
	onLoadingChange,
}: NewKnowledgeFormProps) => {
	const { run, upload } = useSessionInsight();
	const { theme } = useChatConfig();
	const { t } = useTranslation([
		"knowledge",
		"validation",
		"notifications",
		"common",
	]);

	const shouldShowEmbeddingOptions =
		theme.featureFlags?.allowEmbeddingOptions;
	const defaultEmbedderId = theme.defaultEmbedderId ?? "";
	const shouldMakeMcp = theme.featureFlags?.enableKnowledgeMCP;

	const id = useId();
	const form = useForm({
		resolver: zodResolver(
			z.object({
				name: z.string().trim().min(1, t("validation:nameRequired")),
				description: z
					.string()
					.trim()
					.min(1, t("validation:descriptionRequired")),
			}),
		),
		defaultValues: { name: "", description: "" },
	});
	const isLoading = form.formState.isSubmitting;
	const [embeddingEngine, setEmbeddingEngine] = useState<Engine | null>(null);
	const [files, setFiles] = useState<File[]>([]);

	// the parent's buttons live outside the form, so it is told when to disable them
	useEffect(() => {
		onLoadingChange?.(isLoading);
	}, [isLoading, onLoadingChange]);

	/**
	 * Create the knowledge store from the validated fields. A failure is shown
	 * as the form's server error rather than thrown.
	 *
	 * @param values - The name and description entered.
	 */
	const handleSubmit = async ({
		name,
		description,
	}: {
		name: string;
		description: string;
	}) => {
		form.clearErrors("root.server");
		let engineId: string;
		try {
			let embedderId = shouldShowEmbeddingOptions
				? embeddingEngine?.engine_id
				: defaultEmbedderId;
			// with no embedder chosen or configured, use the first one the user has
			if (!embedderId && !shouldShowEmbeddingOptions) {
				const embedders = await run<[Engine[]]>(
					`MyEngines(engineTypes=["MODEL"], metaFilters=[{"tag":"embeddings"}], limit=[1], offset=[0]);`,
				).then(throwOnPixelErrors);
				embedderId = embedders.pixelReturn[0].output[0]?.engine_id;
			}
			if (!embedderId) {
				form.setError("root.server", {
					message: t("validation:embeddingRequired"),
				});
				return;
			}

			if (files.length === 0) {
				form.setError("root.server", {
					message: t("validation:filesRequired"),
				});
				return;
			}

			const created = await run<
				[{ engine_id: string }]
			>(`CreateVectorDatabaseEngine(
				catalogName=["${name}"],
				conDetails=[{"VECTOR_TYPE": "FAISS", "EMBEDDER_ENGINE_ID": "${embedderId}","DESCRIPTION":"${description}","TAGS":""}]
			);`).then(throwOnPixelErrors);

			engineId = created.pixelReturn[0].output.engine_id;
			if (!engineId) {
				throw new Error(t("notifications:knowledge.createError"));
			}

			const uploaded = await upload(files);

			const filePaths = uploaded
				.map(({ fileLocation }) => `"${fileLocation}"`)
				.join(", ");

			await run<[{ engine_id: string }]>(
				`CreateEmbeddingsFromDocuments(
				engine=["${engineId}"],
				filePaths=[${filePaths}]
			);`,
			).then(throwOnPixelErrors);

			if (shouldMakeMcp) {
				await run<[{ success: boolean }]>(
					`MakeEngineMCP("${engineId}");`,
				).then(throwOnPixelErrors);
			}
		} catch (error) {
			form.setError("root.server", {
				message:
					error instanceof Error
						? error.message
						: t("notifications:knowledge.createError"),
			});
			return;
		}
		toast.success(t("notifications:knowledge.createSuccess", { name }));
		onSuccess({ type: "VECTOR", id: engineId, name });
	};

	return (
		<Form
			form={form}
			id={formId}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isLoading}
		>
			{form.formState.errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{form.formState.errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<FieldGroup>
				<FormField
					control={form.control}
					name="name"
					render={({ field, fieldState }) => (
						<Field data-invalid={!!fieldState.error}>
							<FieldLabel htmlFor={`${id}-name`}>
								{t("knowledge:form.nameLabel")}
							</FieldLabel>
							<NewEngineInput
								value={field.value}
								onChange={field.onChange}
								inputProps={{
									id: `${id}-name`,
									ref: field.ref,
									onBlur: field.onBlur,
									name: field.name,
									"aria-invalid": !!fieldState.error,
									"aria-describedby": fieldState.error
										? `${id}-name-error`
										: undefined,
								}}
								disabled={isLoading}
								required
							/>
							{fieldState.error?.message && (
								<FieldError id={`${id}-name-error`}>
									{fieldState.error.message}
								</FieldError>
							)}
						</Field>
					)}
				/>
				<FormTextarea
					name="description"
					label={t("knowledge:form.descriptionLabel")}
					placeholder={t("knowledge:form.descriptionPlaceholder")}
					disabled={isLoading}
					required
				/>
				{shouldShowEmbeddingOptions && (
					<Field>
						<FieldLabel htmlFor={`${id}-embedding`}>
							{t("knowledge:form.embeddingLabel")}
						</FieldLabel>
						<EngineSelect
							id={`${id}-embedding`}
							disabled={isLoading}
							name={
								embeddingEngine?.engine_display_name ||
								embeddingEngine?.engine_name ||
								""
							}
							value={embeddingEngine?.engine_id || ""}
							engineTypes={["MODEL"]}
							metaFilters={[{ tag: "embeddings" }]}
							onChange={(engine) => setEmbeddingEngine(engine)}
							popoverContentProps={{
								align: "start",
							}}
							showEngineId
						/>
					</Field>
				)}

				<Field>
					<FieldLabel htmlFor={`${id}-files`}>
						{t("knowledge:form.filesLabel")}
					</FieldLabel>
					<Input
						id={`${id}-files`}
						placeholder={t("common:placeholders.uploadFiles")}
						type="file"
						multiple
						accept=".pdf,.txt,.docx,.doc,.md"
						onChange={(event) => {
							const next = event.target.files;
							if (next) {
								setFiles(Array.from(next));
							}
						}}
						disabled={isLoading}
						required
					/>
					<FilePreviewGrid
						files={files}
						onRemoveFile={(index) => {
							if (!isLoading)
								setFiles((current) =>
									current.filter((_, i) => i !== index),
								);
						}}
					/>
				</Field>
			</FieldGroup>
		</Form>
	);
};
