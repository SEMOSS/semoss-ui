import { XIcon } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "@semoss/i18n";
import { usePixel } from "@semoss/sdk/react";
import {
	Button,
	type Control,
	Controller,
	Field,
	FieldDescription,
	FieldLabel,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import type { Engine } from "../../../types";
import { EngineSelect } from "../../engine/engine-select";
import { EngineSubtypeIcon } from "../../engine-subtype-icon";
import type { AgentFormValues } from "./types";

const MODEL_META_FILTERS = [{ tag: "text-generation" }];

const getModelName = (model: Engine) =>
	model.engine_display_name || model.engine_name;

export interface AgentModelFieldProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Locks the picker and closes its portal while saving. */
	disabled?: boolean;
}

/**
 * The agent's default model: a searchable model picker showing each model's
 * icon, name and id, with a reset back to the room's model.
 */
export const AgentModelField = ({
	control,
	disabled,
}: AgentModelFieldProps) => {
	const { t } = useTranslation("agent");
	const modelId = useId();
	// Resolves the saved model id to its name and icon. The picker loads its
	// own paginated list when opened.
	const models = usePixel<Engine[]>(
		`META | MyEngines(metaKeys=[], metaFilters=${JSON.stringify(MODEL_META_FILTERS)}, engineTypes=["MODEL"]);`,
	);

	return (
		<Controller
			name="modelId"
			control={control}
			render={({ field }) => {
				const selected = field.value
					? (models.data ?? []).find(
							(m) => m.engine_id === field.value,
						)
					: undefined;
				const selectedName = selected
					? getModelName(selected)
					: field.value
						? models.status === "LOADING"
							? t("about.loading")
							: field.value
						: "";
				const selectedIcon = selected ? (
					<EngineSubtypeIcon
						engineType={selected.engine_type}
						engineSubtype={selected.engine_subtype}
						alt=""
						className="size-5 shrink-0 object-contain"
					/>
				) : undefined;

				return (
					<Field>
						<FieldLabel htmlFor={modelId}>
							{t("about.defaultModel")}
						</FieldLabel>
						<div className="flex min-w-0 items-center gap-2">
							<EngineSelect
								id={modelId}
								disabled={disabled}
								className="h-9 flex-1 border border-input px-3 shadow-xs"
								name={selectedName || t("form.useRoomModel")}
								value={field.value}
								engineTypes={["MODEL"]}
								metaFilters={MODEL_META_FILTERS}
								showEngineId
								triggerIcon={selectedIcon}
								onChange={(model) => {
									if (!disabled)
										field.onChange(model.engine_id);
								}}
								popoverContentProps={{ align: "start" }}
							/>
							{field.value && (
								<Tooltip>
									<TooltipTrigger asChild>
										<Button
											type="button"
											variant="ghost"
											size="icon"
											disabled={disabled}
											aria-label={t("form.useRoomModel")}
											onClick={() => field.onChange("")}
										>
											<XIcon aria-hidden="true" />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										{t("form.useRoomModel")}
									</TooltipContent>
								</Tooltip>
							)}
						</div>
						<FieldDescription>
							{t("form.modelHelp")}
						</FieldDescription>
					</Field>
				);
			}}
		/>
	);
};
