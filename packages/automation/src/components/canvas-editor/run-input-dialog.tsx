import { useEffect, useMemo } from "react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { AutomationGlobalVariable } from "../../domain/automation-workflow.types";

const runInputSchema = z.object({
	inputs: z.record(z.string(), z.string()),
});

type RunInputValues = z.infer<typeof runInputSchema>;

interface RunInputDialogProps {
	/** Whether the run-input dialog is visible. */
	open: boolean;
	/** Trigger-owned inputs that may be overridden for only this run. */
	inputs: AutomationGlobalVariable[];
	/** Closes the dialog without starting a run. */
	onCancel: () => void;
	/** Starts the run with the values entered in the dialog. */
	onRun: (inputs: Record<string, string>) => void;
}

/** Collects one-time trigger input overrides without changing the saved defaults. */
export function RunInputDialog({
	open,
	inputs,
	onCancel,
	onRun,
}: RunInputDialogProps) {
	const values = useMemo<RunInputValues>(
		() => ({
			inputs: Object.fromEntries(
				inputs.map((input) => [input.name, input.defaultValue]),
			),
		}),
		[inputs],
	);
	const form = useForm<RunInputValues>({
		resolver: zodResolver(runInputSchema),
		defaultValues: values,
	});

	useEffect(() => {
		if (open) form.reset(values);
	}, [form, open, values]);

	const handleOpenChange = (nextOpen: boolean): void => {
		if (!nextOpen) onCancel();
	};

	const handleSubmit = (nextValues: RunInputValues): void => {
		onRun(nextValues.inputs);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Run automation</DialogTitle>
					<DialogDescription>
						Review the inputs for this run. These values do not
						change the saved defaults.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					className="space-y-4"
				>
					<div className="max-h-[50vh] space-y-4 overflow-y-auto pr-1">
						{inputs.map((input) => (
							<FormInput
								key={input.name}
								name={`inputs.${input.name}`}
								label={input.name}
								description={
									input.description ||
									"Value available to every step in this run."
								}
								autoComplete="off"
							/>
						))}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={onCancel}
						>
							Cancel
						</Button>
						<Button type="submit">Run</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
