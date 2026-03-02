import { Box, Text } from "ink";
import type React from "react";
import type { Theme } from "../themes.js";

interface HeaderProps {
	instance?: string;
	appId?: string;
	appName?: string;
	connected: boolean;
	user?: string;
	theme: Theme;
}

export const Header: React.FC<HeaderProps> = ({
	instance,
	appId,
	appName,
	connected,
	user,
	theme,
}) => {
	const statusColor = connected ? theme.success : theme.error;
	const statusText = connected ? "●" : "○";
	const statusLabel = connected ? "Connected" : "Disconnected";

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor={theme.primary}
			paddingX={1}
		>
			<Box flexDirection="row" justifyContent="space-between">
				<Box flexDirection="row" gap={2}>
					<Text color={theme.primary} bold>
						SEMOSS CLI
					</Text>
					<Text dimColor>│</Text>
					{instance ? (
						<Text>
							<Text color={theme.warning}>Instance:</Text>{" "}
							<Text color={theme.text}>{instance}</Text>
						</Text>
					) : (
						<Text dimColor>No instance selected</Text>
					)}
				</Box>
				<Box flexDirection="row" gap={1}>
					<Text color={statusColor}>{statusText}</Text>
					<Text color={statusColor}>{statusLabel}</Text>
					{user && (
						<>
							<Text dimColor>│</Text>
							<Text>
								<Text color={theme.secondary}>User:</Text>{" "}
								<Text color={theme.text}>{user}</Text>
							</Text>
						</>
					)}
				</Box>
			</Box>
			{appId && (
				<Box marginTop={0}>
					<Text>
						<Text color={theme.info}>App:</Text>{" "}
						<Text color={theme.text}>{appId}</Text>
						{appName && (
							<>
								<Text dimColor> (</Text>
								<Text color={theme.text}>{appName}</Text>
								<Text dimColor>)</Text>
							</>
						)}
					</Text>
				</Box>
			)}
		</Box>
	);
};
