import { useId } from "react";
import {
	Button,
	Form,
	FormInput,
	FormSelect,
	P,
	SelectItem,
	Small,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";
import { Section } from "./section";

const ruleSchema = z.object({
	kind: z.enum([
		"never_sender",
		"never_domain",
		"never_folder",
		"never_keyword",
	]),
	value: z.string().trim().min(1, "Enter a rule value."),
});
const settingsSchema = z
	.object({
		fileAt: z
			.string()
			.refine(
				(value) => Number(value) >= 60 && Number(value) <= 99,
				"Choose 60–99.",
			),
		askAt: z
			.string()
			.refine(
				(value) => Number(value) >= 10 && Number(value) <= 94,
				"Choose 10–94.",
			),
	})
	.refine((value) => Number(value.fileAt) - Number(value.askAt) >= 5, {
		path: ["askAt"],
		message:
			"Ask threshold must be at least five points below filing threshold.",
	});

/** Local future-context exclusions and sample classification preferences. */
export function RulesEditor() {
	const { state, dispatch } = useCollaborationSession();
	const ruleForm = useForm<z.infer<typeof ruleSchema>>({
		resolver: zodResolver(ruleSchema),
		defaultValues: { kind: "never_sender", value: "" },
	});
	const settingsForm = useForm<z.infer<typeof settingsSchema>>({
		resolver: zodResolver(settingsSchema),
		values: {
			fileAt: String(state.settings.fileAt),
			askAt: String(state.settings.askAt),
		},
		resetOptions: { keepDirtyValues: true },
	});
	const errorId = useId();
	return (
		<div className="space-y-6">
			<Section title="Exclude from future context">
				<P className="text-muted-foreground">
					Rules filter selected content sent in future questions. They
					do not change your mailbox, erase saved conversations, or
					remove quoted text inside other messages.
				</P>
				{state.rules
					.filter((rule) => !rule.disabledAt)
					.map((rule) => (
						<div
							key={rule.id}
							className="flex flex-wrap items-center gap-3 border-b pb-3"
						>
							<Small className="font-medium">
								{rule.kind.replace("never_", "")}
							</Small>
							<Small className="min-w-0 flex-1 break-words">
								{rule.value}
								{rule.isSample ? " · sample" : ""}
							</Small>
							<Button
								variant="ghost"
								size="sm"
								onClick={() =>
									dispatch({
										type: "rule.remove",
										ruleId: rule.id,
									})
								}
							>
								Remove
							</Button>
						</div>
					))}
				<Form
					form={ruleForm}
					className="space-y-3"
					onSubmit={(values) => {
						dispatch({
							type: "rule.add",
							rule: { ...values, isSample: false },
						});
						ruleForm.reset({ kind: values.kind, value: "" });
					}}
				>
					<FormSelect name="kind" label="Rule type">
						<SelectItem value="never_sender">Sender</SelectItem>
						<SelectItem value="never_domain">Domain</SelectItem>
						<SelectItem value="never_folder">Folder</SelectItem>
						<SelectItem value="never_keyword">Keyword</SelectItem>
					</FormSelect>
					<FormInput
						name="value"
						label="Value (required)"
						required
						aria-describedby={`${errorId}-rule`}
					/>
					<span id={`${errorId}-rule`} className="sr-only">
						{ruleForm.formState.errors.value?.message}
					</span>
					<Button type="submit" variant="outline">
						Add rule
					</Button>
				</Form>
			</Section>
			<Section title="Filing preferences">
				<P className="text-muted-foreground">
					These thresholds are session preferences. Automatic
					classification and ingestion are not connected.
				</P>
				<Form
					form={settingsForm}
					className="space-y-3"
					onSubmit={(values) => {
						dispatch({
							type: "settings.save",
							changes: {
								fileAt: Number(values.fileAt),
								askAt: Number(values.askAt),
							},
						});
						settingsForm.reset(values);
					}}
				>
					<FormInput
						name="fileAt"
						type="number"
						min={60}
						max={99}
						label="File automatically at (%)"
						aria-describedby={`${errorId}-file`}
					/>
					<span id={`${errorId}-file`} className="sr-only">
						{settingsForm.formState.errors.fileAt?.message}
					</span>
					<FormInput
						name="askAt"
						type="number"
						min={10}
						max={94}
						label="Ask from (%)"
						aria-describedby={`${errorId}-ask`}
					/>
					<span id={`${errorId}-ask`} className="sr-only">
						{settingsForm.formState.errors.askAt?.message}
					</span>
					<Button type="submit" variant="outline">
						Save preferences
					</Button>
					{Object.keys(settingsForm.formState.dirtyFields).length >
						0 && (
						<Small className="text-muted-foreground">
							Unsaved preferences
						</Small>
					)}
				</Form>
			</Section>
		</div>
	);
}
