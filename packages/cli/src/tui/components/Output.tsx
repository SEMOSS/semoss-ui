import { Box, Text, useInput, useStdout } from "ink";
import Spinner from "ink-spinner";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
	getCurrentInstance,
	getCurrentInstanceName,
} from "../../utils/config.js";

export interface OutputEntry {
	id: string;
	type: "command" | "result" | "error" | "info" | "loading" | "success";
	content: string;
	timestamp?: Date;
}

interface OutputProps {
	entries: OutputEntry[];
	height?: number;
}

const MOOSE_ART = [
	"⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢡⡀⠀⠀⠀",
	"⠀⠀⢠⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢷⡀⠀⠀",
	"⠀⢰⠇⠀⠀⢀⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠀⠀⠀⢧⠀⠀⠸⣿⣦⠀",
	"⢀⡿⠀⠀⠀⣼⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣆⠀⠀⠸⣧⠀⠀⣿⡹⣧",
	"⢸⡇⠀⠀⢠⡏⠀⢀⡴⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣦⡀⢻⡆⠀⢸⡇⣿",
	"⣾⡇⠀⠀⢸⣧⡴⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⢿⣿⣦⣾⣧⣿",
	"⢿⣿⣶⡶⢿⡏⠀⠀⠀⠀⠀⠀⢀⡆⠀⠀⠀⢀⠀⠀⠀⠀⢸⣿⣩⣿⡻⣿",
	"⠘⢿⣿⣶⣬⣷⡀⠀⠀⠀⠀⠀⣾⠀⠀⠀⠀⢸⡆⠀⠀⢠⣾⣿⣿⣿⠿⠛",
	"⠀⠀⠉⠛⠿⠿⣿⣷⣶⣤⣀⣼⣏⠀⠀⠀⠀⠈⣷⣀⣤⣾⣿⠿⠟⠉⠀⠀",
	"⠀⠀⠀⠀⠀⠀⠀⠉⠻⢿⣿⣿⣿⣄⠀⠀⠀⢠⣿⣿⡿⠟⠉⣀⣤⣤⡀⠀",
] as const;

const ASCII_LOGO = [
	"   ███████╗███████╗███╗   ███╗ ██████╗ ███████╗███████╗",
	"   ██╔════╝██╔════╝████╗ ████║██╔═══██╗██╔════╝██╔════╝",
	"   ███████╗█████╗  ██╔████╔██║██║   ██║███████╗███████╗",
	"   ╚════██║██╔══╝  ██║╚██╔╝██║██║   ██║╚════██║╚════██║",
	"   ███████║███████╗██║ ╚═╝ ██║╚██████╔╝███████║███████║",
	"   ╚══════╝╚══════╝╚═╝     ╚═╝ ╚═════╝ ╚══════╝╚══════╝",
] as const;

