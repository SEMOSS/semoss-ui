import { BotIcon, LayoutTemplateIcon, SendIcon } from "lucide-react";
import { useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { type Project, ProjectSelect } from "@semoss/shared";
import {
	Button,
	Field,
	FieldLabel,
	Form,
	FormField,
	Spinner,
	Textarea,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { createAppFromTemplate } from "@/api";
import type { TemplateChatHandoffState } from "@/types";

const MAX_WORKSPACE_NAME_LENGTH = 80;

const schema = z.object({
	agentId: z.string().min(1, "Select an agent"),
	templateId: z.string().min(1, "Select a template"),
	prompt: z.string().trim().min(1, "Enter a prompt"),
});

type FormValues = z.infer<typeof schema>;

/**
 * Build a concise workspace name from the selected template and prompt.
 * @param templateName - Display name of the source template.
 * @param prompt - User prompt that starts the workspace.
 * @return A normalized name capped at the backend-safe display length.
 */
export const createNewAppWorkspaceName = (
	templateName: string,
	prompt: string,
): string => {
	const normalizedTemplate = templateName.replace(/\s+/g, " ").trim();
	const normalizedPrompt = prompt.replace(/\s+/g, " ").trim();
	const baseName = `${normalizedTemplate} - ${normalizedPrompt}`;
	return baseName.slice(0, MAX_WORKSPACE_NAME_LENGTH).trim();
};

/**
 * Playground-style prompt composer that creates a CODE app from a template.
 * @return Agent and template context controls with a prompt input.
 */
export const NewAppChatComposer = () => {
	const navigate = useNavigate();
	const agentId = useId();
	const templateId = useId();
	const promptId = useId();
	const errorId = useId();
	const [selectedAgent, setSelectedAgent] = useState<Project | null>(null);
	const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(
		null,
	);
	const [submitError, setSubmitError] = useState("");

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			agentId: "",
			templateId: "",
			prompt: "",
		},
	});

	const handleSubmit = async (values: FormValues) => {
		if (!selectedAgent || !selectedTemplate) {
			return;
		}

		setSubmitError("");
		try {
			const agentName =
				selectedAgent.project_display_name ||
				selectedAgent.project_name;
			const templateName =
				selectedTemplate.project_display_name ||
				selectedTemplate.project_name;
			const projectId = await createAppFromTemplate({
				name: createNewAppWorkspaceName(templateName, values.prompt),
				templateId: selectedTemplate.project_id,
				isGlobal: false,
			});
			const state: TemplateChatHandoffState = {
				prompt: values.prompt.trim(),
				agent: {
					workspace_id: selectedAgent.project_id,
					name: agentName,
				},
			};

			navigate(`/app/${projectId}/edit`, { state });
		} catch (error) {
			console.error(error);
			const message =
				error instanceof Error
					? error.message
					: "Unable to create the workspace. Please try again.";
			setSubmitError(message);
			toast.error(message);
		}
	};

	const validationError =
		form.formState.errors.agentId?.message ||
		form.formState.errors.templateId?.message ||
		form.formState.errors.prompt?.message;

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			className="mx-auto w-full max-w-4xl px-2 py-12 sm:px-4 md:py-16"
		>
			<div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-[color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
				<FormField
					control={form.control}
					name="prompt"
					render={({ field, fieldState }) => (
						<Field
							data-invalid={Boolean(fieldState.error)}
							className="relative gap-0"
						>
							<FieldLabel htmlFor={promptId} className="sr-only">
								Prompt
							</FieldLabel>
							<Textarea
								{...field}
								id={promptId}
								aria-describedby={
									validationError || submitError
										? errorId
										: undefined
								}
								aria-invalid={Boolean(fieldState.error)}
								autoFocus
								placeholder="Describe what you want to build"
								disabled={form.formState.isSubmitting}
								className="min-h-36 resize-none rounded-none border-0 bg-card px-5 py-6 text-base shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-card"
								onKeyDown={(event) => {
									if (
										event.key === "Enter" &&
										!event.shiftKey &&
										!event.nativeEvent.isComposing
									) {
										event.preventDefault();
										void form.handleSubmit(handleSubmit)();
									}
								}}
							/>
						</Field>
					)}
				/>

				<div className="flex min-w-0 items-center gap-2 border-border border-t bg-muted/50 p-3">
					<div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
						<FormField
							control={form.control}
							name="agentId"
							render={({ fieldState }) => (
								<Field
									data-invalid={Boolean(fieldState.error)}
									className="min-w-0 max-w-44 gap-0"
								>
									<FieldLabel
										htmlFor={agentId}
										className="sr-only"
									>
										Agent
									</FieldLabel>
									<div className="relative min-w-0">
										<BotIcon
											aria-hidden="true"
											className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5"
										/>
										<ProjectSelect
											id={agentId}
											aria-describedby={
												validationError || submitError
													? errorId
													: undefined
											}
											aria-invalid={Boolean(
												fieldState.error,
											)}
											name={
												selectedAgent?.project_display_name ||
												selectedAgent?.project_name ||
												"Select agent"
											}
											value={
												selectedAgent?.project_id || ""
											}
											projectTypes={["WORKSPACE"]}
											disabled={
												form.formState.isSubmitting
											}
											className="h-8 min-w-0 border-border bg-background ps-8 text-xs shadow-none"
											onChange={(agent) => {
												setSelectedAgent(agent);
												form.setValue(
													"agentId",
													agent.project_id,
													{
														shouldValidate: true,
													},
												);
											}}
										/>
									</div>
								</Field>
							)}
						/>

						<FormField
							control={form.control}
							name="templateId"
							render={({ fieldState }) => (
								<Field
									data-invalid={Boolean(fieldState.error)}
									className="min-w-0 max-w-44 gap-0"
								>
									<FieldLabel
										htmlFor={templateId}
										className="sr-only"
									>
										Template
									</FieldLabel>
									<div className="relative min-w-0">
										<LayoutTemplateIcon
											aria-hidden="true"
											className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-2.5 z-10 size-3.5"
										/>
										<ProjectSelect
											id={templateId}
											aria-describedby={
												validationError || submitError
													? errorId
													: undefined
											}
											aria-invalid={Boolean(
												fieldState.error,
											)}
											name={
												selectedTemplate?.project_display_name ||
												selectedTemplate?.project_name ||
												"Select template"
											}
											value={
												selectedTemplate?.project_id ||
												""
											}
											projectTypes={["CODE"]}
											onlyTemplates
											disabled={
												form.formState.isSubmitting
											}
											className="h-8 min-w-0 border-border bg-background ps-8 text-xs shadow-none"
											onChange={(template) => {
												setSelectedTemplate(template);
												form.setValue(
													"templateId",
													template.project_id,
													{ shouldValidate: true },
												);
											}}
										/>
									</div>
								</Field>
							)}
						/>
					</div>

					<Tooltip>
						<TooltipTrigger asChild>
							<span className="shrink-0">
								<Button
									type="submit"
									variant="default"
									size="icon-sm"
									aria-label="Create workspace and send prompt"
									disabled={form.formState.isSubmitting}
								>
									{form.formState.isSubmitting ? (
										<Spinner />
									) : (
										<SendIcon aria-hidden="true" />
									)}
								</Button>
							</span>
						</TooltipTrigger>
						<TooltipContent>
							Create workspace and send prompt
						</TooltipContent>
					</Tooltip>
				</div>
			</div>

			{validationError || submitError ? (
				<p
					id={errorId}
					className="mt-2 text-destructive text-sm"
					role="alert"
				>
					{validationError || submitError}
				</p>
			) : null}
		</Form>
	);
};
