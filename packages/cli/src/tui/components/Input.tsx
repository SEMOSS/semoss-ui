import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import type React from "react";
import { useMemo, useState } from "react";
import type { Theme } from "../themes.js";

// Available TUI commands for autocomplete
const TUI_COMMANDS = [
	"help",
	"status",
	"clear",
	"exit",
	"quit",
	"q",
	"init",
	"deploy",
	"link",
	"switch",
	"apps",
	"app",
	"pwd",
	"instances",
	"whoami",
	"log",
	"open",
	"publish",
	"config",
	"cleanup",
	"onboard",
	"create",
	"connect",
	"pixel",
	"theme",
];

interface InputProps {
	onSubmit: (command: string) => void;
	placeholder?: string;
	disabled?: boolean;
	onHistoryUp?: () => string | null;
	onHistoryDown?: () => string | null;
	gitBranch?: string | undefined;
	theme: Theme;
}

export const Input: React.FC<InputProps> = ({
	onSubmit,
	placeholder = "Enter Pixel command or :help",
	disabled = false,
	onHistoryUp,
	onHistoryDown,
	gitBranch,
	theme,
}) => {
	const [value, setValue] = useState("");

	// Calculate inline completion suggestion
	const completion = useMemo(() => {
		if (!value.startsWith(":") || value.length < 2) return null;

		const partial = value.slice(1).toLowerCase(); // Remove the ":"
		const match = TUI_COMMANDS.find(
			(cmd) => cmd.startsWith(partial) && cmd !== partial,
		);

		if (match) {
			// Return the remaining part of the command to show as grayed hint
			return match.slice(partial.length);
		}
		return null;
	}, [value]);

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

		// Tab to accept completion
		if (key.tab && completion) {
			setValue(value + completion);
			return;
		}

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
			borderColor={disabled ? theme.muted : theme.primary}
			paddingX={1}
		>
			<Text>
				<Text color={disabled ? theme.muted : theme.primary} bold>
					{process.cwd()}
				</Text>
				{gitBranch && <Text color={theme.success}> ({gitBranch})</Text>}
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
				{completion && <Text dimColor>{completion}</Text>}
			</Box>
		</Box>
	);
};
