import { Box, Text } from "ink";
import type React from "react";

interface HeaderProps {
	instance?: string;
	appId?: string;
	appName?: string;
	connected: boolean;
	user?: string;
}

export const Header: React.FC<HeaderProps> = ({
	instance,
	appId,
	appName,
	connected,
	user,
}) => {
	const statusColor = connected ? "green" : "red";
	const statusText = connected ? "●" : "○";
	const statusLabel = connected ? "Connected" : "Disconnected";

	return (
		<Box
			flexDirection="column"
			borderStyle="single"
			borderColor="cyan"
			paddingX={1}
		>
			<Box flexDirection="row" justifyContent="space-between">
				<Box flexDirection="row" gap={2}>
					<Text color="cyan" bold>
						SEMOSS CLI
					</Text>
					<Text dimColor>│</Text>
					{instance ? (
						<Text>
							<Text color="yellow">Instance:</Text>{" "}
							<Text color="white">{instance}</Text>
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
								<Text color="blue">User:</Text>{" "}
								<Text color="white">{user}</Text>
							</Text>
						</>
					)}
				</Box>
			</Box>
			{appId && (
				<Box marginTop={0}>
					<Text>
						<Text color="magenta">App:</Text>{" "}
						<Text color="white">{appId}</Text>
						{appName && (
							<>
								<Text dimColor> (</Text>
								<Text color="white">{appName}</Text>
								<Text dimColor>)</Text>
							</>
						)}
					</Text>
				</Box>
			)}
		</Box>
	);
};
