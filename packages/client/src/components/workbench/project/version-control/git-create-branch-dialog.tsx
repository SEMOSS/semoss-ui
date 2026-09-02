import { useInsight } from "@semoss/sdk/react";
import {
	Button,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormInput,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useProject, useWorkbench } from "@/hooks";

const branchSchema = z.object({
	name: z
		.string()
		.trim()
		.min(1, "Branch name is required")
		.refine(
			(name) =>
				name !== "@" &&
				!name.startsWith("/") &&
				!name.endsWith("/") &&
				!name.endsWith(".") &&
				!name.endsWith(".lock") &&
				!name.includes("..") &&
				!name.includes("@{") &&
				!/[\s~^:?*[\\\]]/.test(name),
			"Enter a valid Git branch name",
		),
});

type BranchFormValues = z.infer<typeof branchSchema>;

/** Props for the create-branch dialog. */
interface GitCreateBranchDialogProps {
	/** Whether the dialog is open. */
	open: boolean;
	/** Complete with the branch name on success, or no value on cancel. */
	onSubmit: (branch?: string) => void;
}

/** Create and check out a project Git branch from HEAD. */
export const GitCreateBranchDialog = ({
	open,
	onSubmit,
}: GitCreateBranchDialogProps) => {
	const { project } = useProject();
	const insight = useInsight();
	const events = useWorkbench((state) => state.events.actions);
	const form = useForm<BranchFormValues>({
		resolver: zodResolver(branchSchema),
		defaultValues: { name: "" },
	});

	const handleSubmit = async (values: BranchFormValues) => {
		try {
			await insight.actions.run(
				`ProjectGitCreateBranch(project=[${JSON.stringify(project.project_id)}], branch=[${JSON.stringify(values.name)}], startPoint=["HEAD"]);`,
			);
			events.emit("git:branch-changed", { branch: values.name });
			events.emit("git:status-changed", undefined);
			toast.success(`Created branch ${values.name}`);
			form.reset();
			onSubmit(values.name);
		} catch (error) {
			console.error(error);
			toast.error("Failed to create branch");
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
					<DialogTitle>Create branch</DialogTitle>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					className="flex flex-col gap-6"
				>
					<FormInput
						name="name"
						label="Branch name"
						placeholder="feature/my-branch"
						description="The branch will be created from the current HEAD and checked out."
						autoComplete="off"
						autoFocus
						disabled={form.formState.isSubmitting}
						data-testid="gitCreateBranchDialog-name-input"
					/>
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
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting ? (
								<Spinner className="size-4" />
							) : null}
							Create branch
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
