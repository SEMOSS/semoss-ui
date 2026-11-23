import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { ProjectSelect, useAgentWorkspace } from "@semoss/shared";
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
import { useChatConfig } from "../chat/config/chat-config.context";
import {
	isNewChatMode,
	readDeploymentNewChatDefaults,
	resolveNewChatMode,
} from "../chat/config/new-chat-defaults";
import { useChatSession } from "../chat/provider/chat-session.context";
import { useChatSelector } from "../chat/store/use-chat-selector";
import {
	newChatModes,
	offersAgentMode,
} from "../conversation/composer/agent-mode-choice";
import { SettingsRow } from "./settings-row";
import { useUserNewChatDefaults } from "./use-user-new-chat-defaults";

/**
 * Value of the model's Default choice, which clears the user's own model so
 * the deployment's applies. No model id is this.
 */
const DEFAULT_VALUE = "default";

/**
 * The Chat section of the General page: the model, mode, and agent a new
 * chat starts with when this login session has not started one yet. Each
 * row but the mode's offers Default, the deployment's, beside the user's own
 * choices, shown as the field's placeholder while it is chosen. Each row
 * shows only where the deployment lets the user choose it.
 */
export const NewChatSettings = () => {
	const { t } = useTranslation("sidebar");
	const { chat } = useChatSession();
	const models = useChatSelector(chat, (chat) => chat.models.available);
	const { options } = useChatConfig();
	const preferences = useUserNewChatDefaults();
	const headingId = useId();
	const modelSelectId = useId();
	const modeLabelId = useId();
	const agentSelectId = useId();

	const canSelectModel = options.isModelSelectable;
	const canUseAgentMode = offersAgentMode(options.agentMode);
	const modes = newChatModes(options.agentMode);
	// the mode a new chat would start in, which the agent row follows
	const startMode = resolveNewChatMode(
		null,
		preferences,
		readDeploymentNewChatDefaults(options.newChat),
		modes,
	);
	const isAgentDefault = startMode === "agent";
	const defaultLabel = t("settings.general.newChat.default");

	// the saved agent's name, for the picker's trigger
	const { workspace: agent } = useAgentWorkspace(
		isAgentDefault ? preferences.agentId : null,
	);
	const agentName = agent ? agent.display_name || agent.name : "";

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
					controlId={modelSelectId}
					description={t("settings.general.newChat.modelDescription")}
				>
					<Select
						// empty shows Default as the placeholder, as an unset select does
						value={preferences.modelId ?? ""}
						onValueChange={(value) =>
							preferences.setModelId(
								value === DEFAULT_VALUE ? null : value,
							)
						}
					>
						<SelectTrigger
							id={modelSelectId}
							size="sm"
							className="w-56"
						>
							<SelectValue placeholder={defaultLabel} />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={DEFAULT_VALUE}>
								{defaultLabel}
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
			{modes.length > 1 ? (
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
						// without a choice of their own, the mode a new chat would start in
						value={startMode}
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
					controlId={agentSelectId}
					description={t("settings.general.newChat.agentDescription")}
				>
					<ProjectSelect
						id={agentSelectId}
						className={cn(
							"w-56",
							// unset shows Default as a placeholder, as the model's select does
							!preferences.agentId && "text-muted-foreground",
						)}
						name={
							preferences.agentId
								? agentName || preferences.agentId
								: ""
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
};
