import { UsersRound } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	AgentForm,
	type AgentFormValues,
	type AgentWorkspace,
	MembersTable,
	toAgentFormValues,
	toAgentPromptTitles,
} from "@semoss/shared";
import { Button, Spinner, toast } from "@semoss/ui/next";
import { useChat, useGlobalBreadcrumbs, useRoot } from "@/hooks";
import { getPlaygroundAgentLinks } from "@/utility/mcp-utils";

/**
 * Renders the EditWorkspacePage for editing existing agents.
 *
 * The shared agent form (the same one the platform's agent editor uses)
 * followed by the members table, which saves per action rather than with
 * the form.
 */
export const EditWorkspacePage = observer(() => {
	const { t } = useTranslation(["workspace", "common", "notifications"]);
	const { workspaceId } = useParams<{ workspaceId: string }>();
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();
	const featureFlags = root.theme.featureFlags;

	const [formValues, setFormValues] = useState<AgentFormValues | null>(null);
	const [isSaving, setIsSaving] = useState(false);

	const getWorkspace = usePixel<AgentWorkspace>(
		workspaceId ? `GetWorkspace(workspaceId=["${workspaceId}"]);` : "",
		{
			data: null,
			onError: (_d, e) => {
				toast.error(
					t("workspace:edit.failedToLoad", {
						error: e instanceof Error ? e.message : "Unknown error",
					}),
				);
			},
		},
	);

	useGlobalBreadcrumbs({
		breadcrumbs: [
			{ name: t("workspace:breadcrumbs.home"), path: "/" },
			{ name: t("workspace:breadcrumbs.agent"), path: "/agent" },
			{
				name:
					getWorkspace.status === "SUCCESS"
						? getWorkspace.data.name
						: t("workspace:breadcrumbs.loading"),
				path: `/agent/${workspaceId}`,
			},
			{
				name: t("workspace:breadcrumbs.edit"),
				path: `/agent/${workspaceId}/edit`,
			},
		],
	});

	// The values the form was seeded with; the form owns edits after that
	const initialValues = useMemo(
		() =>
			getWorkspace.status === "SUCCESS" && getWorkspace.data
				? toAgentFormValues(getWorkspace.data)
				: null,
		[getWorkspace.status, getWorkspace.data],
	);

	useEffect(() => {
		setFormValues(initialValues);
	}, [initialValues]);

	const isDirty =
		!!formValues &&
		!!initialValues &&
		JSON.stringify(formValues) !== JSON.stringify(initialValues);

	if (
		workspaceId &&
		(getWorkspace.status === "INITIAL" || getWorkspace.status === "LOADING")
	) {
		return (
			<div className="flex h-full w-full items-center justify-center">
				<Spinner />
			</div>
		);
	}

	if (getWorkspace.status === "ERROR" || !workspaceId || !initialValues) {
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

	const handleCancel = () => {
		navigate(`/agent/${workspaceId}`);
	};

	const handleSave = async () => {
		if (isSaving || !formValues) return;

		setIsSaving(true);
		try {
			const warning = await chat.editWorkspace(workspaceId, formValues);
			if (warning) {
				toast.warning(warning);
			}
			navigate(`/agent/${workspaceId}`);
		} catch (err) {
			toast.error(
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
			<div className="mx-auto flex w-full max-w-5xl flex-col gap-6 @3xl:px-12 @md:px-6 px-4 pt-8 pb-4">
				{/* Sticky header so Save/Cancel stay reachable while scrolling */}
				<div className="-mx-4 -mt-8 @md:-mx-6 @3xl:-mx-12 sticky top-0 z-20 flex flex-row items-center gap-3 border-border border-b bg-background/95 @3xl:px-12 @md:px-6 px-4 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
					<div className="min-w-0 flex-1">
						<div className="truncate font-semibold text-2xl text-foreground leading-tight">
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
								isSaving || !formValues?.name.trim() || !isDirty
							}
							data-testid="workspace-edit-page--save-btn"
						>
							{isSaving ? (
								<Spinner className="size-4" />
							) : (
								t("workspace:actions.save")
							)}
						</Button>
					</div>
				</div>

				<AgentForm
					data={initialValues}
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

				{/* Members (saved per-action, not with the form) */}
				<section className="flex flex-col gap-3">
					<h2 className="flex items-center gap-2 font-semibold text-foreground text-lg">
						<UsersRound className="size-5" />
						{t("workspace:detail.tabs.members")}
					</h2>
					<p className="text-muted-foreground text-xs">
						{t("workspace:members.autoSaveHint")}
					</p>
					<div className="min-h-32">
						<MembersTable id={workspaceId} type="WORKSPACE" />
					</div>
				</section>
			</div>
		</div>
	);
});
