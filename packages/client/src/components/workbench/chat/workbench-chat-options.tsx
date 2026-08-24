import { ChevronDownIcon, RotateCcwIcon } from "lucide-react";
import { useId, useMemo, useState } from "react";
import { usePixel } from "@semoss/sdk/react";
import type { Engine } from "@semoss/shared";
import { EngineSelect } from "@semoss/shared";
import {
	Button,
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Popover,
	PopoverContent,
	PopoverTrigger,
	ScrollArea,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
	Switch,
} from "@semoss/ui/next";
import type { WorkbenchChatModelOptions } from "@/api/rooms";

const DEFAULT_REASONING_EFFORTS = ["low", "medium", "high"];
const DEFAULT_OPTION = "__provider_default__";

interface WorkbenchModelMetadata {
	maxOutputTokens?: number | null;
	attachment?: boolean | null;
	reasoning?: boolean | null;
	temperature?: boolean | null;
	supportedParameters?: string[] | null;
	reasoningConfig?: {
		default_effort?: string | null;
		supported_efforts?: string[] | null;
	};
}

interface WorkbenchChatOptionsProps {
	model: Engine | null;
	disabled: boolean;
	options: WorkbenchChatModelOptions;
	onOptionsChange: (options: WorkbenchChatModelOptions) => void;
	onModelChange: (model: Engine) => void;
	showThinking: boolean;
	onShowThinkingChange: (showThinking: boolean) => void;
}

const normalizeParameter = (parameter: string): string =>
	parameter.trim().toLowerCase().replaceAll("-", "_");

