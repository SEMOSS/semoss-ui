import {
	Button,
	Form,
	FormInput,
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
});

/** Role, time zone, and working hours; how you write is reviewed and confirmed in StyleSettings. */
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
		},
		resetOptions: { keepDirtyValues: true },
	});
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
					},
				});
				form.reset(values);
			}}
		>
			<FormInput name="role" label="Role" />
			<FormInput name="timezone" label="Time zone" />
			<FormInput name="workingHours" label="Working hours" />
			<Button type="submit">Save profile for this session</Button>
			{Object.keys(form.formState.dirtyFields).length > 0 && (
				<Small className="text-muted-foreground">
					Unsaved profile edits
				</Small>
			)}
		</Form>
	);
}
