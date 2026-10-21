import { observer } from "mobx-react-lite";
import { useId, useState } from "react";
import {
	Input,
	Label,
	Muted,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { BaseSettingSection } from "../BaseSettingSection";

interface BooleanSettingsProps {
	/** Block being configured. */
	id: string;
	/** Existing boolean setting key. */
	path: "disabled" | "required";
	/** Visible field label. */
	label: string;
}

/** Edits literal booleans or expressions without migrating saved values on mount. */
export const BooleanSettings = observer(
	({ id, path, label }: BooleanSettingsProps) => {
		const { data, setData } = useBlockSettings(id);
		const controlId = useId();
		const [expressionEditor, setExpressionEditor] = useState<string | null>(
			null,
		);
		const settingKey = `${id}:${path}`;
		const value: unknown = data[path];
		const isExpression =
			expressionEditor === settingKey ||
			(typeof value !== "boolean" && value !== undefined);
		const expression = value === undefined ? "" : String(value);

		return (
			<BaseSettingSection label={label} htmlFor={controlId}>
				<div className="flex w-full min-w-0 flex-col gap-2">
					<Select
						value={
							isExpression
								? "expression"
								: value === true
									? "true"
									: "false"
						}
						onValueChange={(nextValue) => {
							if (nextValue === "expression") {
								setExpressionEditor(settingKey);
								return;
							}
							setExpressionEditor(null);
							setData(path, nextValue === "true");
						}}
					>
						<SelectTrigger id={controlId} className="w-full">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="false">False</SelectItem>
							<SelectItem value="true">True</SelectItem>
							<SelectItem value="expression">
								Use expression
							</SelectItem>
						</SelectContent>
					</Select>
					{isExpression && (
						<>
							<Label htmlFor={`${controlId}-expression`}>
								{label} expression
							</Label>
							<Input
								id={`${controlId}-expression`}
								aria-describedby={`${controlId}-hint`}
								value={expression}
								onChange={(event) => {
									const nextValue = event.target.value;
									setExpressionEditor(settingKey);
									setData(
										path,
										nextValue.trim() === "true"
											? true
											: nextValue.trim() === "false"
												? false
												: nextValue,
									);
								}}
							/>
							<Muted id={`${controlId}-hint`} className="text-xs">
								Enter a variable expression that returns true or
								false.
							</Muted>
						</>
					)}
				</div>
			</BaseSettingSection>
		);
	},
);
