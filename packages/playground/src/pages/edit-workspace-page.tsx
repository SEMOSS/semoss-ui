import { UsersRound } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { useInsight, usePixel } from "@semoss/sdk/react";
import {
	AgentForm,
	type AgentFormValues,
	type AgentWorkspace,
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
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import { getPlaygroundAgentLinks } from "@/utility/mcp-utils";

/** The values the form was seeded with, and the agent they belong to. */
interface AgentFormSeed {
	workspaceId: string;
	values: AgentFormValues;
}

/**
 * Renders the EditWorkspacePage for editing existing agents.
 *
 * The shared agent form, the same one the client's agent pages use, followed
 * by the members table, which saves per action rather than with the form.
 */
export const EditWorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const { system } = useInsight();
	const isDirectoryAvailable = system?.config.msGraphLookup === true;
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();
	const featureFlags = root.theme.featureFlags;

	const [seed, setSeed] = useState<AgentFormSeed | null>(null);
	const [formValues, setFormValues] = useState<AgentFormValues | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);
	const seededWorkspace = useRef<string | null>(null);

	const getWorkspace = usePixel<AgentWorkspace & { workspace_id: string }>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("workspace:edit.failedToLoad", {
						error: getErrorMessage(e, "Unknown error"),
					}),
				);
			},
		},
	);

	// AgentForm reads its values once on mount, so it is seeded once per
	// agent: a refetch never overwrites unsaved edits, and a different agent
	// remounts the form with its own values
	useEffect(() => {
		if (
			getWorkspace.status !== "SUCCESS" ||
			!getWorkspace.data ||
			getWorkspace.data.workspace_id !== workspaceId ||
			seededWorkspace.current === workspaceId
		)
			return;
		const w = getWorkspace.data;
		const values = {
			...toAgentFormValues(w),
			instructions: (w.system_prompt || "").replace(/\\n/g, "\n"),
		};
		seededWorkspace.current = workspaceId;
		setSeed({ workspaceId, values });
		setFormValues(values);
		setSaveError(null);
	}, [workspaceId, getWorkspace.status, getWorkspace.data]);

	if (
		getWorkspace.status === "INITIAL" ||
		getWorkspace.status === "LOADING"
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (
		getWorkspace.status === "ERROR" ||
		!workspaceId ||
		!getWorkspace.data ||
		getWorkspace.data.workspace_id !== workspaceId
	) {
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

	const isDirty = JSON.stringify(formValues) !== JSON.stringify(seed.values);

	const handleCancel = () => {
		navigate(`/agent/${workspaceId}`);
	};

	const handleSave = async () => {
		const name = formValues.name.trim();
		if (isSaving || !name) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const warning = await chat.editWorkspace(workspaceId, {
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
					promptTitles={toAgentPromptTitles(getWorkspace.data)}
					knownHookKinds={getWorkspace.data.known_hook_kinds ?? []}
					defaultTools={getWorkspace.data.default_tools ?? []}
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
});
