import { useState } from "react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormTextarea,
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
import { useToolWorkbench } from "../tool-workbench.context";
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
	const form = useForm<ApprovalValues>({
		resolver: zodResolver(approvalSchema),
		defaultValues: {
			arguments: JSON.stringify(
				action.arguments ?? tool.arguments,
				null,
				2,
			),
		},
	});
	const { errors, isSubmitting } = form.formState;
	const [isRejecting, setIsRejecting] = useState(false);
	const isUpdating = isSubmitting || isRejecting;

	const handleSubmit = async (values: ApprovalValues): Promise<void> => {
		const parameters = parseArguments(values.arguments);
		if (!parameters) {
			form.setError("arguments", {
				type: "validate",
				message: "Enter a valid JSON object.",
			});
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
					<FormTextarea
						name="arguments"
						label="Tool arguments"
						description="Edit the JSON object before approving, or leave it unchanged."
						rows={14}
						spellCheck={false}
						disabled={isUpdating}
						className="[&_[data-slot=field-description]]:text-xs [&_[data-slot=field-error]]:text-xs [&_[data-slot=field-label]]:text-xs [&_textarea]:font-mono [&_textarea]:text-xs"
					/>
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
					{isUpdating ? "Updating…" : "Approve and run"}
				</Button>
			</footer>
		</Form>
	);
}
