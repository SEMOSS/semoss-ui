import { ArrowLeft } from "lucide-react";
import { useState } from "react";
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
	Spinner,
	useForm,
	zodResolver,
} from "@semoss/ui/next";
import { saveCustomRoutine } from "./custom-routine-api";
import { CustomRoutineFields } from "./custom-routine-fields";
import {
	type CatalogSkill,
	type CustomRoutine,
	type CustomRoutineSettings,
	customRoutineSettingsSchema,
} from "./custom-routine-schema";
import { RoutineAgentAvatar } from "./routine-agent-avatar";
import { RoutineTemplatePicker } from "./routine-template-picker";
import type { RoutineTemplate } from "./routine-templates";

/** A blank routine: on, weekday mornings in the owner's own time zone, emailed to them. */
function blankRoutine(): CustomRoutineSettings {
	return {
		enabled: true,
		name: "",
		prompt: "",
		time: "08:00",
		days: ["MON", "TUE", "WED", "THU", "FRI"],
		timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
		delivery: "email",
		skills: [],
		tools: [],
		agentId: "",
	};
}

interface NewCustomRoutineProps {
	/** The owner's skill catalog, for the routine's skill picker. */
	skills: CatalogSkill[];
	onCreated: (routine: CustomRoutine) => void;
	/** Leaves without creating; left out where there is nothing to go back to, such as a first routine. */
	onCancel?: () => void;
}

/** Creates a routine from an idea or from scratch; it starts on once it saves. */
export function NewCustomRoutine({
	skills,
	onCreated,
	onCancel,
}: NewCustomRoutineProps) {
	const { actions } = useInsight();
	const [isPicking, setIsPicking] = useState(true);
	const [ideaId, setIdeaId] = useState("new-routine");
	const form = useForm<CustomRoutineSettings>({
		resolver: zodResolver(customRoutineSettingsSchema),
		defaultValues: blankRoutine(),
	});
	const { errors, isSubmitting } = form.formState;

	const handlePick = (template: RoutineTemplate | null): void => {
		// the idea fills the form, then the owner edits it like any routine
		form.reset({
			...blankRoutine(),
			...(template && {
				name: template.name,
				prompt: template.prompt,
				days: template.days,
				time: template.time,
				delivery: template.delivery,
			}),
		});
		setIdeaId(template?.id ?? "new-routine");
		setIsPicking(false);
	};

	const handleSubmit = async (
		values: CustomRoutineSettings,
	): Promise<void> => {
		let created: CustomRoutine;
		try {
			created = await saveCustomRoutine(actions, values);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message:
					cause instanceof Error
						? cause.message
						: "The routine could not be saved.",
			});
			return;
		}
		onCreated(created);
	};

	return (
		<Card className="gap-0 overflow-hidden py-0 shadow-none">
			<CardHeader className="border-b py-6">
				<div className="flex items-start gap-4">
					<div className="size-12 shrink-0">
						<RoutineAgentAvatar routineId={ideaId} />
					</div>
					<div className="flex min-w-0 flex-col gap-1">
						<CardTitle>
							<H2 className="font-medium text-xl">New routine</H2>
						</CardTitle>
						<CardDescription>
							Your assistant does this on your schedule and sends
							the result only to you.
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			{isPicking ? (
				<>
					<CardContent className="py-6">
						<RoutineTemplatePicker onPick={handlePick} />
					</CardContent>
					{onCancel && (
						<CardFooter className="border-t py-4">
							<Button
								type="button"
								variant="ghost"
								onClick={onCancel}
							>
								Cancel
							</Button>
						</CardFooter>
					)}
				</>
			) : (
				<Form
					form={form}
					onSubmit={handleSubmit}
					noValidate
					aria-busy={isSubmitting}
				>
					<CardContent className="py-6">
						<CustomRoutineFields skills={skills} />
					</CardContent>
					<CardFooter className="flex flex-col items-stretch gap-3 border-t py-4">
						{errors.root?.server?.message && (
							<Alert variant="destructive">
								<AlertDescription>
									{errors.root.server.message}
								</AlertDescription>
							</Alert>
						)}
						<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
							<Button
								type="button"
								variant="ghost"
								disabled={isSubmitting}
								onClick={() => setIsPicking(true)}
							>
								<ArrowLeft
									aria-hidden="true"
									data-icon="inline-start"
								/>
								Back to ideas
							</Button>
							<div className="flex flex-col-reverse gap-2 sm:flex-row">
								{onCancel && (
									<Button
										type="button"
										variant="outline"
										disabled={isSubmitting}
										onClick={onCancel}
									>
										Cancel
									</Button>
								)}
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting && (
										<Spinner
											aria-hidden="true"
											data-icon="inline-start"
										/>
									)}
									{isSubmitting
										? "Creating…"
										: "Create routine"}
								</Button>
							</div>
						</div>
					</CardFooter>
				</Form>
			)}
		</Card>
	);
}
