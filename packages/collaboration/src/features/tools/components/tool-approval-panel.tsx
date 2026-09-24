import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormField,
	FormTextarea,
	Muted,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import type { PendingToolApproval } from "@/features/rooms/types/room";
import {
	supportsToolFields,
	useToolDefinition,
	validateToolArguments,
} from "../api/use-tool-definition";
import { useToolWorkbench } from "../tool-workbench.context";
import { ToolArgumentField } from "./tool-argument-field";
import { ToolUiFrame } from "./tool-ui-frame";

function parseArguments(value: string): Record<string, unknown> | null {
	try {
		const parsed: unknown = JSON.parse(value);
		return parsed !== null &&
			typeof parsed === "object" &&
			!Array.isArray(parsed)
			? (parsed as Record<string, unknown>)
			: null;
	} catch {
		return null;
	}
}

const approvalSchema = z.object({
	arguments: z.string().refine((value) => parseArguments(value) !== null, {
		message: "Enter a valid JSON object.",
	}),
});

type ApprovalValues = z.infer<typeof approvalSchema>;

interface ToolApprovalPanelProps {
	tool: ConversationTool;
	action: PendingToolApproval;
}

/** Review, optionally edit, and resolve one paused playground tool call. */
export function ToolApprovalPanel({ tool, action }: ToolApprovalPanelProps) {
	const { onApproveTool, onRejectTool, closeTool } = useToolWorkbench();
	const definition = useToolDefinition(tool);
	const [isJsonEditor, setIsJsonEditor] = useState(false);
	const form = useForm<ApprovalValues>({
		resolver: zodResolver(approvalSchema),
		defaultValues: {
			arguments: JSON.stringify(
				action.requiresResponse
					? {}
					: (action.arguments ?? tool.arguments),
				null,
				2,
			),
		},
	});
	const { errors, isSubmitting } = form.formState;
	const [isRejecting, setIsRejecting] = useState(false);
	const isUpdating =
		isSubmitting || isRejecting || action.isDeciding === true;
	const parameters = parseArguments(form.watch("arguments"));
	const hasFields =
		!!definition.schema &&
		parameters !== null &&
		supportsToolFields(definition.schema, parameters);

	const handleSubmit = async (values: ApprovalValues): Promise<void> => {
		if (action.isDeciding || isRejecting) return;
		const parameters = parseArguments(values.arguments);
		if (!parameters) {
			form.setError("arguments", {
				type: "validate",
				message: "Enter a valid JSON object.",
			});
			return;
		}

		const validationError =
			definition.schema && hasFields
				? validateToolArguments(definition.schema, parameters)
				: null;
		if (validationError) {
			form.setError("arguments", { message: validationError });
			return;
		}
		try {
			await onApproveTool(action, parameters);
			closeTool(tool.id);
		} catch (error) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Could not approve this tool call.",
			});
		}
	};

	const handleReject = async (): Promise<void> => {
		if (isUpdating) return;
		setIsRejecting(true);
		try {
			await onRejectTool(action);
			closeTool(tool.id);
		} catch (error) {
			form.setError("root.server", {
				type: "server",
				message:
					error instanceof Error
						? error.message
						: "Could not reject this tool call.",
			});
		} finally {
			setIsRejecting(false);
		}
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isUpdating}
			className="flex min-h-0 flex-1 flex-col"
		>
			<Tabs
				defaultValue={action.uiUrl ? "tool" : "inputs"}
				className="min-h-0 flex-1 gap-0"
			>
				<div className="border-b px-3 py-2">
					<TabsList>
						{action.uiUrl && (
							<TabsTrigger value="tool" className="text-xs">
								Tool UI
							</TabsTrigger>
						)}
						<TabsTrigger value="inputs" className="text-xs">
							Inputs
						</TabsTrigger>
					</TabsList>
				</div>
				{action.uiUrl && (
					<TabsContent
						value="tool"
						className="min-h-0 overflow-hidden"
					>
						<ToolUiFrame
							key={action.uiUrl}
							tool={tool}
							url={action.uiUrl}
						/>
					</TabsContent>
				)}
				<TabsContent
					value="inputs"
					className="min-h-0 overflow-auto p-3"
				>
					{definition.error && (
						<Muted className="mb-3 text-xs">
							{definition.error}
						</Muted>
					)}
					{definition.isLoading && (
						<Muted className="mb-3 text-xs">
							Loading tool fields… JSON arguments remain
							available.
						</Muted>
					)}
					{definition.description && (
						<Muted className="mb-3 text-xs">
							{definition.description}
						</Muted>
					)}
					{hasFields && (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="mb-3"
							disabled={isUpdating}
							onClick={() =>
								setIsJsonEditor((current) => !current)
							}
						>
							{isJsonEditor ? "Use form fields" : "Edit JSON"}
						</Button>
					)}
					{hasFields && !isJsonEditor && definition.schema ? (
						<FormField
							control={form.control}
							name="arguments"
							render={({ field, fieldState }) => (
								<div className="space-y-4">
									{Object.entries(
										definition.schema?.properties ?? {},
									).map(([name, property]) => (
										<ToolArgumentField
											key={name}
											name={name}
											property={property}
											value={parameters?.[name]}
											required={
												definition.schema?.required.includes(
													name,
												) ?? false
											}
											disabled={isUpdating}
											onChange={(value) => {
												const next = { ...parameters };
												if (value === undefined)
													delete next[name];
												else next[name] = value;
												field.onChange(
													JSON.stringify(
														next,
														null,
														2,
													),
												);
											}}
										/>
									))}
									{fieldState.error && (
										<Alert variant="destructive">
											<AlertDescription>
												{fieldState.error.message}
											</AlertDescription>
										</Alert>
									)}
								</div>
							)}
						/>
					) : (
						<FormTextarea
							name="arguments"
							label="Tool arguments"
							description="Review or edit the JSON object before approving."
							rows={14}
							spellCheck={false}
							disabled={isUpdating}
							className="[&_textarea]:font-mono [&_textarea]:text-xs"
						/>
					)}
				</TabsContent>
			</Tabs>

			{errors.root?.server?.message && (
				<Alert variant="destructive" className="m-3 mt-0 text-xs">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}

			<footer className="flex flex-wrap justify-end gap-2 border-t p-3">
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={isUpdating}
					onClick={handleReject}
				>
					Reject
				</Button>
				<Button type="submit" size="sm" disabled={isUpdating}>
					{isUpdating && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					{isUpdating
						? "Updating…"
						: action.requiresResponse
							? "Send response"
							: "Approve and run"}
				</Button>
			</footer>
		</Form>
	);
}
