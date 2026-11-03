import { useInsight } from "@semoss/sdk/react";
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	Form,
	H2,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { saveCustomRoutine } from "./custom-routine-api";
import { CustomRoutineFields } from "./custom-routine-fields";
import {
	type CustomRoutine,
	type CustomRoutineSettings,
	customRoutineSettingsSchema,
	type MySkill,
} from "./custom-routine-schema";

interface NewCustomRoutineProps {
	skills: MySkill[];
	onCreated: (routine: CustomRoutine) => void;
	onCancel: () => void;
}

/** Creates a routine; it starts on once it saves. */
export function NewCustomRoutine({
	skills,
	onCreated,
	onCancel,
}: NewCustomRoutineProps) {
	const { actions } = useInsight();
	const form = useForm<CustomRoutineSettings>({
		resolver: zodResolver(customRoutineSettingsSchema),
		defaultValues: {
			enabled: true,
			name: "",
			prompt: "",
			time: "08:00",
			days: ["MON", "TUE", "WED", "THU", "FRI"],
			timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			delivery: "email",
			skills: [],
			agentId: "",
		},
	});
	const error = form.formState.errors.root?.server?.message;
	const submit = async (values: CustomRoutineSettings) => {
		try {
			onCreated(await saveCustomRoutine(actions, values));
		} catch (cause) {
			form.setError("root.server", {
				message:
					cause instanceof Error
						? cause.message
						: "The routine could not be saved.",
			});
		}
	};
	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<Form form={form} onSubmit={submit} noValidate>
				<CardHeader className="gap-2 border-b py-6">
					<CardTitle>
						<H2 className="font-medium text-xl">New routine</H2>
					</CardTitle>
					<CardDescription>
						Your assistant does this on your schedule and sends the
						result only to you.
					</CardDescription>
				</CardHeader>
				<CardContent className="py-6">
					<CustomRoutineFields skills={skills} />
				</CardContent>
				<CardFooter className="flex flex-col items-start gap-3 border-t py-4">
					{error && (
						<Alert variant="destructive">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
					<div className="flex gap-2">
						<Button
							type="submit"
							disabled={form.formState.isSubmitting}
						>
							{form.formState.isSubmitting
								? "Saving..."
								: "Create routine"}
						</Button>
						<Button
							type="button"
							variant="ghost"
							onClick={onCancel}
						>
							Cancel
						</Button>
					</div>
				</CardFooter>
			</Form>
		</Card>
	);
}
