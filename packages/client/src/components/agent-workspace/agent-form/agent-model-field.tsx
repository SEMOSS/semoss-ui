import { useId } from "react";
import { type Control, Controller } from "react-hook-form";
import { usePixel } from "@semoss/sdk/react";
import {
	Field,
	FieldLabel,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import type { AgentFormValues, ModelEngine } from "./types";

export interface AgentModelFieldProps {
	control: Control<AgentFormValues>;
}

export const AgentModelField = ({ control }: AgentModelFieldProps) => {
	const fieldId = useId();

	const models = usePixel<ModelEngine[]>(
		`MyEngines(metaKeys=[], metaFilters=[{"tag":"text-generation"}], engineTypes=["MODEL"]);`,
	);
	const modelOptions = models.data ?? [];

	return (
		<Controller
			name="modelId"
			control={control}
			render={({ field }) => (
				<Field>
					<FieldLabel htmlFor={fieldId}>Default model</FieldLabel>
					<Select
						value={field.value}
						onValueChange={field.onChange}
						disabled={models.status === "LOADING"}
					>
						<SelectTrigger id={fieldId}>
							<SelectValue
								placeholder={
									models.status === "LOADING"
										? "Loading..."
										: "Use room model"
								}
							/>
						</SelectTrigger>
						<SelectContent>
							{modelOptions.map((m) => (
								<SelectItem
									key={m.engine_id}
									value={m.engine_id}
								>
									{m.engine_name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</Field>
			)}
		/>
	);
};
