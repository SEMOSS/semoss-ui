import {
	Code,
	RefreshCw,
	Settings,
	Terminal as TerminalIcon,
} from "lucide-react";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	Popover,
	PopoverContent,
	PopoverTrigger,
	Terminal,
	type TerminalProps,
	ToggleGroup,
	ToggleGroupItem,
	toast,
} from "@semoss/ui/next";
import PythonLogo from "@/assets/img/PYTHON.svg";
import RLogo from "@/assets/img/R-logo.svg";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./panel";

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

type WrappedLanguage = Exclude<LanguageType, "PIXEL">;

const WRAPPER_KEYWORD: Record<WrappedLanguage, string> = {
	PYTHON: "Py",
	R: "R",
	SHELL: "Command",
};

// The server reformats pixel expressions with arbitrary whitespace (e.g.
// `Py ( "<encode>2+2</encode>" ) ;`), so each separator allows optional spaces.
const WRAPPER_REGEX: Record<WrappedLanguage, RegExp> = {
	PYTHON: /^Py\s*\(\s*"\s*<encode>\s*([\s\S]*?)\s*<\/encode>\s*"\s*\)\s*;?\s*$/,
	R: /^R\s*\(\s*"\s*<encode>\s*([\s\S]*?)\s*<\/encode>\s*"\s*\)\s*;?\s*$/,
	SHELL: /^Command\s*\(\s*"\s*<encode>\s*([\s\S]*?)\s*<\/encode>\s*"\s*\)\s*;?\s*$/,
};

const detectWrapper = (
	command: string,
): { lang: WrappedLanguage; inner: string } | null => {
	const trimmed = command.trim();
	if (!trimmed) {
		return null;
	}

	for (const lang of Object.keys(WRAPPER_REGEX) as WrappedLanguage[]) {
		const match = trimmed.match(WRAPPER_REGEX[lang]);
		if (match) {
			return { lang, inner: match[1] };
		}
	}

	return null;
};

const wrapForLanguage = (inner: string, lang: LanguageType): string => {
	if (lang === "PIXEL") {
		return inner;
	}
	return `${WRAPPER_KEYWORD[lang]}("<encode>${inner}</encode>");`;
};

// If the buffer already looks wrapped, treat it as already-pixel.
const toPixelForm = (command: string, fromLang: LanguageType): string => {
	if (fromLang === "PIXEL") {
		return command;
	}
	if (detectWrapper(command)) {
		return command;
	}
	return wrapForLanguage(command, fromLang);
};

// Unwrap when the wrapper matches the active language; otherwise pass through.
const toDisplayForm = (pixelCommand: string, toLang: LanguageType): string => {
	if (toLang === "PIXEL") {
		return pixelCommand;
	}
	const detected = detectWrapper(pixelCommand);
	if (detected && detected.lang === toLang) {
		return detected.inner;
	}
	return pixelCommand;
};

const HELP_KEY_BY_LANGUAGE: Record<LanguageType, string> = {
	PIXEL: "General",
	SHELL: "Tinker",
	PYTHON: "Python",
	R: "R",
};

const PIXEL_COMMAND_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;
type ShortcutPlatform = "windows" | "mac" | "linux" | "other";

