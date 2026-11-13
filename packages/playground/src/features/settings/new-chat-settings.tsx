import { observer } from "mobx-react-lite";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { useSessionPixel } from "@semoss/sdk/react";
import { ProjectSelect } from "@semoss/shared";
import {
	cn,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	ToggleGroup,
	ToggleGroupItem,
} from "@semoss/ui/next";
import { offersAgentMode } from "@/features/conversation/agent-mode-choice";
import {
	isNewChatMode,
	readDeploymentNewChatDefaults,
} from "@/features/new-chat-preferences/new-chat-preferences";
import { useNewChatPreferences } from "@/features/new-chat-preferences/use-new-chat-preferences";
import { useChat } from "@/hooks/use-chat";
import { usePlaygroundTheme } from "@/hooks/use-playground-theme";
import type { Workspace } from "@/types";
import { SettingsRow } from "./settings-row";

/**
 * Value of each row's Default choice, which clears the user's own value so
 * the deployment's applies. Model, mode, and agent ids are never this.
 */
const DEFAULT_VALUE = "default";

/** Sets the Default choice apart from the user's own values. */
const DEFAULT_CHOICE_CLASS = "text-muted-foreground italic";

/**
 * The Chat section of the General page: the model, mode, and agent a new
 * chat starts with when this login session has not started one yet. Each
 * row offers Default, the deployment's, beside the user's own choices, and
 * shows only where the deployment lets the user choose it.
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
	// the agent row follows the mode a new chat would start in
	const isAgentDefault =
		canUseAgentMode &&
		(preferences.mode ?? readDeploymentNewChatDefaults(theme).mode) ===
			"agent";
	const defaultLabel = t("settings.general.newChat.default");

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
						value={preferences.modelId ?? DEFAULT_VALUE}
						onValueChange={(value) =>
							preferences.setModelId(
								value === DEFAULT_VALUE ? null : value,
							)
						}
					>
						<SelectTrigger id={modelId} size="sm" className="w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DEFAULT_VALUE}>
								<span className={DEFAULT_CHOICE_CLASS}>
									{defaultLabel}
								</span>
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
						value={preferences.mode ?? DEFAULT_VALUE}
						// radix clears a single group to "" when the active item is
						// clicked again; a choice is always made
						onValueChange={(value) => {
							if (value === DEFAULT_VALUE) {
								preferences.setMode(null);
							} else if (isNewChatMode(value)) {
								preferences.setMode(value);
							}
						}}
					>
						<ToggleGroupItem
							value={DEFAULT_VALUE}
							className={DEFAULT_CHOICE_CLASS}
						>
							{defaultLabel}
						</ToggleGroupItem>
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
						className={cn(
							"w-56",
							!preferences.agentId && DEFAULT_CHOICE_CLASS,
						)}
						name={
							preferences.agentId
								? agentName || preferences.agentId
								: defaultLabel
						}
						value={preferences.agentId ?? ""}
						onChange={(project) =>
							preferences.setAgentId(project.project_id)
						}
						projectTypes={["WORKSPACE"]}
						showProjectImage
						modal
						noneOption={{
							label: defaultLabel,
							onSelect: () => preferences.setAgentId(null),
						}}
						popoverContentProps={{ align: "end" }}
					/>
				</SettingsRow>
			) : null}
		</section>
	);
});