export const Output: React.FC<OutputProps> = ({ entries, height = 20 }) => {
	const [scrollOffset, setScrollOffset] = useState(0);
	const { stdout } = useStdout();
	const termWidth = stdout?.columns ?? 80;

	// Get context info for welcome screen
	const contextInfo = useMemo(() => {
		const instName = getCurrentInstanceName();
		const inst = getCurrentInstance();
		return {
			instanceName: instName || undefined,
			module: inst?.module || undefined,
		};
	}, []);

	// Calculate total lines needed for all entries
	const allLines: Array<{ entryId: string; line: string; type: string }> = [];
	entries.forEach((entry) => {
		const lines = entry.content.split("\n");
		lines.forEach((line) => {
			allLines.push({
				entryId: entry.id,
				line,
				type: entry.type,
			});
		});
	});

	const totalLines = allLines.length;
	const maxScroll = Math.max(0, totalLines - height);

	// Auto-scroll to bottom when new content arrives
	useEffect(() => {
		setScrollOffset(maxScroll);
	}, [maxScroll]);

	// Handle scroll input — PgUp/PgDn only.
	// Up/Down arrows are used for command history in the Input component.
	// Scroll: PgUp/PgDn or Shift+↑/↓ (for MacBook keyboards without PgUp/PgDn)
	useInput((_input, key) => {
		if (key.pageUp || (key.shift && key.upArrow)) {
			setScrollOffset((prev) => Math.max(0, prev - height));
		} else if (key.pageDown || (key.shift && key.downArrow)) {
			setScrollOffset((prev) => Math.min(maxScroll, prev + height));
		}
	});

	// Get visible lines based on scroll offset
	const visibleLines = allLines.slice(scrollOffset, scrollOffset + height);

	const renderLine = (
		line: { entryId: string; line: string; type: string },
		index: number,
	) => {
		const key = `${line.entryId}-${index}`;

		switch (line.type) {
			case "command":
				return (
					<Text key={key}>
						<Text color="cyan" bold>
							›{" "}
						</Text>
						<Text color="white">{line.line}</Text>
					</Text>
				);
			case "result":
				return (
					<Text key={key} color="green">
						{line.line}
					</Text>
				);
			case "error":
				return (
					<Text key={key} color="red">
						{line.line}
					</Text>
				);
			case "loading":
				return (
					<Box key={key} flexDirection="row">
						<Text color="cyan">
							<Spinner type="dots" />
						</Text>
						<Text color="cyan"> {line.line}</Text>
					</Box>
				);
			case "info":
				return (
					<Text key={key} dimColor>
						{line.line}
					</Text>
				);
			case "success":
				return (
					<Text key={key} color="green" bold>
						{line.line}
					</Text>
				);
			default:
				return <Text key={key}>{line.line}</Text>;
		}
	};

	// Show scroll indicator
	const showScrollIndicator = totalLines > height;
	const scrollPercentage =
		maxScroll > 0 ? Math.round((scrollOffset / maxScroll) * 100) : 100;

	// Show welcome screen when there are no entries or just initial welcome messages
	const showWelcome = entries.length <= 2;

	return (
		<Box flexDirection="column">
			<Box
				flexDirection="column"
				borderStyle="single"
				borderColor="gray"
				paddingX={1}
				paddingY={0}
				height={height}
			>
				{showWelcome ? (
					<Box
						flexDirection="column"
						alignItems="center"
						justifyContent="center"
						height={height - 2}
					>
						{height >= 28 &&
							MOOSE_ART.map((line) => (
								<Text key={line} color="cyan">
									{line}
								</Text>
							))}
						{termWidth >= 62 ? (
							ASCII_LOGO.map((line) => (
								<Text key={line} color="cyan">
									{line}
								</Text>
							))
						) : (
							<Text color="cyan" bold>
								S E M O S S
							</Text>
						)}
						<Text> </Text>
						<Text dimColor>Semantic Open Source Software</Text>
						<Text> </Text>
						{contextInfo.instanceName ? (
							<Text>
								<Text color="yellow">Instance: </Text>
								<Text>{contextInfo.instanceName}</Text>
								{contextInfo.module && (
									<Text dimColor>
										{" "}
										({contextInfo.module})
									</Text>
								)}
							</Text>
						) : (
							<Text dimColor>
								No instance connected — run :connect
							</Text>
						)}
						<Text> </Text>
						<Text dimColor>
							Type :help for commands or enter a Pixel query
						</Text>
					</Box>
				) : visibleLines.length > 0 ? (
					visibleLines.map((line, index) => renderLine(line, index))
				) : (
					<Text dimColor>
						Type a Pixel command or `:help` for available commands
					</Text>
				)}
			</Box>
			{showScrollIndicator && (
				<Box justifyContent="space-between" paddingX={1}>
					<Text dimColor>Shift+↑↓ or PgUp/PgDn to scroll</Text>
					<Text dimColor>
						{scrollPercentage}% ({scrollOffset + 1}-
						{Math.min(scrollOffset + height, totalLines)} of{" "}
						{totalLines} lines)
					</Text>
				</Box>
			)}
		</Box>
	);
};
