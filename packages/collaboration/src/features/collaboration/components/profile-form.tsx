import { useId } from "react";
import {
	Button,
	Form,
	FormInput,
	FormTextarea,
	Small,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import type { Profile } from "../state/collaboration.types";
import { useCollaborationSession } from "../state/collaboration-session.context";

const schema = z.object({
	role: z.string(),
	timezone: z.string().refine((value) => {
		try {
			new Intl.DateTimeFormat("en", { timeZone: value });
			return true;
		} catch {
			return false;
		}
	}, "Enter a valid time zone, such as America/New_York."),
	workingHours: z.string(),
	style: z.string(),
});

/** Explicit profile save prevents drafts from becoming context before confirmation. */
export function ProfileForm({
	profile,
	target,
}: {
	profile: Profile;
	target: "sample" | "live";
}) {
	const { dispatch } = useCollaborationSession();
	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		values: {
			role: profile.role.value,
			timezone: profile.timezone,
			workingHours: profile.workingHours,
			style: profile.style.summary,
		},
		resetOptions: { keepDirtyValues: true },
	});
	const timezoneErrorId = useId();
	return (
		<Form
			form={form}
			className="space-y-4"
			onSubmit={(values) => {
				dispatch({
					type: "profile.save",
					target,
					changes: {
						role: { value: values.role, source: "you" },
						timezone: values.timezone,
						workingHours: values.workingHours,
						style: {
							...profile.style,
							summary: values.style,
							source: "you",
							confirmed: true,
						},
					},
				});
				form.reset(values);
			}}
		>
			<FormInput name="role" label="Role" />
			<FormInput
				name="timezone"
				label="Time zone"
				aria-describedby={timezoneErrorId}
			/>
			<span id={timezoneErrorId} className="sr-only">
				{form.formState.errors.timezone?.message}
			</span>
			<FormInput name="workingHours" label="Working hours" />
			<FormTextarea
				name="style"
				label="How you write"
				description="Your confirmed writing preferences can be used when drafting."
			/>
			<Button type="submit">Save profile for this session</Button>
			{Object.keys(form.formState.dirtyFields).length > 0 && (
				<Small className="text-muted-foreground">
					Unsaved profile edits
				</Small>
			)}
		</Form>
	);
}
