import { useRef, useState } from "react";
import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Form,
	Spinner,
	toast,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import type { CatalogSkill } from "@/features/routines/custom-routine-schema";
import { saveTwin, type TwinProfile } from "./api/digital-twin";
import { TwinProfileFields } from "./twin-profile-fields";
import { twinProfileSchema } from "./twin-profile-schema";

interface TwinProfileFormProps {
	/** The saved twin and what it holds; the form starts from it. */
	twin: { id: string; profile: TwinProfile };
	/** The owner's skill catalog; the twin can follow any of them. */
	skills: CatalogSkill[];
	/** The twin's saved image, shown until another is chosen. */
	imageUrl: string;
	/** The owner's note could not be read: the form shows none and leaves the twin's as it is. */
	isNoteUnread?: boolean;
	/** Whether the owner has a persona; without one the form shows no switch and leaves the twin's as it is. */
	hasPersona?: boolean;
	/** Called once everything is saved. */
	onSaved: () => void;
}

/**
 * A saved Digital Twin's profile on one page: its image, name, whether it
 * uses its owner's persona, instructions, greeting, its owner's note, skills
 * and toolboxes. Nothing is saved until Save, and a save that fails says
 * which part and keeps what was entered.
 */
export function TwinProfileForm({
	twin,
	skills,
	imageUrl,
	isNoteUnread = false,
	hasPersona = false,
	onSaved,
}: TwinProfileFormProps) {
	const { actions } = useInsight();
	// the note the twin holds, so only a changed one is written; not known when it could not be read
	const savedAbout = useRef(isNoteUnread ? undefined : twin.profile.about);
	// whether the twin uses the owner's persona, so only a change is sent; not known for someone with none
	const savedUsePersona = useRef(
		hasPersona ? twin.profile.usePersona : undefined,
	);
	const [createdSkills, setCreatedSkills] = useState<CatalogSkill[]>([]);
	const form = useForm<TwinProfile>({
		resolver: zodResolver(twinProfileSchema),
		defaultValues: { ...twin.profile, image: null },
	});
	const { errors, isSubmitting } = form.formState;

	const handleSubmit = async (values: TwinProfile): Promise<void> => {
		try {
			await saveTwin(
				actions,
				twin.id,
				values,
				savedAbout.current,
				savedUsePersona.current,
			);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "Your Digital Twin could not be saved.",
			});
			return;
		}
		if (savedAbout.current !== undefined) savedAbout.current = values.about;
		if (savedUsePersona.current !== undefined)
			savedUsePersona.current = values.usePersona;
		// what is saved is the form's new starting point; the image is uploaded, so none is waiting
		form.reset({ ...values, image: null });
		toast.success("Digital Twin saved");
		onSaved();
	};

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			noValidate
			aria-busy={isSubmitting}
			className="flex min-w-0 max-w-3xl flex-col gap-8"
		>
			<TwinProfileFields
				skills={[...skills, ...createdSkills]}
				onSkillCreated={(skill) =>
					setCreatedSkills((current) => [...current, skill])
				}
				imageUrl={imageUrl}
				isNoteUnread={isNoteUnread}
				hasPersona={hasPersona}
			/>
			{errors.root?.server?.message && (
				<Alert variant="destructive">
					<AlertDescription>
						{errors.root.server.message}
					</AlertDescription>
				</Alert>
			)}
			<Button
				type="submit"
				disabled={isSubmitting}
				className="pointer-coarse:min-h-11 sm:self-end"
			>
				{isSubmitting && (
					<Spinner aria-hidden="true" data-icon="inline-start" />
				)}
				{isSubmitting ? "Saving…" : "Save"}
			</Button>
		</Form>
	);
}
