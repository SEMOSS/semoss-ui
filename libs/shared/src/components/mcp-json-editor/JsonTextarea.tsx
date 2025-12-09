import { AlertCircle, CheckCircle } from "lucide-react";
import type React from "react";
import { useState } from "react";
import { Textarea } from "@semoss/ui/next";
import type { JsonTextareaProps } from "./types";

// Utility function for JSON validation (moved from utils.ts)
const jsonValidator = (value: string): { valid: boolean; error?: string } => {
	try {
		JSON.parse(value);
		return { valid: true };
	} catch (e) {
		return {
			valid: false,
			error: e instanceof Error ? e.message : "Invalid JSON",
		};
	}
};

export const JsonTextarea: React.FC<JsonTextareaProps> = ({
	value,
	onChange,
	disabled = false,
	placeholder = "{}",
	height = "4.5rem",
	validator = jsonValidator,
	showValidation = true,
	className = "",
}) => {
	const [error, setError] = useState<string | undefined>();
	const [isValid, setIsValid] = useState(true);

	const handleChange = (newValue: string) => {
		onChange(newValue);

		if (validator && showValidation) {
			const result = validator(newValue);
			setIsValid(result.valid);
			setError(result.error);
		}
	};

	return (
		<div className={className}>
			<Textarea
				value={value}
				onChange={(e) => handleChange(e.target.value)}
				disabled={disabled}
				rows={3}
				style={{ height }}
				className={`w-full resize-y overflow-y-auto px-1.5 py-1 font-mono text-xs ${
					error ? "border-red-500 focus:border-red-500" : ""
				} ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
				placeholder={placeholder}
			/>
			{showValidation && error && (
				<div className="mt-1 flex items-start gap-1 text-red-600 text-xs">
					<AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
					<span>{error}</span>
				</div>
			)}
			{showValidation && !error && value && isValid && (
				<div className="mt-1 flex items-center gap-1 text-green-600 text-xs">
					<CheckCircle size={12} className="flex-shrink-0" />
					<span>Valid JSON</span>
				</div>
			)}
		</div>
	);
};
