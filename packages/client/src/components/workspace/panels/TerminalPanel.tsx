import { Code, Terminal as TerminalIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
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
		return `[]`;
	}

	const columns = Object.keys(table[0]);
	const hasHeader = typeof columns[0] === "string";
	const columnWidths: Record<string, number> = {};
	for (const c of columns) {
		columnWidths[c] = c.length;
	}

	for (let rowIdx = 0, rowLen = table.length; rowIdx < rowLen; rowIdx++) {
		if (rowIdx + 1 < limit) {
			break;
		}
		for (const c of columns) {
			columnWidths[c] = Math.max(
				columnWidths[c],
				String((table[rowIdx] as Record<string, unknown>)[c]).length,
			);
		}
	}

	for (const c in columnWidths) {
		columnWidths[c] += 2;
	}

	const generated: string[] = [];
	generated.push(
		`┌${columns.map((c) => "─".repeat(columnWidths[c])).join("┬")}┐`,
	);

	if (hasHeader) {
		generated.push(
			`│${columns.map((c) => ` ${c.padEnd(columnWidths[c] - 2)} `).join("│")}│`,
		);
		generated.push(
			`├${columns.map((c) => "─".repeat(columnWidths[c])).join("┼")}┤`,
		);
	}

	for (let rowIdx = 0, rowLen = table.length; rowIdx < rowLen; rowIdx++) {
		if (rowIdx + 1 < limit) {
			break;
		}
		const row = table[rowIdx] as Record<string, unknown>;
		generated.push(
			`│${columns.map((c) => ` ${String(row[c]).padEnd(columnWidths[c] - 2)} `).join("│")}│`,
		);
	}

	generated.push(
		`└${columns.map((c) => "─".repeat(columnWidths[c])).join("┴")}┘`,
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

export const TerminalPanel: React.FC = observer(() => {
	const [history, setHistory] = useState<TerminalProps["history"]>([]);
	const [, setIsLoading] = useState<boolean>(false);
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const [command, setCommand] = useState<string>("");
	const [language, setLanguage] = useState("PIXEL");
	const suggesstionsList = useRef<string[]>([]);

	/**
	 * Get instructions based on the language
	 * @param language - current language
	 * @returns instructions
	 */
	const getInstructions = (language: string, prefix = "", postfix = "") => {
		let instructions = "";
		if (language === "PIXEL") {
			instructions = `${prefix}\x1b[34mPixel\x1b[0m${postfix}`;
		} else if (language === "SHELL") {
			instructions = `${prefix}\x1b[33mShell\x1b[0m${postfix}`;
		} else if (language === "PYTHON") {
			instructions = `${prefix}\x1b[32mPython\x1b[0m${postfix}`;
		} else if (language === "R") {
			instructions = `${prefix}\x1b[36mR\x1b[0m${postfix}`;
		}
		return instructions;
	};

	useEffect(() => {
		runPixel("META | HelpJson();")
			.then((response) => {
				const data =
					(response?.pixelReturn[0]?.output as Record<
						string,
						string[]
					>) ?? {};
				if (language === "PIXEL") {
					suggesstionsList.current = data?.General ?? [];
				} else if (language === "SHELL") {
					suggesstionsList.current = data?.Tinker ?? [];
				} else if (language === "PYTHON") {
					suggesstionsList.current = data?.Python ?? [];
				} else if (language === "R") {
					suggesstionsList.current = data?.R ?? [];
				} else {
					suggesstionsList.current = data?.General ?? [];
				}
			})
			.catch(() => {
				suggesstionsList.current = [];
			});
	}, [language]);

	/**
	 * Run a command
	 * @param command - command to run
	 * @param id - ID of the file
	 * @param path - path to the file
	 */
	const runCommand = async () => {
		try {
			setIsLoading(true);
			const cleaned = command.trim();
			if (!cleaned) {
				throw new Error(`No Command`);
			}

			let pixel = "";
			if (language === "PIXEL") {
				pixel = cleaned;
			} else if (language === "SHELL") {
				pixel = `Command("<encode>${cleaned}</encode>");`;
			} else if (language === "PYTHON") {
				pixel = `Py("<encode>${cleaned}</encode>");`;
			}

			// TODO: We need to fix workspace.store so we just call runWorkspacePixel
			const response = await workspace.runWorkspacePixel(pixel);

			const updatedHistory = [...history];
			const insightId = response.insightId;
			for (const r of response.pixelReturn) {
				const { output, operationType, timeToRun } = r;

				let postfix = "";
				// only show if longer than 5 seconds
				if (timeToRun > 5000) {
					const seconds = Math.floor(timeToRun / 1000); // seconds
					const minutes = Math.floor(timeToRun / 60);
					postfix = ` in ${minutes
						.toString()
						.padStart(2, "0")}:${seconds
						.toString()
						.padStart(2, "0")}`;
				}

				let formatted: unknown = output;
				if (operationType.indexOf("TASK_DATA") > -1) {
					const data = output as TaskData;

					if (data.headerInfo) {
						const headers = data.headerInfo.reduce(
							(acc, val, idx) => {
								acc[idx] = val.alias;
								return acc;
							},
							{},
						);

						const table = data.data.values.map((row) => {
							return row.reduce((acc, val, idx) => {
								acc[headers[idx]] = val;
								return acc;
							}, {}) as Record<string, unknown>;
						});

						formatted = buildTable(table);
					} else {
						formatted = buildTable(data.data.values);
					}
				} else if (operationType.indexOf("FRAME_HEADERSf") > -1) {
					const data = output as FrameHeaders;

					formatted = buildTable(data.headerInfo.headers);
				} else if (operationType.indexOf("CODE_EXECUTION") > -1) {
					if (
						Array.isArray(output) &&
						output[0] &&
						Object.hasOwn(output[0], "output")
					) {
						formatted = output[0].output;
					}
				} else if (operationType.indexOf("INVALID_SYNTAX") > -1) {
					formatted = `\x1b[31mInvalid Syntax: ${output}\x1b[0m`;
				} else if (operationType.indexOf("ERROR") > -1) {
					formatted = `\x1b[31mError: ${output}\x1b[0m`;
				} else if (operationType.indexOf("FILE_DOWNLOAD") > -1) {
					monolithStore
						.download(insightId, formatted as string)
						.then(() => {
							if (output && response.errors.length === 0) {
								toast.success("file downloaded successfully");
							}
						})
						.catch(() => {
							toast.error(
								"Error occurred while trying to download",
							);
						});
				}

				updatedHistory.push({
					instructions: getInstructions(
						language,
						"Executed ",
						postfix,
					),
					command: command,
					response: colorizeJSON(
						typeof formatted !== "string"
							? JSON.stringify(formatted, null, 2)
							: formatted,
					),
				});
			}

			// update the history
			setHistory(updatedHistory);
		} catch (e) {
			toast.error(e);

			console.error(e);
		} finally {
			setIsLoading(false);
		}
	};
	const colorizeJSON = (jsonString: string) => {
		return jsonString
			.replace(
				/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?)/g,
				(match) => {
					if (/:$/.test(match)) {
						return `\x1b[34m${match}\x1b[0m`;
					} else {
						return `\x1b[32m${match}\x1b[0m`;
					}
				},
			)
			.replace(/\b(true|false|null)\b/g, (match) => {
				return `\x1b[35m${match}\x1b[0m`;
			})
			.replace(/:\s*"([^"]+)"/, (match) => {
				return `\x1b[36m${match}\x1b[0m`;
			});
	};

	return (
		<Panel
			footer={
				<>
					<ToggleGroup
						type="single"
						value={language}
						onValueChange={(val) => {
							if (val) {
								setCommand("");
								setLanguage(val);
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
						size="sm"
						onClick={() => runCommand()}
						disabled={command?.trim() === ""}
					>
						Run
					</Button>
				</>
			}
		>
			<Terminal
				history={history}
				instructions={getInstructions(language, "Running ")}
				suggestions={suggesstionsList.current}
				onRun={() => runCommand()}
				onCommand={(c) => {
					setCommand(c);
				}}
			/>
		</Panel>
	);
});
