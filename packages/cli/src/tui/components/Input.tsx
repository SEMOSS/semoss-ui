import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { useState } from "react";

interface InputProps {
	onSubmit: (command: string) => void;
	placeholder?: string;
	disabled?: boolean;
	onHistoryUp?: () => string | null;
	onHistoryDown?: () => string | null;
	gitBranch?: string | undefined;
}

export const Input: React.FC<InputProps> = ({
	onSubmit,
	placeholder = "Enter Pixel command or :help",
	disabled = false,
	onHistoryUp,
	onHistoryDown,
	gitBranch,
}) => {
	const [value, setValue] = useState("");

	const handleSubmit = () => {
		if (value.trim() && !disabled) {
			onSubmit(value.trim());
			setValue("");
		}
	};

	const handleChange = (newValue: string) => {
		if (!disabled) {
			setValue(newValue);
		}
	};

	// Up/Down arrows navigate command history.
	// TextInput does not capture these, so there is no conflict.
	useInput((_input, key) => {
		if (disabled) return;

		// Shift+arrows are reserved for scrolling — only plain arrows navigate history
		if (key.upArrow && !key.shift && onHistoryUp) {
			const prev = onHistoryUp();
			if (prev !== null) {
				setValue(prev);
			}
		} else if (key.downArrow && !key.shift && onHistoryDown) {
			const next = onHistoryDown();
			if (next !== null) {
				setValue(next);
			}
		}
	});

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={disabled ? "gray" : "cyan"}
			paddingX={1}
		>
			<Text>
				<Text color={disabled ? "gray" : "cyan"} bold>
					{process.cwd()}
				</Text>
				{gitBranch && <Text color="green"> ({gitBranch})</Text>}
			</Text>
			<Box flexDirection="row">
				<Text>› </Text>
				<TextInput
					value={value}
					onChange={handleChange}
					onSubmit={handleSubmit}
					placeholder={disabled ? "Executing..." : placeholder}
					showCursor
				/>
			</Box>
		</Box>
	);
};
