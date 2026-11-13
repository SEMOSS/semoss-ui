import { observer } from "mobx-react-lite";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSessionPixel } from "@semoss/sdk/react";
import { ProjectSelect } from "@semoss/shared";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { offersAgentMode } from "@/features/conversation/agent-mode-choice";
import { isNewChatMode } from "@/features/new-chat-preferences/new-chat-preferences";
import { useNewChatPreferences } from "@/features/new-chat-preferences/use-new-chat-preferences";
import { useChat } from "@/hooks/use-chat";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";
import type { Workspace } from "@/types";
import { SettingsRow } from "./settings-row";

/** Select value of the choice that clears the default model. */
const DEPLOYMENT_MODEL_VALUE = "deployment-default";

/**
 * The Chat section of the General page: the model, mode, and agent a new
 * chat starts with when this login session has not started one yet. Each
 * row shows only where the deployment lets the user choose it.
 */
export const NewChatSettings = observer(() => {
	const { t } = useTranslation("sidebar");
	const { chat } = useChat();
	const theme = usePlaygroundTheme();
	const preferences = useNewChatPreferences();
	const headingId = useId();
	const modelId = useId();
	const modeLabelId = useId();
	const agentId = useId();

	const canSelectModel = Boolean(theme.featureFlags?.enableModelSelect);
	const canUseAgentMode = offersAgentMode(theme.featureFlags);
	const isAgentDefault = canUseAgentMode && preferences.mode === "agent";

	// the saved agent's name, for the picker's trigger
	const getAgent = useSessionPixel<Workspace | null>(
		isAgentDefault && preferences.agentId
			? `GetWorkspace(${JSON.stringify(preferences.agentId)});`
			: "",
		{ data: null },
	);
	const agentName =
		getAgent.data?.workspace_id === preferences.agentId
			? getAgent.data.display_name || getAgent.data.name
			: "";

	const models = chat.models.available;
	// a default the user can no longer see still shows, so it can be changed
	const isModelMissing =
		!!preferences.modelId &&
		!models.some((model) => model.engine_id === preferences.modelId);

	if (!canSelectModel && !canUseAgentMode) {
		return null;
	}

	return (
		<section aria-labelledby={headingId} className="mt-6 flex flex-col">
			<h3 id={headingId} className="font-semibold text-base">
				{t("settings.general.newChat.title")}
			</h3>
			{canSelectModel ? (
				<SettingsRow
					label={t("settings.general.newChat.model")}
					controlId={modelId}
					description={t("settings.general.newChat.modelDescription")}
				>
					<Select
						value={preferences.modelId ?? DEPLOYMENT_MODEL_VALUE}
						onValueChange={(value) =>
							preferences.setModelId(
								value === DEPLOYMENT_MODEL_VALUE ? null : value,
							)
						}
					>
						<SelectTrigger id={modelId} size="sm" className="w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DEPLOYMENT_MODEL_VALUE}>
								{t("settings.general.newChat.deploymentModel")}
							</SelectItem>
							{isModelMissing && preferences.modelId ? (
								<SelectItem
									value={preferences.modelId}
									disabled
								>
									{t(
										"settings.general.newChat.unavailableModel",
									)}
								</SelectItem>
							) : null}
							{models.map((model) => (
								<SelectItem
									key={model.engine_id}
									value={model.engine_id}
								>
									{model.engine_display_name ||
										model.engine_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</SettingsRow>
			) : null}
			{canUseAgentMode ? (
				<SettingsRow
					label={t("settings.general.newChat.mode")}
					labelId={modeLabelId}
					description={t("settings.general.newChat.modeDescription")}
				>
					<ToggleGroup
						type="single"
						variant="outline"
						size="sm"
						aria-labelledby={modeLabelId}
						value={preferences.mode ?? "chat"}
						// radix clears a single group to "" when the active item is
						// clicked again; a mode is always chosen
						onValueChange={(value) => {
							if (isNewChatMode(value)) {
								preferences.setMode(value);
							}
						}}
					>
						<ToggleGroupItem value="chat">
							{t("settings.general.newChat.modes.chat")}
						</ToggleGroupItem>
						<ToggleGroupItem value="agent">
							{t("settings.general.newChat.modes.agent")}
						</ToggleGroupItem>
					</ToggleGroup>
				</SettingsRow>
			) : null}
			{isAgentDefault ? (
				<SettingsRow
					label={t("settings.general.newChat.agent")}
					controlId={agentId}
					description={t("settings.general.newChat.agentDescription")}
				>
					<ProjectSelect
						id={agentId}
						className="w-56"
						name={
							preferences.agentId
								? agentName || preferences.agentId
								: t("settings.general.newChat.defaultAgent")
						}
						value={preferences.agentId ?? ""}
						onChange={(project) =>
							preferences.setAgentId(project.project_id)
						}
						projectTypes={["WORKSPACE"]}
						showProjectImage
						modal
						noneOption={{
							label: t("settings.general.newChat.defaultAgent"),
							onSelect: () => preferences.setAgentId(null),
						}}
						popoverContentProps={{ align: "end" }}
					/>
				</SettingsRow>
			) : null}
		</section>
	);
});
