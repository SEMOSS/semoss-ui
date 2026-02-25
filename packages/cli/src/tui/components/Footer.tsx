import { Box, Text } from "ink";
import type React from "react";

export const Footer: React.FC = () => {
	const shortcuts = [
		{ key: "Ctrl+C", desc: "Exit" },
		{ key: ":help", desc: "Show commands" },
		{ key: "↑↓ PgUp/PgDn", desc: "Scroll output" },
		{ key: ":clear", desc: "Clear output" },
	];

	return (
		<Box
			flexDirection="row"
			borderStyle="single"
			borderColor="gray"
			paddingX={1}
			justifyContent="space-between"
		>
			{shortcuts.map((shortcut, index) => (
				<Box key={shortcut.key} flexDirection="row" gap={1}>
					{index > 0 && <Text dimColor>│</Text>}
					<Text color="yellow">{shortcut.key}</Text>
					<Text dimColor>{shortcut.desc}</Text>
				</Box>
			))}
		</Box>
	);
};
