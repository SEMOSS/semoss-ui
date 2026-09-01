import { SlidersHorizontalIcon } from "lucide-react";
import { useId } from "react";
import {
	Field,
	FieldDescription,
	FieldLabel,
	ScrollArea,
	Separator,
	Textarea,
} from "@semoss/ui/next";
import { EngineBuiltinToolsField } from "@/components/engine";
import { useModelChat } from "@/hooks";
import type { WorkbenchPanelConfig } from "@/stores/workbench";

/**
 * Per-conversation model configuration: the system prompt and the
 * provider-hosted built-in tools the model may use. Both are persisted onto
 * the room, so resuming a conversation restores how it was tuned — neither
 * changes the engine's saved metadata.
 *
 * @name ModelChatSettings
 * @return The settings panel body.
 */
const ModelChatSettings = () => {
	const config = useModelChat((state) => state.config);
	const setConfig = useModelChat((state) => state.setConfig);
	const builtinTools = useModelChat((state) => state.builtinTools);

	const fieldId = useId();
	const instructionsId = `${fieldId}-instructions`;

	const catalog = builtinTools.tools ?? {};
	const hasCatalog = Object.keys(catalog).length > 0;

	return (
		<ScrollArea className="min-h-0 flex-1">
			<div
				className="flex flex-col gap-4 p-3"
				data-testid="model-chat-settings"
			>
				<Field>
					<FieldLabel htmlFor={instructionsId}>
						System prompt
					</FieldLabel>
					<Textarea
						id={instructionsId}
						value={config.instructions}
						placeholder="Tell the model how it should behave"
						className="min-h-48"
						onChange={(event) =>
							setConfig({ instructions: event.target.value })
						}
						data-testid="model-chat-settings-instructions"
					/>
				</Field>

				{/*
				 * The built-in tools catalog is optional: an install without one,
				 * or a model whose providers the catalog does not cover, offers
				 * nothing to configure. Stay quiet rather than showing an empty
				 * section that promises a capability the model does not have.
				 */}
				{hasCatalog && (
					<>
						<Separator />
						<Field>
							<FieldLabel>Model tools</FieldLabel>
							<FieldDescription>
								Tools this model's provider runs itself, for
								this conversation only. Does not change the
								tools saved on the engine.
							</FieldDescription>
							<EngineBuiltinToolsField
								tools={catalog}
								value={config.builtinTools}
								onChange={(next) =>
									setConfig({ builtinTools: next })
								}
								testId="model-chat-settings-builtin-tools"
							/>
						</Field>
					</>
				)}
			</div>
		</ScrollArea>
	);
};

/**
 * Blueprint for the model settings border panel. keepAlive: the scroll
 * position is local state a user would miss after toggling the border.
 *
 * @name MODEL_CHAT_SETTINGS_PANEL
 */
export const MODEL_CHAT_SETTINGS_PANEL: WorkbenchPanelConfig = {
	name: "Model",
	helpText: "Model settings",
	icon: ({ className }) => <SlidersHorizontalIcon className={className} />,
	canClose: false,
	canRename: false,
	mount: "keepAlive",
	content: ModelChatSettings,
};
