import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	AGENT_FORM_DEFAULT_VALUES,
	type AgentDefaultTool,
	AgentForm,
	type AgentFormValues,
} from "@semoss/shared";
import {
	Alert,
	AlertDescription,
	Button,
	Spinner,
	toast,
} from "@semoss/ui/next";
import { useChat } from "@/hooks/use-chat";
import { useRoot } from "@/hooks/use-root";
import { getPlaygroundAgentLinks } from "@/utility/mcp-utils";

/**
 * Renders the NewWorkspacePage for creating new agents.
 *
 * The shared agent form, the same one the client's agent pages use, under a
 * sticky Cancel/Create header. Members are managed from the edit page once
 * the agent exists.
 */
export const NewWorkspacePage = observer(() => {
	const { t } = useTranslation([
		"workspace",
		"common",
		"notifications",
		"agent",
	]);
	const navigate = useNavigate();
	const { chat } = useChat();
	const { root } = useRoot();
	const featureFlags = root.theme.featureFlags;

	const [formValues, setFormValues] = useState<AgentFormValues>(
		AGENT_FORM_DEFAULT_VALUES,
	);
	const [isSaving, setIsSaving] = useState(false);
	const [saveError, setSaveError] = useState<string | null>(null);

	// The built-in tool catalog and hook kinds are deployment-level, so they
	// are available before the agent exists
	const formOptions = usePixel<{
		default_tools?: AgentDefaultTool[];
		known_hook_kinds?: string[];
	}>("GetAgentFormOptions();");
	const isLoadingOptions =
		formOptions.status === "INITIAL" || formOptions.status === "LOADING";

	const handleCancel = () => {
		navigate("/agent");
	};

	const handleCreate = async () => {
		const name = formValues.name.trim();
		if (isSaving || isLoadingOptions || !name) return;
		setIsSaving(true);
		setSaveError(null);
		try {
			const { workspaceId, warning, settingsFailed } =
				await chat.createAgent({ ...formValues, name });
			if (settingsFailed) {
				toast.error(t("agent:form.createSettingsFailed"));
			} else if (warning) {
				toast.warning(warning);
			}
			navigate(`/agent/${workspaceId}`);
		} catch (err) {
			// The form keeps its values, so a retry sends the same configuration
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
				{/* Sticky header so Cancel/Create stay reachable while scrolling */}
				<div className="-mx-4 -mt-6 sm:-mx-6 sticky top-0 z-20 flex flex-wrap items-center gap-3 border-b bg-background px-4 py-4 sm:px-6">
					<div className="min-w-0 flex-1">
						<div className="font-semibold text-2xl text-foreground leading-tight">
							{t("workspace:new.title")}
						</div>
						<div className="text-muted-foreground text-sm">
							{t("workspace:new.subtitle")}
						</div>
					</div>
					<div className="flex shrink-0 items-center gap-2">
						<Button
							type="button"
							variant="outline"
							onClick={handleCancel}
							disabled={isSaving}
							data-testid="workspace-new-page--cancel-btn"
						>
							{t("common:buttons.cancel")}
						</Button>
						<Button
							type="button"
							onClick={handleCreate}
							disabled={
								isSaving ||
								isLoadingOptions ||
								!formValues.name.trim()
							}
							data-testid="workspace-new-page--create-btn"
						>
							{t("workspace:actions.create")}
						</Button>
					</div>
				</div>

				{saveError && (
					<Alert variant="destructive">
						<AlertDescription>{saveError}</AlertDescription>
					</Alert>
				)}

				{isLoadingOptions ? (
					<div className="flex w-full items-center justify-center py-12">
						<Spinner />
					</div>
				) : (
					<AgentForm
						data={AGENT_FORM_DEFAULT_VALUES}
						onChange={setFormValues}
						disabled={isSaving}
						knownHookKinds={
							formOptions.data?.known_hook_kinds ?? []
						}
						defaultTools={formOptions.data?.default_tools ?? []}
						links={getPlaygroundAgentLinks(
							featureFlags?.showPlatformLinks,
						)}
						showName
						enableKnowledgeMCP={featureFlags?.enableKnowledgeMCP}
						showSystemTools={featureFlags?.showSystemTools}
						showSystemSkills={featureFlags?.showSystemSkills}
						className="p-0"
					/>
				)}
			</div>
		</div>
	);
});