const getShortcutPlatform = (): ShortcutPlatform => {
	if (typeof navigator === "undefined") {
		return "other";
	}

	const typedNavigator = navigator as Navigator & {
		userAgentData?: { platform?: string };
	};
	const userAgentDataPlatform = typedNavigator.userAgentData?.platform || "";
	const platform = navigator.platform || "";
	const userAgent = navigator.userAgent || "";
	const normalized =
		`${userAgentDataPlatform} ${platform} ${userAgent}`.toLowerCase();

	if (normalized.includes("win")) {
		return "windows";
	}

	if (normalized.includes("mac")) {
		return "mac";
	}

	if (normalized.includes("linux") || normalized.includes("x11")) {
		return "linux";
	}

	return "other";
};

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
	const [shortcutPlatform, setShortcutPlatform] =
		useState<ShortcutPlatform>("other");
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const [command, setCommand] = useState<string>("");
	const commandRef = useRef<string>("");
	const [language, setLanguage] = useState<LanguageType>("PIXEL");
	const languageRef = useRef<LanguageType>("PIXEL");
	const previousLanguageRef = useRef<LanguageType>("PIXEL");
	const [defaultCommand, setDefaultCommand] = useState<string>("");
	const [helpSuggestions, setHelpSuggestions] = useState<
		Record<string, string[]>
	>({});
	const [syncedQuotedSuggestions, setSyncedQuotedSuggestions] = useState<
		string[]
	>([]);

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

	useEffect(() => {
		setShortcutPlatform(getShortcutPlatform());
	}, []);

	useEffect(() => {
		languageRef.current = language;
		const previous = previousLanguageRef.current;
		previousLanguageRef.current = language;

		if (previous === language) {
			return;
		}

		const currentBufferValue = commandRef.current;
		if (!currentBufferValue.trim()) {
			return;
		}
		// Leave multiline pastes/buffers untouched on mode switch.
		if (currentBufferValue.includes("\n")) {
			return;
		}

		const pixelForm = toPixelForm(currentBufferValue, previous);
		const nextDisplay = toDisplayForm(pixelForm, language);

		if (nextDisplay !== currentBufferValue) {
			commandRef.current = nextDisplay;
			setCommand(nextDisplay);
			setDefaultCommand(nextDisplay);
		}
	}, [language]);

	const transformHistoryCommand = useCallback((entryCommand: string) => {
		return toDisplayForm(entryCommand, languageRef.current);
	}, []);

	const handleTerminalPaste = useCallback((text: string) => {
		if (!text.includes("\n")) {
			return;
		}

		let lastLang: WrappedLanguage | null = null;
		for (const line of text.split(/\r\n|\n|\r/)) {
			const detected = detectWrapper(line);
			if (detected) {
				lastLang = detected.lang;
			}
		}

		if (lastLang && lastLang !== languageRef.current) {
			setLanguage(lastLang);
		}
	}, []);

	const suggestions = useMemo(() => {
		const helpKey = HELP_KEY_BY_LANGUAGE[language];
		return helpSuggestions[helpKey] || [];
	}, [helpSuggestions, language]);

	const platformName = useMemo(() => {
		if (shortcutPlatform === "windows") {
			return "Windows";
		}

		if (shortcutPlatform === "mac") {
			return "macOS";
		}

		if (shortcutPlatform === "linux") {
			return "Linux";
		}

		return "Browser";
	}, [shortcutPlatform]);

	const shortcutRows = useMemo(() => {
		const isMac = shortcutPlatform === "mac";
		const isWindows = shortcutPlatform === "windows";
		const commandKey = isMac ? "⌘ Cmd" : "Ctrl";
		const controlKey = isMac ? "⌃ Ctrl" : "Ctrl";
		const pageModifier = isWindows ? "Alt" : controlKey;

		return [
			{
				id: "select-all",
				keys: [commandKey, "⇧ Shift", "A"],
				description: "Select all terminal output",
			},
			{
				id: "copy",
				keys: [commandKey, "C"],
				description: "Copy selected text",
			},
			{
				id: "paste",
				keys: [commandKey, "V"],
				description: "Paste clipboard at cursor",
			},
			{
				id: "cancel",
				keys: [controlKey, "C"],
				description: "Cancel current command",
			},
			{
				id: "reverse-search",
				keys: [controlKey, "R"],
				description: "Reverse history search",
			},
			{
				id: "page-up",
				keys: [pageModifier, "Y"],
				description: "Page up",
			},
			{
				id: "page-down",
				keys: [pageModifier, "X"],
				description: "Page down",
			},
			{
				id: "autocomplete",
				keys: ["⇥ Tab"],
				description: "Accept ghost/suggestion",
			},
			{
				id: "navigate",
				keys: ["↑", "↓"],
				description: "Navigate suggestions/history",
			},
			{
				id: "enter",
				keys: ["↵ Enter"],
				description: "Run command (no autocomplete)",
			},
			{
				id: "escape",
				keys: ["⎋ Esc"],
				description: "Hide suggestions",
			},
		];
	}, [shortcutPlatform]);

	const canShowSyncButton = workspace.fileBrowser.isOpen;
	const canSyncFileBrowserSuggestions =
		canShowSyncButton && workspace.fileBrowser.visiblePaths.length > 0;

	const handleSyncFileBrowserSuggestions = useCallback(() => {
		const nextSuggestions = workspace.fileBrowser.visiblePaths;
		if (nextSuggestions.length === 0) {
			toast.warning(
				"No visible file paths to sync from the file browser",
			);
			return;
		}

		setSyncedQuotedSuggestions(nextSuggestions);
		toast.success(
			`Synced ${nextSuggestions.length} asset path suggestion${
				nextSuggestions.length === 1 ? "" : "s"
			}`,
		);
	}, [workspace.fileBrowser.visiblePaths]);

	const getQuotedSuggestions = useCallback(() => {
		return syncedQuotedSuggestions;
	}, [syncedQuotedSuggestions]);

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

				// Skip re-wrapping and sync the toggle when the buffer is already wrapped.
				const detected = detectWrapper(cleaned);
				if (detected && detected.lang !== language) {
					setLanguage(detected.lang);
				}

				const isMultiline = cleaned.includes("\n");

				let pixel = "";
				if (language === "PIXEL" || detected || isMultiline) {
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
									className={`h-7 px-2 ${value === "SHELL" ? "rounded-r-none data-[spacing=0]:last:rounded-r-none" : ""}`}
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
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="h-7 w-7 rounded-l-none border-l-0 p-0"
								title="Terminal Settings"
								aria-label="Terminal Settings"
							>
								<Settings className="size-3.5" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							side="top"
							align="start"
							className="w-[440px] max-w-[calc(100vw-2rem)] p-3"
						>
							<div className="mb-2 flex items-center justify-between gap-2">
								<div className="font-semibold text-sm">
									Terminal Shortcuts ({platformName})
								</div>
								{canShowSyncButton && (
									<Button
										variant="outline"
										size="sm"
										className="h-7 gap-1 px-2"
										onClick={
											handleSyncFileBrowserSuggestions
										}
										disabled={
											!canSyncFileBrowserSuggestions
										}
										title="Sync visible file browser paths to terminal suggestions"
									>
										<RefreshCw className="size-3" />
										Sync
									</Button>
								)}
							</div>
							<div className="grid grid-cols-[180px_1fr] gap-x-3 gap-y-1 text-xs">
								{shortcutRows.map((row) => {
									return (
										<div key={row.id} className="contents">
											<div className="flex flex-wrap items-center gap-1">
												{row.keys.map(
													(key, keyIndex) => {
														return (
															<span
																key={`${row.id}-${key}-${keyIndex}`}
																className="inline-flex items-center gap-1"
															>
																{keyIndex >
																	0 && (
																	<span className="opacity-70">
																		+
																	</span>
																)}
																<kbd className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[11px] leading-none">
																	{key}
																</kbd>
															</span>
														);
													},
												)}
											</div>
											<span>{row.description}</span>
										</div>
									);
								})}
							</div>
						</PopoverContent>
					</Popover>
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
				defaultCommand={defaultCommand}
				instructions={getInstructions(language)}
				suggestions={suggestions}
				getQuotedSuggestions={getQuotedSuggestions}
				transformSuggestion={transformSuggestionForInsert}
				transformHistoryCommand={transformHistoryCommand}
				onPaste={handleTerminalPaste}
				onRun={runCommand}
				onCommand={(nextCommand) => {
					commandRef.current = nextCommand;
					setCommand(nextCommand);
				}}
			/>
		</Panel>
	);
});
