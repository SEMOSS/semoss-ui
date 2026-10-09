import {
	Button,
	Form,
	FormInput,
	FormSelect,
	H3,
	P,
	SelectItem,
	Small,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { useCollaborationSession } from "../state/collaboration-session.context";

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
	return (
		<div className="space-y-6">
			<section className="space-y-4">
				<H3 className="font-medium text-base">
					Exclude from future context
				</H3>
				<P className="text-base text-muted-foreground">
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
							<Small className="font-medium text-base">
								{rule.kind.replace("never_", "")}
							</Small>
							<Small className="min-w-0 flex-1 break-words text-base">
								{rule.value}
							</Small>
							<Button
								variant="ghost"
								size="sm"
								className="pointer-coarse:min-h-11"
								aria-label={`Remove ${rule.kind.replace("never_", "")} rule ${rule.value}`}
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
					<FormInput name="value" label="Value (required)" required />
					<Button type="submit" variant="outline">
						Add rule
					</Button>
				</Form>
			</section>
			<section className="space-y-4 border-border border-t pt-6">
				<H3 className="font-medium text-base">Filing preferences</H3>
				<P className="text-base text-muted-foreground">
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
					/>
					<FormInput
						name="askAt"
						type="number"
						min={10}
						max={94}
						label="Ask from (%)"
					/>
					<Button type="submit" variant="outline">
						Save preferences
					</Button>
					{Object.keys(settingsForm.formState.dirtyFields).length >
						0 && (
						<Small className="text-base text-muted-foreground">
							Unsaved preferences
						</Small>
					)}
				</Form>
			</section>
		</div>
	);
}