/** Model selector and request controls shown above the compact composer. */
export const WorkbenchChatOptions = ({
	model,
	disabled,
	options,
	onOptionsChange,
	onModelChange,
	showThinking,
	onShowThinkingChange,
}: WorkbenchChatOptionsProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const fieldId = useId();
	const maxTokensId = `${fieldId}-max-tokens`;
	const temperatureId = `${fieldId}-temperature`;
	const topPId = `${fieldId}-top-p`;
	const frequencyPenaltyId = `${fieldId}-frequency-penalty`;
	const presencePenaltyId = `${fieldId}-presence-penalty`;
	const showThinkingId = `${fieldId}-show-thinking`;
	const metadata = usePixel<WorkbenchModelMetadata>(
		model?.engine_id
			? `GetModelMetadata(engine=[${JSON.stringify(model.engine_id)}]);`
			: "",
	);
	const supportedParameters = useMemo(
		() =>
			new Set(
				(metadata.data?.supportedParameters ?? []).map(
					normalizeParameter,
				),
			),
		[metadata.data?.supportedParameters],
	);
	const hasDeclaredParameters = supportedParameters.size > 0;
	const supports = (...parameters: string[]) =>
		!hasDeclaredParameters ||
		parameters.some((parameter) =>
			supportedParameters.has(normalizeParameter(parameter)),
		);
	const reasoningEfforts = useMemo(() => {
		const configured =
			metadata.data?.reasoningConfig?.supported_efforts ?? [];
		const efforts = configured.length
			? configured
			: DEFAULT_REASONING_EFFORTS;
		return Array.from(
			new Set(
				[
					...efforts,
					metadata.data?.reasoningConfig?.default_effort,
				].filter((effort): effort is string => Boolean(effort)),
			),
		);
	}, [metadata.data?.reasoningConfig]);

	const updateNumber = (
		key: keyof WorkbenchChatModelOptions,
		value: string,
	) => {
		const next = { ...options };
		if (value === "") {
			delete next[key];
		} else {
			const parsed = Number(value);
			if (Number.isFinite(parsed)) {
				Object.assign(next, { [key]: parsed });
			}
		}
		onOptionsChange(next);
	};

	const updateReasoningEffort = (effort: string) => {
		const next = { ...options };
		if (effort === DEFAULT_OPTION) {
			delete next.reasoning_effort;
		} else {
			next.reasoning_effort = effort;
		}
		onOptionsChange(next);
	};

	const modelName =
		model?.engine_display_name || model?.engine_name || "Select model";
	const temperatureSupported =
		metadata.data?.temperature !== false && supports("temperature");
	const reasoningSupported =
		metadata.data?.reasoning !== false && supports("reasoning_effort");
	const hasCustomOptions = Object.keys(options).length > 0;

	return (
		<Popover open={isOpen} onOpenChange={setIsOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="h-8 min-w-0 max-w-44 gap-1.5 px-2"
					aria-label="Model and chat options"
					disabled={disabled}
				>
					<span className="truncate text-xs">{modelName}</span>
					{hasCustomOptions ? (
						<span
							className="size-1.5 shrink-0 rounded-full bg-primary"
							aria-hidden
						/>
					) : null}
					<ChevronDownIcon className="size-3.5 shrink-0 opacity-70" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				side="top"
				align="start"
				sideOffset={8}
				collisionPadding={8}
				className="w-80 max-w-[calc(100vw-2rem)] p-0"
			>
				<div className="flex items-center gap-3 border-border border-b px-4 py-3">
					<div className="min-w-0 flex-1">
						<p className="font-medium text-sm">Model options</p>
						<p className="text-muted-foreground text-xs">
							Configure this room&apos;s model requests
						</p>
					</div>
					{hasCustomOptions ? (
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="h-7 gap-1.5 px-2 text-xs"
							onClick={() => onOptionsChange({})}
						>
							<RotateCcwIcon className="size-3.5" />
							Reset
						</Button>
					) : null}
				</div>
				<ScrollArea className="max-h-[min(65vh,32rem)]">
					<div className="flex flex-col gap-4 p-4">
						<Field>
							<FieldLabel>Model</FieldLabel>
							<EngineSelect
								className="h-9 w-full min-w-0 max-w-full shrink justify-start border border-input px-3 shadow-xs"
								name={modelName}
								value={model?.engine_id || ""}
								engineTypes={["MODEL"]}
								metaFilters={[{ tag: "text-generation" }]}
								disabled={disabled}
								onChange={(nextModel) => {
									onOptionsChange({});
									onModelChange(nextModel);
								}}
								popoverContentProps={{
									align: "start",
									className: "w-72 max-w-72",
								}}
							/>
						</Field>

						<Separator />

						<p className="font-medium text-muted-foreground text-xs uppercase">
							Generation
						</p>
						<div className="grid grid-cols-2 gap-3">
							<Field>
								<FieldLabel htmlFor={maxTokensId}>
									Max tokens
								</FieldLabel>
								<Input
									id={maxTokensId}
									type="number"
									min={1}
									max={
										metadata.data?.maxOutputTokens ??
										undefined
									}
									placeholder={
										metadata.data?.maxOutputTokens
											? metadata.data.maxOutputTokens.toLocaleString()
											: "Default"
									}
									value={options.max_tokens ?? ""}
									onChange={(event) =>
										updateNumber(
											"max_tokens",
											event.target.value,
										)
									}
								/>
							</Field>
							<Field data-disabled={!temperatureSupported}>
								<FieldLabel htmlFor={temperatureId}>
									Temperature
								</FieldLabel>
								<Input
									id={temperatureId}
									type="number"
									min={0}
									max={2}
									step={0.1}
									placeholder="Default"
									disabled={!temperatureSupported}
									value={options.temperature ?? ""}
									onChange={(event) =>
										updateNumber(
											"temperature",
											event.target.value,
										)
									}
								/>
							</Field>
							<Field data-disabled={!supports("top_p")}>
								<FieldLabel htmlFor={topPId}>Top P</FieldLabel>
								<Input
									id={topPId}
									type="number"
									min={0}
									max={1}
									step={0.05}
									placeholder="Default"
									disabled={!supports("top_p")}
									value={options.top_p ?? ""}
									onChange={(event) =>
										updateNumber(
											"top_p",
											event.target.value,
										)
									}
								/>
							</Field>
							<Field
								data-disabled={!supports("frequency_penalty")}
							>
								<FieldLabel htmlFor={frequencyPenaltyId}>
									Frequency penalty
								</FieldLabel>
								<Input
									id={frequencyPenaltyId}
									type="number"
									min={-2}
									max={2}
									step={0.1}
									placeholder="Default"
									disabled={!supports("frequency_penalty")}
									value={options.frequency_penalty ?? ""}
									onChange={(event) =>
										updateNumber(
											"frequency_penalty",
											event.target.value,
										)
									}
								/>
							</Field>
							<Field
								data-disabled={!supports("presence_penalty")}
							>
								<FieldLabel htmlFor={presencePenaltyId}>
									Presence penalty
								</FieldLabel>
								<Input
									id={presencePenaltyId}
									type="number"
									min={-2}
									max={2}
									step={0.1}
									placeholder="Default"
									disabled={!supports("presence_penalty")}
									value={options.presence_penalty ?? ""}
									onChange={(event) =>
										updateNumber(
											"presence_penalty",
											event.target.value,
										)
									}
								/>
							</Field>
							<Field data-disabled={!reasoningSupported}>
								<FieldLabel>Reasoning effort</FieldLabel>
								<Select
									value={
										options.reasoning_effort ??
										DEFAULT_OPTION
									}
									disabled={!reasoningSupported}
									onValueChange={updateReasoningEffort}
								>
									<SelectTrigger className="w-full" size="sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={DEFAULT_OPTION}>
											Provider default
										</SelectItem>
										{reasoningEfforts.map((effort) => (
											<SelectItem
												key={effort}
												value={effort}
											>
												{effort
													.charAt(0)
													.toUpperCase() +
													effort.slice(1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</Field>
						</div>

						<Separator />

						<Field orientation="horizontal">
							<div>
								<FieldLabel htmlFor={showThinkingId}>
									Show thinking
								</FieldLabel>
								<FieldDescription className="text-xs">
									Display model reasoning in responses
								</FieldDescription>
							</div>
							<Switch
								id={showThinkingId}
								checked={showThinking}
								onCheckedChange={onShowThinkingChange}
							/>
						</Field>

						{metadata.data?.attachment === false ? (
							<p className="text-muted-foreground text-xs">
								The selected model reports no attachment
								support.
							</p>
						) : null}
					</div>
				</ScrollArea>
			</PopoverContent>
		</Popover>
	);
};
