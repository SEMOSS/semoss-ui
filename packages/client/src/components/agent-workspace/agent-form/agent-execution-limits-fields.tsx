import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import { Field, FieldLabel, Input } from "@semoss/ui/next";
import type { AgentFormValues } from "./types";

export interface AgentExecutionLimitsFieldsProps {
	control: Control<AgentFormValues>;
}

export const AgentExecutionLimitsFields = ({
	control,
}: AgentExecutionLimitsFieldsProps) => {
	const maxTurnsId = useId();
	const maxReflectionsId = useId();
	const maxSubagentDepthId = useId();
	const maxSubagentsPerRunId = useId();
	const maxSpawnsPerTurnId = useId();

	return (
		<>
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
							placeholder="0 (default, off)"
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
