import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import {
	Field,
	FieldDescription,
	FieldLabel,
	Input,
	Switch,
} from "@semoss/ui/next";
import type { AgentFormValues } from "./types";

export interface AgentExecutionLimitsFieldsProps {
	control: Control<AgentFormValues>;
}

export const AgentExecutionLimitsFields = ({
	control,
}: AgentExecutionLimitsFieldsProps) => {
	const useDefaultAgentToolsId = useId();
	const maxTurnsId = useId();
	const maxReflectionsId = useId();
	const maxSecondsId = useId();
	const maxSubagentDepthId = useId();
	const maxSubagentsPerRunId = useId();
	const maxSpawnsPerTurnId = useId();

	return (
		<>
			<Controller
				name="useDefaultAgentTools"
				control={control}
				render={({ field }) => (
					<Field orientation="horizontal">
						<div>
							<FieldLabel htmlFor={useDefaultAgentToolsId}>
								Enable built-in agent tools
							</FieldLabel>
							<FieldDescription>
								Include the platform's general-purpose tools in
								addition to your selected toolboxes.
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
			<Controller
				name="maxTurns"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxTurnsId}>Max turns</FieldLabel>
						<Input
							id={maxTurnsId}
							type="number"
							min={1}
							placeholder="30 (default)"
							{...field}
						/>
					</Field>
				)}
			/>
			<Controller
				name="maxReflections"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxReflectionsId}>
							Max reflections
						</FieldLabel>
						<Input
							id={maxReflectionsId}
							type="number"
							min={0}
							placeholder="0 (default; no reflections)"
							{...field}
						/>
					</Field>
				)}
			/>
			<Controller
				name="maxSeconds"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxSecondsId}>
							Max run seconds
						</FieldLabel>
						<Input
							id={maxSecondsId}
							type="number"
							min={0}
							placeholder="0 (default; no time limit)"
							{...field}
						/>
					</Field>
				)}
			/>
			<Controller
				name="maxSubagentDepth"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxSubagentDepthId}>
							Max subagent depth
						</FieldLabel>
						<Input
							id={maxSubagentDepthId}
							type="number"
							min={0}
							placeholder="1 (default; 0 disables subagents)"
							{...field}
						/>
					</Field>
				)}
			/>
			<Controller
				name="maxSubagentsPerRun"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxSubagentsPerRunId}>
							Max subagents per run
						</FieldLabel>
						<Input
							id={maxSubagentsPerRunId}
							type="number"
							min={0}
							placeholder="10 (default)"
							{...field}
						/>
					</Field>
				)}
			/>
			<Controller
				name="maxSpawnsPerTurn"
				control={control}
				render={({ field }) => (
					<Field>
						<FieldLabel htmlFor={maxSpawnsPerTurnId}>
							Max spawns per turn
						</FieldLabel>
						<Input
							id={maxSpawnsPerTurnId}
							type="number"
							min={0}
							placeholder="5 (default)"
							{...field}
						/>
					</Field>
				)}
			/>
		</>
	);
};
