import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
	FieldLegend,
	FieldSet,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
	Switch,
} from "@semoss/ui/next";
import {
	AGENT_DELEGATION_LIMITS,
	AGENT_LIMIT_TILE_CLASS_NAME,
	AGENT_RUN_BUDGET_LIMITS,
	type AgentLimitConfig,
	useAgentLimitFormat,
} from "../agent-limits";
import type { AgentFormValues } from "./types";

interface LimitFieldProps {
	control: Control<AgentFormValues>;
	config: AgentLimitConfig;
}

const LimitField = ({ control, config }: LimitFieldProps) => {
	const inputId = useId();
	const descriptionId = useId();
	const { t, validate, formatDuration } = useAgentLimitFormat();

	return (
		<Controller
			name={config.name}
			control={control}
			rules={{ validate: (v) => validate(v, config.min) ?? true }}
			render={({ field }) => {
				const error = validate(field.value, config.min);
				const duration =
					config.name === "maxSeconds" && !error
						? formatDuration(field.value)
						: undefined;
				return (
					<Field
						data-invalid={error ? true : undefined}
						className={AGENT_LIMIT_TILE_CLASS_NAME}
					>
						<FieldLabel htmlFor={inputId}>
							{t(`limits.${config.name}.label`)}
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								id={inputId}
								type="number"
								inputMode="numeric"
								min={config.min}
								step={1}
								placeholder={t("limits.defaultPlaceholder", {
									value: config.defaultValue,
								})}
								aria-describedby={descriptionId}
								aria-invalid={error ? true : undefined}
								{...field}
							/>
							<InputGroupAddon align="inline-end">
								<InputGroupText>
									{t(`limits.units.${config.unit}`)}
								</InputGroupText>
							</InputGroupAddon>
						</InputGroup>
						{error ? (
							<FieldError id={descriptionId}>{error}</FieldError>
						) : (
							<FieldDescription id={descriptionId}>
								{t(`limits.${config.name}.description`)}
								{duration &&
									` ${t("limits.currently", { duration })}`}
							</FieldDescription>
						)}
					</Field>
				);
			}}
		/>
	);
};

export interface AgentExecutionLimitsFieldsProps {
	/** React Hook Form control for the shared agent form. */
	control: Control<AgentFormValues>;
	/** Hide the master toggle when a richer default-tools field is rendered elsewhere. */
	showDefaultToolsToggle?: boolean;
}

/**
 * Run budget and subagent delegation limits. Blank fields fall back to the
 * runtime default shown in each placeholder.
 */
export const AgentExecutionLimitsFields = ({
	control,
	showDefaultToolsToggle = true,
}: AgentExecutionLimitsFieldsProps) => {
	const useDefaultAgentToolsId = useId();
	const { t } = useAgentLimitFormat();

	return (
		<div className="flex flex-col gap-6">
			{showDefaultToolsToggle && (
				<Controller
					name="useDefaultAgentTools"
					control={control}
					render={({ field }) => (
						<Field orientation="horizontal">
							<div>
								<FieldLabel htmlFor={useDefaultAgentToolsId}>
									{t("form.builtInTools.enable")}
								</FieldLabel>
								<FieldDescription>
									{t("builtInTools.help")}
								</FieldDescription>
							</div>
							<Switch
								id={useDefaultAgentToolsId}
								checked={field.value}
								onCheckedChange={field.onChange}
							/>
						</Field>
					)}
				/>
			)}
			<FieldSet className="gap-4">
				<div>
					<FieldLegend variant="label" className="mb-1">
						{t("limits.runBudget.title")}
					</FieldLegend>
					<FieldDescription>
						{t("limits.runBudget.description")}
					</FieldDescription>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					{AGENT_RUN_BUDGET_LIMITS.map((config) => (
						<LimitField
							key={config.name}
							control={control}
							config={config}
						/>
					))}
				</div>
			</FieldSet>
			<FieldSet className="gap-4">
				<div>
					<FieldLegend variant="label" className="mb-1">
						{t("limits.delegation.title")}
					</FieldLegend>
					<FieldDescription>
						{t("limits.delegation.description")}
					</FieldDescription>
				</div>
				<div className="grid gap-4 md:grid-cols-3">
					{AGENT_DELEGATION_LIMITS.map((config) => (
						<LimitField
							key={config.name}
							control={control}
							config={config}
						/>
					))}
				</div>
			</FieldSet>
		</div>
	);
};
