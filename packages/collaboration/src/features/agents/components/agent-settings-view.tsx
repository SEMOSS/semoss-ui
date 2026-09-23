import { ArrowLeft, Save, Settings2, Users, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getCatalogImageValidationError } from "@semoss/sdk";
import {
	Alert,
	AlertDescription,
	Button,
	cn,
	Form,
	H1,
	Muted,
	P,
	Spinner,
	useForm,
	z,
	zodResolver,
} from "@semoss/ui/next";
import { AgentAvatar } from "@/components/common/agent-avatar";
import { mcpConfigSchema } from "@/features/agents/api/agent-schemas";
import { CapabilitiesSettingsView } from "@/features/agents/components/capabilities-settings-view";
import { ProfileSettingsView } from "@/features/agents/components/profile-settings-view";
import { TeamSettingsView } from "@/features/agents/components/team-settings-view";
import { toError } from "@/lib/pixel";
import type { Agent } from "@/types/agent";

type UpdateAgent = <Key extends keyof Agent>(
	key: Key,
	value: Agent[Key],
) => void;

const agentSettingsSchema = z.object({
	id: z.string(),
	name: z
		.string()
		.trim()
		.min(1, "Add a name before saving.")
		.max(60)
		.regex(
			/^[a-zA-Z][a-zA-Z0-9 _-]*$/,
			"Start the name with a letter and use only letters, numbers, spaces, underscores, or hyphens.",
		),
	// Preserve the existing workspace description; it is not an editable field.
	description: z.string(),
	avatar: z.string(),
	image: z
		.instanceof(File)
		.nullable()
		.superRefine((file, context) => {
			if (!file) return;
			const message = getCatalogImageValidationError(file);
			if (message) context.addIssue({ code: "custom", message });
		}),
	removeImage: z.boolean(),
	icon: z.enum(["compass", "briefcase", "chart", "pen", "users"]),
	tone: z.enum(["green", "teal", "blue", "amber"]),
	instructions: z.string().max(8000),
	skills: z.array(z.object({ id: z.string(), name: z.string() })),
	mcp: z.array(mcpConfigSchema),
	members: z.array(z.string()),
});

type AgentSettingsValues = z.infer<typeof agentSettingsSchema>;

