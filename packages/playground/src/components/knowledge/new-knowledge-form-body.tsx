import { observer } from "mobx-react-lite";
import { useEffect, useId, useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { useInsight } from "@semoss/sdk/react";
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
import { FilePreviewGrid } from "@/components/common/file-preview-grid";
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

		const id = useId();
		const form = useForm({
			resolver: zodResolver(
				z.object({
					name: z
						.string()
						.trim()
						.min(1, t("validation:nameRequired")),
					description: z
						.string()
						.trim()
						.min(1, t("validation:descriptionRequired")),
				}),
			),
			defaultValues: { name: "", description: "" },
		});
		const isLoading = form.formState.isSubmitting;
		const [embeddingEngine, setEmbeddingEngine] = useState<Engine | null>(
			null,
		);
		const [files, setFiles] = useState<File[]>([]);

		useEffect(() => {
			onLoadingChange?.(isLoading);
		}, [isLoading, onLoadingChange]);

		const submitForm = async ({
			name,
			description,
		}: {
			name: string;
			description: string;
		}) => {
			form.clearErrors("root.server");
			let engineId: string;
			try {
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

				const createVectorEngine = await actions.run<
					[{ engine_id: string }]
				>(`CreateVectorDatabaseEngine(
				database=["${name}"],
				conDetails=[{"VECTOR_TYPE": "FAISS", "EMBEDDER_ENGINE_ID": "${embedderId}","DESCRIPTION":"${description}","TAGS":""}]
			);`);

				engineId = createVectorEngine.pixelReturn[0].output.engine_id;
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
			} catch (e) {
				form.setError("root.server", {
					message:
						e instanceof Error
							? e.message
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
				onSubmit={submitForm}
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
					{showEmbeddingOptions && (
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
								onChange={(e) => setEmbeddingEngine(e)}
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
							onChange={(e) => {
								const next = e.target.files;
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
	},
);
