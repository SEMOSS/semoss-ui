import { Code, Terminal as TerminalIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Terminal,
	type TerminalProps,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import PythonLogo from "@/assets/img/PYTHON.svg";
import RLogo from "@/assets/img/R-logo.svg";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const buildTable = (
	table: Record<string, unknown>[] | unknown[][],
	limit = 10,
): string => {
	if (table.length === 0) {
		return "[]";
	}

	const columns = Object.keys(table[0]);
	const hasHeader = typeof columns[0] === "string";
	const columnWidths: Record<string, number> = {};
	for (const column of columns) {
		columnWidths[column] = column.length;
	}

	const visibleRows = Math.min(limit, table.length);
	for (let rowIndex = 0; rowIndex < visibleRows; rowIndex++) {
		for (const column of columns) {
			columnWidths[column] = Math.max(
				columnWidths[column],
				String((table[rowIndex] as Record<string, unknown>)[column])
					.length,
			);
		}
	}

	for (const column in columnWidths) {
		columnWidths[column] += 2;
	}

	const generated: string[] = [];
	generated.push(
		`┌${columns.map((column) => "─".repeat(columnWidths[column])).join("┬")}┐`,
	);

	if (hasHeader) {
		generated.push(
			`│${columns.map((column) => ` ${column.padEnd(columnWidths[column] - 2)} `).join("│")}│`,
		);
		generated.push(
			`├${columns.map((column) => "─".repeat(columnWidths[column])).join("┼")}┤`,
		);
	}

	for (let rowIndex = 0; rowIndex < visibleRows; rowIndex++) {
		const row = table[rowIndex] as Record<string, unknown>;
		generated.push(
			`│${columns
				.map(
					(column) =>
						` ${String(row[column]).padEnd(columnWidths[column] - 2)} `,
				)
				.join("│")}│`,
		);
	}

	generated.push(
		`└${columns.map((column) => "─".repeat(columnWidths[column])).join("┴")}┘`,
	);

	if (limit < table.length) {
		generated.push(`Limited to ${limit} rows`);
	}

	return generated.join("\n");
};

const LANGUAGE = {
	PIXEL: "Pixel",
	PYTHON: "Python",
	R: "R",
	SHELL: "Shell",
} as const;

type LanguageType = keyof typeof LANGUAGE;

const HELP_KEY_BY_LANGUAGE: Record<LanguageType, string> = {
	PIXEL: "General",
	SHELL: "Tinker",
	PYTHON: "Python",
	R: "R",
};

const PIXEL_COMMAND_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const getInstructions = (selectedLanguage: LanguageType) => {
	switch (selectedLanguage) {
		case "PIXEL":
			return "\x1b[34mPixel\x1b[0m";
		case "SHELL":
			return "\x1b[33mShell\x1b[0m";
		case "PYTHON":
			return "\x1b[32mPython\x1b[0m";
		case "R":
			return "\x1b[36mR\x1b[0m";
		default:
			return "";
	}
};

interface FrameHeaders {
	headerInfo: {
		headers: {
			alias: string;
			header: string;
			dataType: string;
			adtlType: string;
			qsName: unknown;
		}[];
		joins: unknown[];
	};
}

interface TaskData {
	headerInfo?: {
		alias: string;
	}[];
	data: {
		values: unknown[][];
	};
}

const colorizeJSON = (jsonString: string) => {
	return jsonString
		.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g, (match) => {
			if (/:$/.test(match)) {
				return `\x1b[34m${match}\x1b[0m`;
			}
			return `\x1b[32m${match}\x1b[0m`;
		})
		.replace(/\b(true|false|null)\b/g, (match) => {
			return `\x1b[35m${match}\x1b[0m`;
		})
		.replace(/:\s*"([^"]+)"/g, (match) => {
			return `\x1b[36m${match}\x1b[0m`;
		});
};

const normalizeWhitespace = (value: string): string => {
	return value.replace(/\s+/g, " ").trim();
};

const countStatements = (value: string): number => {
	return value
		.split(";")
		.map((part) => part.trim())
		.filter(Boolean).length;
};

