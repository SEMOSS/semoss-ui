import { UsersRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { editAgent, useAgentWorkspace } from "@semoss/chat";
import { useTranslation } from "@semoss/i18n";
import { useConfig } from "@semoss/sdk/react";
import {
	AgentForm,
	type AgentFormValues,
	MembersTable,
	toAgentFormValues,
	toAgentPromptTitles,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { getErrorMessage } from "@semoss/utility/error";
import { getPlaygroundAgentLinks } from "@/features/agents/agent-links";
import { usePlaygroundTheme } from "@/features/theme/use-playground-theme";

/** The values the form was seeded with, and the agent they belong to. */
interface AgentFormSeed {
	/** The agent the values were read from. */
	workspaceId: string;
	/** The form's starting values, also what Save compares against. */
	values: AgentFormValues;
}

/** Props for {@link AgentEdit}. */
interface AgentEditProps {
	/** The agent to edit. */
	workspaceId?: string;
}

/**
 * Edit an agent.
 *
 * The shared agent form, the same one the client's agent pages use, under a
 * sticky Cancel/Save header, followed by the members table, which saves per
 * action rather than with the form. A failed save shows inline and keeps the
 * form's values for a retry.
 */
export const AgentEdit = ({ workspaceId }: AgentEditProps) => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const isDirectoryAvailable = useConfig(
		(state) => state.config?.msGraphLookup === true,
	);
	const navigate = useNavigate();
	const theme = usePlaygroundTheme();
	const featureFlags = theme.featureFlags;

	const [seed, setSeed] = useState<AgentFormSeed | null>(null);
	const [formValues, setFormValues] = useState<AgentFormValues | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const seededWorkspaceId = useRef<string | null>(null);

	const agent = useAgentWorkspace(workspaceId);

	// a failed read is announced once, as it lands
	useEffect(() => {
		if (!agent.error) return;
		toast.error(
			t("workspace:edit.failedToLoad", {
				error: getErrorMessage(
					agent.error,
					t("workspace:messages.unknownError"),
				),
			}),
		);
	}, [agent.error, t]);

	// AgentForm reads its values once on mount, so it is seeded once per
	// agent: a refetch never overwrites unsaved edits, and a different agent
	// remounts the form with its own values
	useEffect(() => {
		const workspace = agent.workspace;
		if (
			!workspaceId ||
			!workspace ||
			seededWorkspaceId.current === workspaceId
		)
			return;
		const values = {
			...toAgentFormValues(workspace),
			instructions: (workspace.system_prompt || "").replace(/\\n/g, "\n"),
		};
		seededWorkspaceId.current = workspaceId;
		setSeed({ workspaceId, values });
		setFormValues(values);
		setSaveError(null);
	}, [workspaceId, agent.workspace]);

	if (agent.status === "LOADING") {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (!workspaceId || !agent.workspace) {
		return (
			<div className="@container relative h-full w-full overflow-hidden">
				<div className="mx-auto flex h-full w-full max-w-5xl flex-col gap-8 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
					<h1 className="font-semibold text-2xl">
						{t("workspace:edit.errorTitle")}
					</h1>
					<p className="text-base text-muted-foreground">
						{t("workspace:edit.errorDescription")}
					</p>
				</div>
			</div>
		);
	}

	if (!seed || seed.workspaceId !== workspaceId || !formValues) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	// Save is offered only once something changed
	const isDirty = JSON.stringify(formValues) !== JSON.stringify(seed.values);

	/** Leaves without saving, back to the agent's page. */
	const handleCancel = () => {
		navigate(`/agent/${workspaceId}`);
	};

	/** Saves the edits and returns to the agent's page. */
	const handleSave = async () => {
		const name = formValues.name.trim();
		if (isSaving || !name) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const warning = await editAgent(workspaceId, {
				...formValues,
				name,
			});
			if (warning) toast.warning(warning);
			navigate(`/agent/${workspaceId}`);
		} catch (err) {
			// The form keeps its values, so a retry sends the same edits
			setSaveError(
				err instanceof Error && err.message
					? err.message
					: t("notifications:workspace.saveError"),
			);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="@container h-full w-full overflow-y-auto">
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6">
				{/* Sticky header so Save/Cancel stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<div className="min-w-0 flex-1">
						<div className="font-semibold text-2xl text-foreground leading-tight">
							{t("workspace:edit.title")}
						</div>
						<div className="text-muted-foreground text-sm">
							{t("workspace:edit.subtitle")}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							data-testid="workspace-edit-page--cancel-btn"
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							type="button"
							onClick={handleSave}
							disabled={
								isSaving || !formValues.name.trim() || !isDirty
							}
							data-testid="workspace-edit-page--save-btn"
						>
							{t("workspace:actions.save")}
						</Button>
					</div>
				</div>

				{saveError && (
					<Alert variant="destructive">
						<AlertDescription>{saveError}</AlertDescription>
					</Alert>
				)}

				<AgentForm
					key={seed.workspaceId}
					data={seed.values}
					onChange={setFormValues}
					disabled={isSaving}
					promptTitles={toAgentPromptTitles(agent.workspace)}
					knownHookKinds={agent.workspace.known_hook_kinds ?? []}
					defaultTools={agent.workspace.default_tools ?? []}
					workspaceId={workspaceId}
					links={getPlaygroundAgentLinks(
						featureFlags?.showPlatformLinks,
					)}
					showName
					enableKnowledgeMCP={featureFlags?.enableKnowledgeMCP}
					showSystemTools={featureFlags?.showSystemTools}
					showSystemSkills={featureFlags?.showSystemSkills}
					className="p-0"
				/>

				{/* Members (saved per action, not with the form) */}
				<section className="flex flex-col gap-3">
					<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
						<UsersRound className="size-5" />
						{t("workspace:detail.tabs.members")}
					</h2>
					<p className="text-muted-foreground text-xs">
						{t("workspace:members.autoSaveHint")}
					</p>
					<div className="min-h-32">
						<MembersTable
							id={workspaceId}
							type="WORKSPACE"
							isDirectoryAvailable={isDirectoryAvailable}
						/>
					</div>
				</section>
			</div>
		</div>
	);
};
