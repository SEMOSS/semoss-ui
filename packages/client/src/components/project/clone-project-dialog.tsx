import { useEffect } from "react";
import type { Project } from "@semoss/shared";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	Form,
	FormInput,
	FormSwitch,
	FormTextarea,
	Spinner,
	toast,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useRootStore } from "@/hooks";

const schema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().default(""),
	isGlobal: z.boolean().default(false),
});

type FormValues = z.infer<typeof schema>;

export interface CloneProjectDialogProps {
	/** Track if the dialog is open */
	open: boolean;
	/** Full project object to clone (picks project_id and project_type) */
	project: Pick<Project, "project_id" | "project_type">;
	/** Callback alias for backward compatibility */
	onClose: (projectId?: string) => void;
}

export const CloneProjectDialog = (props: CloneProjectDialogProps) => {
	const { open, project, onClose } = props;
	const { configStore } = useRootStore();

	const label =
		project.project_type === "SKILL"
			? "Skill"
			: project.project_type === "WORKSPACE"
				? "Agent"
				: project.project_type === "NOTEBOOK"
					? "Notebook"
					: "App";

	const form = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: "",
			description: "",
			isGlobal: false,
		},
	});

	useEffect(() => {
		if (open) {
			form.reset({
				name: "",
				description: "",
				isGlobal: false,
			});
		}
	}, [open, form.reset]);

	const escapePixelString = (value: string) => {
		return value.replaceAll("'", "\\'");
	};

	const handleSubmit = async (values: FormValues) => {
		if (!project.project_id) return;

		try {
			let clonedProjectId: string | undefined;

			if (project.project_type === "SKILL") {
				const { errors, pixelReturn } = await configStore.runPixel(
					`CloneSkill(skillId=["${project.project_id}"], name=["${escapePixelString(values.name.trim())}"]);`,
				);

				if (errors.length > 0) {
					throw new Error(errors.join(""));
				}

				clonedProjectId = String(
					(pixelReturn[0].output as { project_id?: string })
						?.project_id || "",
				);
			} else {
				const { errors, pixelReturn } = await configStore.runPixel(
					`CreateAppFromTemplate(project=["${escapePixelString(values.name.trim())}"], projectTemplate=["${project.project_id}"], global=["${values.isGlobal}"]);`,
				);

				if (errors.length > 0) {
					throw new Error(errors.join(""));
				}

				clonedProjectId = String(
					(pixelReturn[0]?.output as { project_id?: string })
						?.project_id || "",
				);

				const trimmedDescription = values.description.trim();
				if (trimmedDescription && clonedProjectId) {
					const metaResponse = await configStore.runPixel(
						`SetProjectMetadata(project=["${escapePixelString(clonedProjectId)}"], meta=[${JSON.stringify({ description: trimmedDescription })}]);`,
					);

					if (metaResponse.errors.length > 0) {
						throw new Error(metaResponse.errors.join(""));
					}
				}
			}

			toast.success(`${label} cloned successfully`);
			onClose(clonedProjectId);
		} catch (error) {
			console.error(error);
			const message = `There was an error cloning your ${label.toLowerCase()}. Please try again.`;
			toast.error(message);
		}
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(nextOpen) => {
				if (!nextOpen) {
					onClose();
				}
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Clone {label}</DialogTitle>
					<DialogDescription>
						Create a new {label.toLowerCase()} from this template.
					</DialogDescription>
				</DialogHeader>

				<Form form={form} onSubmit={handleSubmit}>
					<FieldGroup className="py-2">
						<FormInput
							name="name"
							label="Name"
							placeholder={`Enter ${label.toLowerCase()} name`}
							disabled={form.formState.isSubmitting}
							autoFocus
						/>

						<FormTextarea
							name="description"
							label="Description"
							placeholder={`Optional description for your cloned ${label.toLowerCase()}`}
							disabled={form.formState.isSubmitting}
							rows={3}
						/>

						{project.project_type !== "SKILL" && (
							<FormSwitch
								name="isGlobal"
								label="Make Public"
								description={`Allow all users to discover and view this ${label.toLowerCase()}.`}
								disabled={form.formState.isSubmitting}
							/>
						)}
					</FieldGroup>

					<DialogFooter className="mt-4">
						<Button
							type="button"
							variant="outline"
							disabled={form.formState.isSubmitting}
							onClick={() => onClose()}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting && (
								<Spinner className="mr-2 size-4" />
							)}
							Clone
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
};
