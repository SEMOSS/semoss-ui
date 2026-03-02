import { Box, Text, useInput } from "ink";
import type React from "react";
import type { Theme } from "../themes.js";

interface FooterProps {
	onExit: () => void;
	onHelp: () => void;
	onClear: () => void;
	theme: Theme;
}

export const Footer: React.FC<FooterProps> = ({
	onExit,
	onHelp,
	onClear,
	theme,
}) => {
	useInput((input, key) => {
		// Ctrl+? for help, Ctrl+L for clear
		if (key.ctrl && input === "?") {
			onHelp();
		} else if (key.ctrl && input === "l") {
			onClear();
		}
		// Escape to exit
		if (key.escape || (key.ctrl && input === "c")) {
			onExit();
		}
	});

	const shortcuts = [
		{ key: "↑↓", label: "History" },
		{ key: "Shift+↑↓", label: "Scroll" },
		{ key: "!cmd", label: "Shell" },
		{ key: ":help", label: "Commands" },
		{ key: ":clear", label: "Clear" },
		{ key: "Esc", label: "Exit" },
	];

	return (
		<Box
			flexDirection="row"
			borderStyle="single"
			borderColor={theme.muted}
			paddingX={1}
			justifyContent="space-between"
		>
			<Box flexDirection="row" gap={1}>
				{shortcuts.map((shortcut, index) => (
					<Box key={shortcut.key} flexDirection="row">
						{index > 0 && <Text dimColor> │ </Text>}
						<Text color={theme.warning}>{shortcut.key}</Text>
						<Text dimColor> {shortcut.label}</Text>
					</Box>
				))}
			</Box>
		</Box>
	);
};