export const TerminalPanel: React.FC = observer(() => {
	const [history, setHistory] = useState<TerminalProps["history"]>([]);
	const [isLoading, setIsLoading] = useState<boolean>(false);
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const [command, setCommand] = useState<string>("");
	const commandRef = useRef<string>("");
	const [language, setLanguage] = useState<LanguageType>("PIXEL");
	const [helpSuggestions, setHelpSuggestions] = useState<
		Record<string, string[]>
	>({});

	useEffect(() => {
		runPixel("META | HelpJson();")
			.then((response) => {
				const output = response?.pixelReturn?.[0]?.output;
				if (!output || typeof output !== "object") {
					setHelpSuggestions({});
					return;
				}

				const typedOutput = output as Record<string, unknown>;
				const nextSuggestions = Object.entries(typedOutput).reduce<
					Record<string, string[]>
				>((acc, [key, value]) => {
					if (!Array.isArray(value)) {
						acc[key] = [];
						return acc;
					}

					acc[key] = value
						.filter(
							(item): item is string => typeof item === "string",
						)
						.map((item) => item.trim())
						.filter(Boolean);
					return acc;
				}, {});

				setHelpSuggestions(nextSuggestions);
			})
			.catch(() => {
				setHelpSuggestions({});
			});
	}, []);

	const suggestions = useMemo(() => {
		const helpKey = HELP_KEY_BY_LANGUAGE[language];
		return helpSuggestions[helpKey] || [];
	}, [helpSuggestions, language]);

	const transformSuggestionForInsert = useCallback(
		(suggestion: string) => {
			if (language !== "PIXEL") {
				return suggestion;
			}

			const trimmedSuggestion = suggestion.trim();
			if (!trimmedSuggestion) {
				return suggestion;
			}

			if (
				trimmedSuggestion.includes("(") ||
				trimmedSuggestion.includes(" ") ||
				trimmedSuggestion.includes("|") ||
				trimmedSuggestion.endsWith(";") ||
				!PIXEL_COMMAND_PATTERN.test(trimmedSuggestion)
			) {
				return trimmedSuggestion;
			}

			return `${trimmedSuggestion}()`;
		},
		[language],
	);

	const runCommand = useCallback(
		async (commandOverride?: string) => {
			const sourceCommand =
				typeof commandOverride === "string"
					? commandOverride
					: commandRef.current;
			const cleaned = sourceCommand.trim();
			if (!cleaned) {
				return;
			}

			try {
				setIsLoading(true);

				let pixel = "";
				if (language === "PIXEL") {
					pixel = cleaned;
				} else if (language === "SHELL") {
					pixel = `Command("<encode>${cleaned}</encode>");`;
				} else if (language === "PYTHON") {
					pixel = `Py("<encode>${cleaned}</encode>");`;
				} else if (language === "R") {
					pixel = `R("<encode>${cleaned}</encode>");`;
				}

				const response = await workspace.runWorkspacePixel(pixel);
				const normalizedInputCommand = normalizeWhitespace(cleaned);
				const parsedExpressions = response.pixelReturn
					.map((result) => {
						return typeof result.pixelExpression === "string"
							? result.pixelExpression.trim()
							: "";
					})
					.filter(Boolean);
				const normalizedParsedExpressions = Array.from(
					new Set(
						parsedExpressions
							.map((expression) =>
								normalizeWhitespace(expression),
							)
							.filter(Boolean),
					),
				);
				const hasSubExpressionBreakdown =
					normalizedParsedExpressions.length > 1;

				const isAggregateExpression = (normalizedCommand: string) => {
					if (!hasSubExpressionBreakdown) {
						return false;
					}

					let containedCount = 0;
					for (const expression of normalizedParsedExpressions) {
						if (
							expression.length < 12 ||
							expression === normalizedCommand
						) {
							continue;
						}

						if (normalizedCommand.includes(expression)) {
							containedCount += 1;
							if (containedCount >= 2) {
								return true;
							}
						}
					}

					return false;
				};

				setHistory((previousHistory) => {
					const updatedHistory = [...previousHistory];
					const insightId = response.insightId;

					for (const result of response.pixelReturn) {
						const { output, operationType, pixelExpression } =
							result;
						const commandForHistory =
							typeof pixelExpression === "string" &&
							pixelExpression.trim() !== ""
								? pixelExpression.trim()
								: parsedExpressions.length === 0
									? cleaned
									: "";
						if (!commandForHistory) {
							continue;
						}
						const normalizedCommandForHistory =
							normalizeWhitespace(commandForHistory);
						const statementCount =
							countStatements(commandForHistory);
						const isOversizedExpression =
							commandForHistory.length > 1200;

						const shouldDropParentExpression =
							hasSubExpressionBreakdown &&
							(commandForHistory.includes("\n") ||
								statementCount > 1 ||
								isOversizedExpression ||
								normalizedCommandForHistory ===
									normalizedInputCommand ||
								isAggregateExpression(
									normalizedCommandForHistory,
								));
						if (shouldDropParentExpression) {
							continue;
						}

						let formatted: unknown = output;
						if (operationType.indexOf("TASK_DATA") > -1) {
							const data = output as TaskData;

							if (data.headerInfo) {
								const headers = data.headerInfo.reduce<
									Record<number, string>
								>((acc, value, index) => {
									acc[index] = value.alias;
									return acc;
								}, {});

								const table = data.data.values.map((row) => {
									return row.reduce<Record<string, unknown>>(
										(acc, value, index) => {
											acc[headers[index]] = value;
											return acc;
										},
										{},
									);
								});

								formatted = buildTable(table);
							} else {
								formatted = buildTable(data.data.values);
							}
						} else if (
							operationType.indexOf("FRAME_HEADERS") > -1
						) {
							const data = output as FrameHeaders;
							formatted = buildTable(data.headerInfo.headers);
						} else if (
							operationType.indexOf("CODE_EXECUTION") > -1
						) {
							if (
								Array.isArray(output) &&
								output[0] &&
								typeof output[0] === "object" &&
								Object.hasOwn(output[0], "output")
							) {
								formatted = (output[0] as { output: unknown })
									.output;
							}
						} else if (
							operationType.indexOf("INVALID_SYNTAX") > -1
						) {
							formatted = `\x1b[31mInvalid Syntax: ${output}\x1b[0m`;
						} else if (operationType.indexOf("ERROR") > -1) {
							formatted = `\x1b[31mError: ${output}\x1b[0m`;
						} else if (
							operationType.indexOf("FILE_DOWNLOAD") > -1
						) {
							monolithStore
								.download(insightId, formatted as string)
								.then(() => {
									if (
										output &&
										response.errors.length === 0
									) {
										toast.success(
											"File downloaded successfully",
										);
									}
								})
								.catch(() => {
									toast.error(
										"Error occurred while trying to download",
									);
								});
						}

						updatedHistory.push({
							command: commandForHistory,
							response: colorizeJSON(
								typeof formatted !== "string"
									? JSON.stringify(formatted, null, 2)
									: formatted,
							),
						});
					}

					return updatedHistory;
				});
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Failed to run command";
				toast.error(message);
				console.error(error);
			} finally {
				setIsLoading(false);
			}
		},
		[language, monolithStore, workspace],
	);

	const handleCopyCommands = useCallback(async () => {
		const commands = history.map((entry) => entry.command).join("\n");
		if (!commands.trim()) {
			toast.warning("No terminal commands to copy");
			return;
		}

		try {
			await navigator.clipboard.writeText(commands);
			toast.success("Terminal commands copied to clipboard");
		} catch {
			toast.error("Unable to copy terminal commands");
		}
	}, [history]);

	return (
		<Panel
			footer={
				<>
					<ToggleGroup
						type="single"
						value={language}
						onValueChange={(value) => {
							if (value) {
								setLanguage(value as LanguageType);
							}
						}}
						variant="outline"
						spacing={0}
					>
						{Object.entries(LANGUAGE).map(([value, name]) => {
							return (
								<ToggleGroupItem
									key={value}
									value={value}
									title={`Switch to ${name}`}
									className="h-7 px-2"
								>
									{value === "PIXEL" && (
										<Code className="size-3.5" />
									)}
									{value === "PYTHON" && (
										<img
											src={PythonLogo}
											className="h-[13px] w-[13px]"
											alt="Python"
										/>
									)}
									{value === "R" && (
										<img
											src={RLogo}
											className="h-[13px] w-[13px]"
											alt="R"
										/>
									)}
									{value === "SHELL" && (
										<TerminalIcon className="size-3.5" />
									)}
								</ToggleGroupItem>
							);
						})}
					</ToggleGroup>
					<div className="flex-1">&nbsp;</div>
					<Button
						variant="outline"
						size="sm"
						onClick={handleCopyCommands}
						disabled={history.length === 0}
					>
						Copy Commands
					</Button>
					<Button
						size="sm"
						className="ml-2"
						onClick={() => runCommand()}
						disabled={command.trim() === ""}
					>
						Run
					</Button>
				</>
			}
		>
			<Terminal
				history={history}
				loading={isLoading}
				instructions={getInstructions(language)}
				suggestions={suggestions}
				transformSuggestion={transformSuggestionForInsert}
				onRun={runCommand}
				onCommand={(nextCommand) => {
					commandRef.current = nextCommand;
					setCommand(nextCommand);
				}}
			/>
		</Panel>
	);
});
