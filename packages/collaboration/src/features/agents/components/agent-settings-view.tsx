import {
	ArrowLeft,
	Clock3,
	FileText,
	Save,
	Settings2,
	Users,
	Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
	Button,
	cn,
	Form,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import {
	deleteAgentImage,
	uploadAgentImage,
} from "@/features/agents/api/agent-image";
import { CapabilitiesSettingsView } from "@/features/agents/components/capabilities-settings-view";
import { ProfileSettingsView } from "@/features/agents/components/profile-settings-view";
import { StartsWorkSettingsView } from "@/features/agents/components/starts-work-settings-view";
import { TeamSettingsView } from "@/features/agents/components/team-settings-view";
import { WorkspaceSettingsView } from "@/features/agents/components/workspace-settings-view";
import { toError } from "@/lib/pixel";
import type { Agent } from "@/types/agent";
import type { Origin } from "@/types/origin";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;

const agentSettingsSchema = z
	.object({
		id: z.string(),
		name: z.string().trim().min(1, "Add a name before saving.").max(60),
		role: z.string().trim().min(1, "Add a role before saving.").max(100),
		type: z.enum(["Individual", "Team"]),
		avatar: z.string(),
		icon: z.enum(["compass", "briefcase", "chart", "pen", "users"]),
		tone: z.enum(["green", "teal", "blue", "amber"]),
		workspace: z.enum([
			"Conversation",
			"Travel itinerary",
			"Executive brief",
		]),
		instructions: z.string().max(8000),
		skills: z.array(z.string()),
		databases: z.array(z.string()),
		dataProducts: z.array(z.string()),
		members: z.array(z.string()),
		depth: z.number().min(0).max(5),
		concurrency: z.number().min(1).max(8),
		spawn: z.boolean(),
		triggers: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				source: z.enum(["Email", "Scheduled", "Calendar", "Webhook"]),
				condition: z.string(),
				enabled: z.boolean(),
			}),
		),
	})
	.superRefine((value, context) => {
		if (value.type === "Team" && value.members.length === 0) {
			context.addIssue({
				code: "custom",
				path: ["members"],
				message: "Select at least one team member.",
			});
		}
	});

type AgentSettingsValues = z.infer<typeof agentSettingsSchema>;

