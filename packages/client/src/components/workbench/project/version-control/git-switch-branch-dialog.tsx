import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormSelect,
	FormSelectItem,
	Muted,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";
import type { ProjectGitBranches } from "./version-control.types";

const switchBranchSchema = z.object({
	branch: z.string().min(1, "Select a branch"),
});

type SwitchBranchFormValues = z.infer<typeof switchBranchSchema>;

/** Props for the switch-branch dialog. */
interface GitSwitchBranchDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Complete with the branch ref on success, or no value on cancel. */
	onSubmit: (branch?: string) => void;
}

/** Select and check out an existing local or remote project branch. */
export const GitSwitchBranchDialog = ({
	open,
	onSubmit,
}: GitSwitchBranchDialogProps) => {
	const { project } = useProject();
	const insight = useInsight();
	const events = useWorkbench((state) => state.events.actions);
	const branches = usePixel<ProjectGitBranches>(
		open
			? `ProjectGitBranches(project=[${JSON.stringify(project.project_id)}]);`
			: "",
	);
	const form = useForm<SwitchBranchFormValues>({
		resolver: zodResolver(switchBranchSchema),
		defaultValues: { branch: "" },
	});
	const availableBranches =
		branches.data?.branches.filter((branch) => !branch.current) ?? [];

	const handleSubmit = async (values: SwitchBranchFormValues) => {
		try {
			await insight.actions.run(
				`ProjectGitCheckout(project=[${JSON.stringify(project.project_id)}], branch=[${JSON.stringify(values.branch)}]);`,
			);
			events.emit("git:branch-changed", { branch: values.branch });
			events.emit("git:status-changed", undefined);
			toast.success(`Switched to ${values.branch}`);
			form.reset();
			onSubmit(values.branch);
		} catch (error) {
			console.error(error);
			toast.error("Failed to switch branch");
		}
	};

	const cancel = () => {
		form.reset();
		onSubmit();
	};

	return (
		<Dialog open={open} onOpenChange={(next) => !next && cancel()}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Switch branch</DialogTitle>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="flex flex-col gap-6"
				>
					{branches.status === "INITIAL" ||
					branches.status === "LOADING" ? (
						<output className="flex items-center gap-2 text-muted-foreground text-sm">
							<Spinner className="size-4" />
							Loading branches
						</output>
					) : null}
					{branches.status === "ERROR" ? (
						<div
							className="flex flex-col items-start gap-2"
							role="alert"
						>
							<Muted>Unable to load branches.</Muted>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={branches.refresh}
							>
								Retry
							</Button>
						</div>
					) : null}
					{branches.status === "SUCCESS" &&
					availableBranches.length === 0 ? (
						<Muted>No other branches are available.</Muted>
					) : null}
					{availableBranches.length > 0 ? (
						<FormSelect
							name="branch"
							label="Branch"
							placeholder="Select a branch"
							description="Local changes are preserved when Git can switch safely."
							disabled={form.formState.isSubmitting}
						>
							{availableBranches.map((branch) => (
								<FormSelectItem
									key={branch.fullName}
									value={branch.name}
								>
									{branch.name}
									{branch.remote ? " (remote)" : ""}
								</FormSelectItem>
							))}
						</FormSelect>
					) : null}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={form.formState.isSubmitting}
							onClick={cancel}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={
								form.formState.isSubmitting ||
								availableBranches.length === 0
							}
						>
							{form.formState.isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							Switch branch
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
