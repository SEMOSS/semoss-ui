import { useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	Form,
	FormInput,
	FormTextarea,
	Spinner,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import {
	createTwinSkill,
	type TwinSkillValues,
	twinSkillSchema,
} from "./api/twin-skills";

interface TwinSkillCreateProps {
	/** Disable creation while the twin is being saved. */
	disabled: boolean;
	/** Add the newly saved skill to the twin's draft and its catalog choices. */
	onCreated: (skill: CatalogSkill) => void;
}

/** Create a skill without leaving or submitting the surrounding twin form. */
export function TwinSkillCreate({ disabled, onCreated }: TwinSkillCreateProps) {
	const { actions } = useInsight();
	const [isOpen, setIsOpen] = useState(false);
	const form = useForm<TwinSkillValues>({
		resolver: zodResolver(twinSkillSchema),
		defaultValues: { name: "", description: "", content: "" },
	});
	const { isSubmitting, errors } = form.formState;
	const handleOpenChange = (open: boolean): void => {
		if (isSubmitting) return;
		setIsOpen(open);
		if (!open) form.reset();
	};
	const handleSubmit = async (values: TwinSkillValues): Promise<void> => {
		let skill: CatalogSkill;
		try {
			skill = await createTwinSkill(actions, values);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "The skill could not be created.",
			});
			return;
		}
		onCreated(skill);
		setIsOpen(false);
		form.reset();
	};
	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					type="button"
					size="sm"
					variant="outline"
					disabled={disabled}
					className="pointer-coarse:min-h-11"
				>
					Create skill
				</Button>
			</DialogTrigger>
			<DialogContent
				className="max-h-dvh overflow-y-auto sm:max-w-2xl"
				showCloseButton={!isSubmitting}
				onEscapeKeyDown={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				onInteractOutside={(event) => {
					if (isSubmitting) event.preventDefault();
				}}
				// Portalled form events still bubble to the twin's form in the React tree.
				onSubmit={(event) => event.stopPropagation()}
			>
				<DialogHeader>
					<DialogTitle>Create skill</DialogTitle>
					<DialogDescription>
						Save reusable instructions to your skill catalog. The
						skill is selected for your twin and applied when you
						save or create it.
					</DialogDescription>
				</DialogHeader>
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
					className="flex min-w-0 flex-col gap-4"
				>
					<FormInput
						name="name"
						label="Skill name (required)"
						required
						disabled={isSubmitting}
					/>
					<FormTextarea
						name="description"
						label="Description (required)"
						description="When your twin should use this skill."
						required
						rows={2}
						disabled={isSubmitting}
					/>
					<FormTextarea
						name="content"
						label="Skill instructions (required)"
						description="Write the instructions your twin should follow. Markdown is supported."
						required
						rows={10}
						disabled={isSubmitting}
					/>
					{errors.root?.server?.message && (
						<Alert variant="destructive">
							<AlertDescription>
								{errors.root.server.message}
							</AlertDescription>
						</Alert>
					)}
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							disabled={isSubmitting}
							onClick={() => handleOpenChange(false)}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isSubmitting}>
							{isSubmitting && <Spinner aria-hidden="true" />}
							{isSubmitting ? "Creating…" : "Create skill"}
						</Button>
					</DialogFooter>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