export function AgentSettings({
	agent,
	agents,
	onClose,
	onSave,
	skillOptions,
	isLoadingSkills = false,
	skillsError = null,
	onRetrySkills,
}: {
	agent: Agent;
	agents: Agent[];
	onClose: () => void;
	/** Saves settings and an optional image change before closing the page. */
	onSave: (agent: Agent, image?: File | null) => Promise<void>;
	skillOptions: { name: string; detail: string; value: string }[];
	isLoadingSkills?: boolean;
	skillsError?: Error | null;
	onRetrySkills?: () => void;
}) {
	const form = useForm<AgentSettingsValues>({
		resolver: zodResolver(agentSettingsSchema),
		defaultValues: structuredClone({
			...agent,
			avatar: agent.avatar ?? "",
			image: null,
			removeImage: false,
		}),
	});
	const draft = form.watch();
	const { isDirty, isSubmitting, errors } = form.formState;
	const hasImageChange = draft.image !== null || draft.removeImage;
	// RHF does not compare File objects for dirty state.
	const hasUnsavedChanges = isDirty || hasImageChange;
	const [tab, setTab] = useState("Profile");
	const [error, setError] = useState("");
	const visibleError = errors.root?.server?.message ?? error;
	const [discard, setDiscard] = useState(false);
	const [imagePreview, setImagePreview] = useState("");
	const shownAgent = {
		...draft,
		avatar: draft.removeImage
			? undefined
			: imagePreview || draft.avatar || undefined,
	};

	useEffect(() => {
		const file = draft.image;
		if (!file || getCatalogImageValidationError(file)) {
			setImagePreview("");
			return;
		}
		const url = URL.createObjectURL(file);
		setImagePreview(url);
		return () => URL.revokeObjectURL(url);
	}, [draft.image]);

	/** Keep the file in the draft until the server has assigned the agent's ID. */
	function choosePhoto(file: File): void {
		form.setValue("image", file, {
			shouldDirty: true,
			shouldValidate: true,
		});
		form.setValue("removeImage", false, { shouldDirty: true });
		form.clearErrors("root.server");
		setError("");
	}

	/** Queue removal with the rest of the settings; cancel still discards the change. */
	function removePhoto(): void {
		form.setValue("image", null, {
			shouldDirty: true,
			shouldValidate: true,
		});
		form.setValue("removeImage", Boolean(agent.avatar), {
			shouldDirty: true,
		});
		form.clearErrors("root.server");
		setError("");
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
			const { image, removeImage, ...settings } = values;
			const saved: Agent = {
				...settings,
				avatar: values.avatar || undefined,
			};
			if (image || removeImage) await onSave(saved, image);
			else await onSave(saved);
		} catch (cause) {
			form.setError("root.server", {
				type: "server",
				message: `Could not finish saving the agent. ${toError(cause).message}`,
			});
		}
	}

	function close() {
		if (hasUnsavedChanges) setDiscard(true);
		else onClose();
	}

	const tabs = [
		{ name: "Profile", icon: Settings2 },
		{ name: "Capabilities", icon: Zap },
		{ name: "Subagents", icon: Users },
	];

	return (
		<Form
			form={form}
			onSubmit={handleSubmit}
			onError={(errors) => {
				if (errors.name || errors.image) setTab("Profile");
				else if (errors.members) setTab("Subagents");
				setError(
					errors.name || errors.image
						? ""
						: (errors.members?.message ??
								"Review the highlighted settings before saving."),
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
						disabled={isSubmitting}
					>
						<ArrowLeft aria-hidden="true" />
					</Button>
					<AgentAvatar agent={shownAgent} size="sm" />
					<H1 className="truncate font-medium text-xl">
						{draft.name || "New agent"}
					</H1>
				</div>
				<div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
					{hasUnsavedChanges && (
						<Muted className="text-base">Unsaved changes</Muted>
					)}
					<Button
						type="button"
						variant="outline"
						onClick={close}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? (
							<Spinner className="size-4" />
						) : (
							<Save aria-hidden="true" />
						)}
						{isSubmitting ? "Saving…" : "Save agent"}
					</Button>
				</div>
			</header>
			{visibleError && (
				<Alert variant="destructive">
					<AlertDescription>{visibleError}</AlertDescription>
				</Alert>
			)}
			{discard && (
				<div
					role="alert"
					className="flex flex-wrap items-center justify-between gap-3 border-b bg-warning/5 px-6 py-3 text-sm"
				>
					<P>Discard your unsaved changes?</P>
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
							disabled={isSubmitting}
						>
							Discard
						</Button>
					</span>
				</div>
			)}
			<div className="flex min-h-0 min-w-0 flex-1 flex-col md:flex-row">
				<nav
					aria-label="Agent settings"
					className="flex shrink-0 gap-1 overflow-x-auto border-b bg-muted/40 p-3 md:w-48 md:flex-col md:overflow-x-visible md:border-r md:border-b-0 md:px-4 md:py-6"
				>
					{tabs.map(({ name, icon: Icon }) => (
						<Button
							type="button"
							key={name}
							variant="ghost"
							aria-current={tab === name ? "page" : undefined}
							onClick={() => setTab(name)}
							className={cn(
								"shrink-0 justify-start gap-2 text-left",
								tab === name
									? "bg-accent font-medium text-link"
									: "text-muted-foreground hover:bg-secondary",
							)}
						>
							<Icon aria-hidden="true" className="size-4" />
							{name}
							{name === "Subagents" &&
								draft.members.length > 0 && (
									<span className="ml-auto text-xs">
										{draft.members.length}
									</span>
								)}
						</Button>
					))}
				</nav>
				<fieldset
					disabled={isSubmitting}
					aria-label="Agent configuration"
					className="min-h-0 min-w-0 flex-1 overflow-y-auto px-5 py-7 lg:px-10"
				>
					<div className="max-w-2xl space-y-7">
						{tab === "Profile" && (
							<ProfileSettingsView
								shownAgent={shownAgent}
								selectedImage={draft.image}
								isRemovingImage={draft.removeImage}
								onChoosePhoto={choosePhoto}
								onRemovePhoto={removePhoto}
							/>
						)}
						{tab === "Capabilities" && (
							<CapabilitiesSettingsView
								agent={draft}
								disabled={isSubmitting}
								skillOptions={skillOptions}
								isLoadingSkills={isLoadingSkills}
								skillsError={skillsError}
								onRetrySkills={onRetrySkills}
								onUpdate={update}
							/>
						)}
						{tab === "Subagents" && (
							<TeamSettingsView
								agent={draft}
								agents={agents}
								shownAgent={shownAgent}
								onUpdate={update}
							/>
						)}
					</div>
				</fieldset>
			</div>
		</Form>
	);
}
