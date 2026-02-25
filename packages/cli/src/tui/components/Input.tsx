import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import React, { useState } from "react";

interface InputProps {
	onSubmit: (command: string) => void;
	placeholder?: string;
	disabled?: boolean;
	onHistoryUp?: () => string | null;
	onHistoryDown?: () => string | null;
}

export const Input: React.FC<InputProps> = ({
	onSubmit,
	placeholder = "Enter Pixel command or :help",
}) => {
	const [value, setValue] = useState("");

	const handleSubmit = () => {
		if (value.trim()) {
			onSubmit(value.trim());
			setValue("");
		}
	};

	// TextInput has its own key handling, so we'll use a different approach
	// We'll capture Ctrl+Up/Down for history instead of plain arrows
	const handleChange = (newValue: string) => {
		setValue(newValue);
	};

	return (
		<Box
			flexDirection="row"
			borderStyle="single"
			borderColor="cyan"
			paddingX={1}
		>
			<Text color="cyan" bold>
				›{" "}
			</Text>
			<TextInput
				value={value}
				onChange={handleChange}
				onSubmit={handleSubmit}
				placeholder={placeholder}
				showCursor
			/>
		</Box>
	);
};