export function AgentSettings({
	agent,
	agents,
	onClose,
	onSave,
	skillOptions,
}: {
	agent: Agent;
	agents: Agent[];
	onClose: () => void;
	onSave: (agent: Agent) => Promise<void>;
	skillOptions: { name: string; detail: string }[];
}) {
	const form = useForm<AgentSettingsValues>({
		resolver: zodResolver(agentSettingsSchema),
		defaultValues: structuredClone({
			...agent,
			avatar: agent.avatar ?? "",
		}),
	});
	const draft = form.watch();
	const { isDirty: dirty, isSubmitting } = form.formState;
	const [tab, setTab] = useState("Profile");
	const [error, setError] = useState("");
	const [discard, setDiscard] = useState(false);
	const [ruleName, setRuleName] = useState("");
	const [ruleSource, setRuleSource] =
		useState<Exclude<Origin, "You">>("Scheduled");
	const [condition, setCondition] = useState("");
	const [addingRule, setAddingRule] = useState(false);
	const [editingRule, setEditingRule] = useState("");
	const [ruleTime, setRuleTime] = useState("08:30");
	const [ruleZone, setRuleZone] = useState("America/New_York");
	const [ruleCadence, setRuleCadence] = useState("Weekdays");
	const avatarInput = useRef<HTMLInputElement>(null);
	const [readingPhoto, setReadingPhoto] = useState(false);
	const [photo, setPhoto] = useState<string | null>(null);
	const savedAgent = agents.some((item) => item.id === agent.id);
	const shownAgent =
		photo === null ? draft : { ...draft, avatar: photo || undefined };

	useEffect(
		() => () => {
			if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
		},
		[photo],
	);

	async function choosePhoto(file: File) {
		if (
			!/^image\/(png|jpeg|gif|svg\+xml)$/.test(file.type) ||
			file.size > 2 * 1024 * 1024
		) {
			setError("Choose a PNG, JPEG, GIF or SVG image smaller than 2 MB.");
			return;
		}
		setReadingPhoto(true);
		setError("");
		try {
			await uploadAgentImage(agent.id, file);
			setPhoto(URL.createObjectURL(file));
		} catch (cause) {
			setError(
				`That image could not be uploaded. ${toError(cause).message}`,
			);
		} finally {
			setReadingPhoto(false);
		}
	}

	async function removePhoto() {
		setReadingPhoto(true);
		setError("");
		try {
			await deleteAgentImage(agent.id);
			setPhoto("");
		} catch (cause) {
			setError(
				`That image could not be removed. ${toError(cause).message}`,
			);
		} finally {
			setReadingPhoto(false);
		}
	}

	const update: UpdateAgent = (key, value) => {
		form.reset(
			{ ...form.getValues(), [key]: value },
			{
				keepDefaultValues: true,
				keepErrors: true,
				keepTouched: true,
				keepSubmitCount: true,
			},
		);
		setError("");
	};

	async function handleSubmit(values: AgentSettingsValues): Promise<void> {
		setError("");
		try {
			await onSave({
				...values,
				avatar: values.avatar || undefined,
			});
		} catch (cause) {
			setError(`Could not save the agent. ${toError(cause).message}`);
		}
	}

	function close() {
		if (dirty) setDiscard(true);
		else onClose();
	}

	function addRule() {
		if (
			!ruleName.trim() ||
			(ruleSource !== "Scheduled" && !condition.trim())
		) {
			setError("Give the rule a name and an event condition.");
			return;
		}
		if (ruleSource === "Scheduled") {
			try {
				new Intl.DateTimeFormat("en", { timeZone: ruleZone });
			} catch {
				setError("Enter a valid timezone, such as America/New_York.");
				return;
			}
		}
		const rule = {
			id: editingRule || crypto.randomUUID(),
			name: ruleName.trim(),
			source: ruleSource,
			condition:
				ruleSource === "Scheduled"
					? `${ruleCadence} at ${ruleTime} · ${ruleZone}`
					: condition.trim(),
			enabled:
				draft.triggers.find((item) => item.id === editingRule)
					?.enabled ?? true,
		};
		update(
			"triggers",
			editingRule
				? draft.triggers.map((item) =>
						item.id === editingRule ? rule : item,
					)
				: [...draft.triggers, rule],
		);
		setAddingRule(false);
		setRuleName("");
		setCondition("");
		setEditingRule("");
	}

	const tabs = [
		{ name: "Profile", icon: Settings2 },
		{ name: "Capabilities", icon: Zap },
		{ name: "Starts work when", icon: Clock3 },
		{ name: "Workspace", icon: FileText },
		{ name: "Team", icon: Users },
	];

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			onError={(errors) => {
				if (errors.name || errors.role) setTab("Profile");
				else if (errors.members) setTab("Team");
				setError(
					errors.name?.message ??
						errors.role?.message ??
						errors.members?.message ??
						"Review the highlighted settings before saving.",
				);
			}}
			noValidate
			aria-busy={isSubmitting}
			className="flex min-h-0 flex-1 flex-col bg-background"
		>
			<header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5 lg:px-8">
				<div className="flex min-w-0 items-center gap-3">
					<Button
						type="button"
						aria-label="Back to workspace"
						variant="ghost"
						size="icon"
						onClick={close}
					>
						<ArrowLeft />
					</Button>
					<AgentAvatar agent={shownAgent} size="sm" />
					<h1 className="truncate font-semibold text-xl">
						{draft.name || "New agent"}
					</h1>
				</div>
				<div className="flex items-center gap-2">
					{dirty && (
						<span className="mr-2 text-muted-foreground text-xs">
							Unsaved changes
						</span>
					)}
					<Button type="button" variant="outline" onClick={close}>
						Cancel
					</Button>
					<Button
						type="submit"
						disabled={readingPhoto || isSubmitting}
					>
						{isSubmitting ? (
							<Spinner className="size-4" />
						) : (
							<Save aria-hidden="true" />
						)}
						{isSubmitting ? "Saving…" : "Save agent"}
					</Button>
				</div>
			</header>
			{error && (
				<div
					role="alert"
					className="border-b bg-destructive/5 px-6 py-3 text-destructive text-sm"
				>
					{error}
				</div>
			)}
			{discard && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 border-b bg-chart-4/5 px-6 py-3 text-sm"
				>
					<span>Discard your unsaved changes?</span>
					<span className="flex gap-2">
						<Button
							type="button"
							size="sm"
							variant="outline"
							onClick={() => {
								setDiscard(false);
							}}
						>
							Keep editing
						</Button>
						<Button
							type="button"
							size="sm"
							variant="destructive"
							onClick={onClose}
						>
							Discard
						</Button>
					</span>
				</div>
			)}
			<div className="flex min-h-0 flex-1 flex-col md:flex-row">
				<nav
					aria-label="Agent settings"
					className="flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/40 p-3 md:w-48 md:flex-col md:overflow-x-visible md:border-r md:border-b-0 md:px-4 md:py-6"
				>
					{tabs.map(({ name, icon: Icon }) => (
						<button
							type="button"
							key={name}
							aria-current={tab === name ? "page" : undefined}
							onClick={() => setTab(name)}
							className={cn(
								"flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2.5 text-left text-xs",
								tab === name
									? "bg-accent font-medium text-link"
									: "text-muted-foreground hover:bg-secondary",
							)}
						>
							<Icon className="size-4" />
							{name}
							{name === "Team" && draft.type === "Team" && (
								<span className="ml-auto text-xs">
									{draft.members.length}
								</span>
							)}
						</button>
					))}
				</nav>
				<div className="min-h-0 flex-1 overflow-y-auto px-5 py-7 lg:px-10">
					<div className="max-w-2xl space-y-7">
						{tab === "Profile" && (
							<ProfileSettingsView
								agent={draft}
								shownAgent={shownAgent}
								savedAgent={savedAgent}
								readingPhoto={readingPhoto}
								photo={photo}
								avatarInput={avatarInput}
								onChoosePhoto={choosePhoto}
								onRemovePhoto={removePhoto}
								onUpdate={update}
							/>
						)}
						{tab === "Capabilities" && (
							<CapabilitiesSettingsView
								agent={draft}
								skillOptions={skillOptions}
								onUpdate={update}
							/>
						)}
						{tab === "Starts work when" && (
							<StartsWorkSettingsView
								agent={draft}
								ruleName={ruleName}
								ruleSource={ruleSource}
								condition={condition}
								addingRule={addingRule}
								editingRule={editingRule}
								ruleTime={ruleTime}
								ruleZone={ruleZone}
								ruleCadence={ruleCadence}
								onRuleNameChange={setRuleName}
								onRuleSourceChange={setRuleSource}
								onConditionChange={setCondition}
								onRuleTimeChange={setRuleTime}
								onRuleZoneChange={setRuleZone}
								onRuleCadenceChange={setRuleCadence}
								onAddRule={addRule}
								onEditRule={(rule) => {
									setRuleName(rule.name);
									setRuleSource(rule.source);
									setCondition(rule.condition);
									setEditingRule(rule.id);
									setAddingRule(true);
								}}
								onStartNewRule={() => {
									setEditingRule("");
									setRuleName("");
									setCondition("");
									setAddingRule(true);
								}}
								onCancelRule={() => setAddingRule(false)}
								onUpdate={update}
							/>
						)}
						{tab === "Workspace" && (
							<WorkspaceSettingsView
								agent={draft}
								onUpdate={update}
							/>
						)}
						{tab === "Team" && (
							<TeamSettingsView
								agent={draft}
								agents={agents}
								shownAgent={shownAgent}
								onUpdate={update}
							/>
						)}
					</div>
				</div>
			</div>
		</Form>
	);
}
