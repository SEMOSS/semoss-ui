import { useRef, useState } from "react";
import type { ToolViewProps } from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	FormField,
	Muted,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { ConversationTool } from "@/features/messages/types/message";
import {
	findToolArgumentError,
	readToolInputSchema,
	readToolProperty,
	type ToolArgumentError,
} from "../api/use-tool-definition";
import { ToolValueField } from "./tool-value-field";

const schema = z.object({ arguments: z.record(z.string(), z.unknown()) });
type Values = z.infer<typeof schema>;

interface CollaborationToolApprovalProps extends ToolViewProps {
	/** Metadata from this exact call supplies its schema, without an MCP project lookup. */
	tool: ConversationTool | undefined;
}

/** Review and edit a pending action; opening a view never executes it. */
export function CollaborationToolApproval({
	tool,
	call,
	onApprove,
	onDecline,
}: CollaborationToolApprovalProps) {
	const definition = readToolInputSchema(
		tool?.metadata?.SMSS_TOOL_INPUT_SCHEMA,
	);
	const form = useForm<Values>({
		resolver: zodResolver(schema),
		defaultValues: { arguments: { ...call.arguments } },
	});
	const [isDeclining, setIsDeclining] = useState(false);
	const [areOptionalFieldsOpen, setAreOptionalFieldsOpen] = useState(false);
	const [fieldError, setFieldError] = useState<ToolArgumentError | null>(
		null,
	);
	const deciding = useRef(false);
	const isBusy = form.formState.isSubmitting || isDeclining;
	const names = [
		...new Set([
			...Object.keys(call.arguments),
			...(definition?.required ?? []),
			...Object.keys(definition?.properties ?? {}),
		]),
	];
	const error = form.formState.errors.root?.server?.message;
	const handleSubmit = async (values: Values): Promise<void> => {
		if (deciding.current) return;
		const invalid =
			definition && findToolArgumentError(definition, values.arguments);
		if (invalid) {
			if (
				!(invalid.path[0] in call.arguments) &&
				!definition?.required.includes(invalid.path[0])
			)
				setAreOptionalFieldsOpen(true);
			setFieldError(invalid);
			return;
		}
		setFieldError(null);
		deciding.current = true;
		try {
			await onApprove(values.arguments);
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "The action could not be approved. Try again.",
			});
		} finally {
			deciding.current = false;
		}
	};
	const handleDecline = async (): Promise<void> => {
		if (deciding.current) return;
		deciding.current = true;
		setIsDeclining(true);
		form.clearErrors();
		try {
			await onDecline();
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "The action could not be declined. Try again.",
			});
		} finally {
			deciding.current = false;
			setIsDeclining(false);
		}
	};
	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isBusy}
			className="flex min-w-0 flex-col gap-4"
		>
			<Muted className="text-sm">
				Review the details before approving. You can edit the proposed
				values.
			</Muted>
			<FormField
				control={form.control}
				name="arguments"
				render={({ field }) => {
					const renderField = (name: string) => (
						<ToolValueField
							key={name}
							name={name}
							property={readToolProperty(
								definition?.properties[name],
							)}
							value={field.value[name]}
							isRequired={definition?.required.includes(name)}
							isDisabled={isBusy}
							error={fieldError}
							onChange={(value) => {
								setFieldError(null);
								const updated = { ...field.value };
								if (value === undefined) delete updated[name];
								else updated[name] = value;
								field.onChange(updated);
							}}
						/>
					);
					const visible = names.filter(
						(name) =>
							name in call.arguments ||
							definition?.required.includes(name),
					);
					const optional = names.filter(
						(name) => !visible.includes(name),
					);
					return (
						<div className="min-w-0 space-y-4">
							{visible.map(renderField)}
							{optional.length > 0 && (
								<details
									open={areOptionalFieldsOpen}
									onToggle={(event) =>
										setAreOptionalFieldsOpen(
											event.currentTarget.open,
										)
									}
								>
									<summary className="cursor-pointer rounded-sm py-2 font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
										More fields
									</summary>
									<div className="mt-3 space-y-4">
										{optional.map(renderField)}
									</div>
								</details>
							)}
						</div>
					);
				}}
			/>
			{error && (
				<Alert variant="destructive">
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}
			<div className="flex flex-wrap justify-end gap-2 border-border border-t pt-3">
				<Button
					type="button"
					variant="outline"
					disabled={isBusy}
					onClick={() => void handleDecline()}
				>
					{isDeclining ? "Declining…" : "Decline"}
				</Button>
				<Button type="submit" disabled={isBusy}>
					{form.formState.isSubmitting && (
						<Spinner aria-hidden="true" className="size-4" />
					)}
					{form.formState.isSubmitting ? "Approving…" : "Approve"}
				</Button>
			</div>
		</Form>
	);
}
