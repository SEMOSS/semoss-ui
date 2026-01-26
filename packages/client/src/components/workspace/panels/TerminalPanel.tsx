import { CodeRounded, TerminalRounded } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useEffect, useRef, useState } from "react";
import { runPixel } from "@semoss/sdk/react";
import {
	Button,
	buildTable,
	Stack,
	styled,
	Terminal,
	type TerminalProps,
	ToggleButton,
	ToggleButtonGroup,
	useNotification,
} from "@semoss/ui";
import PythonLogo from "@/assets/img/Python-logo.svg";
import RLogo from "@/assets/img/R-logo.svg";
import { useRootStore, useWorkspace } from "@/hooks";
import { Panel } from "./Panel";

const StyledImage = styled("img")({
	height: "13px",
	wdith: "13px",
});

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
	const notification = useNotification();

	const [history, setHistory] = useState<TerminalProps["history"]>([]);
	const [_isLoading, setIsLoading] = useState<boolean>(false);
	const { workspace } = useWorkspace();
	const { monolithStore } = useRootStore();

	const [command, setCommand] = useState<string>("");
	const [language, setLanguage] = useState("PIXEL");
	const suggesstionsList = useRef([]);

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
		console.log("instructions", instructions);
		return instructions;
	};

	const getSuggestions = async () => {
		const suggestions = await runPixel("META|help();");
		const suggestionsData = await suggestions;
		const suggestionsJson: string =
			suggestionsData?.pixelReturn[0]?.output || "";
		const suggesstionsArray = suggestionsJson.split("\n");
		const suggestionsIndexBased = suggesstionsArray
			.map((item, index) => (item.indexOf(":") > -1 ? index : -1))
			.filter((item) => item > -1);
		// const suggesstionsArraySplitCount = (suggestionsIndexBased.length - 2  > 0) ? (suggestionsIndexBased.length - 2) * 2 : 2;
		const suggesstionsSection = [];
		const suggesstionsData = {};
		for (let i = 0; i < suggestionsIndexBased.length - 1; i++) {
			suggesstionsSection.push([
				suggestionsIndexBased[i],
				suggestionsIndexBased?.[i + 1] || -1,
			]);
			suggesstionsData[
				suggesstionsArray[suggestionsIndexBased[i]]
					.toString()
					.trim()
					.replaceAll(" ", "")
					.replaceAll(":", "")
			] = suggestionsIndexBased?.[i + 1]
				? suggesstionsArray.slice(
						suggestionsIndexBased[i] + 1,
						suggestionsIndexBased?.[i + 1],
					)
				: suggesstionsArray.slice(suggestionsIndexBased[i] + 1);
		}
		Object.keys(suggesstionsData).forEach((key) => {
			suggesstionsData[key] = suggesstionsData[key].flatMap((item) =>
				item.split(" ").filter((innerItem) => innerItem.length > 0),
			);
		});
		console.log(suggesstionsData, "Suggesstion");
		//returning GeneralReactors for testing suggesstions
		return (
			suggesstionsData || {
				GeneralReactors: [],
			}
		);
	};
	useEffect(() => {
		getSuggestions()
			.then((data) => {
				if (language === "PIXEL") {
					suggesstionsList.current =
						(data as unknown)?.GeneralReactors || [];
				} else if (language === "SHELL") {
					suggesstionsList.current =
						(data as unknown)?.TinkerFrameReactors || [];
				} else if (language === "PYTHON") {
					suggesstionsList.current =
						(data as unknown)?.PythonFrameReactors || [];
				} else if (language === "R") {
					suggesstionsList.current =
						(data as unknown)?.RFrameReactors || [];
				} else {
					suggesstionsList.current =
						(data as unknown)?.GeneralReactors || [];
				}
			})
			.catch((_err) => {
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
				pixel = `Py(code="<encode>${cleaned}</encode>", logs=true);`;
			}

			// run the pixel
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
								notification.add({
									color: "success",
									message: `file downloaded successfully`,
								});
							}
						})
						.catch(() => {
							notification.add({
								color: "error",
								message: `Error occurred while trying to download`,
							});
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
			notification.add({
				color: "error",
				message: e,
			});

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
						// key (yellow: 33m), (blue: 34m)
						return `\x1b[34m${match}\x1b[0m`;
					} else {
						// string value (green)
						return `\x1b[32m${match}\x1b[0m`;
					}
				},
			)
			.replace(/\b(true|false|null)\b/g, (match) => {
				// boolean/null (magenta)
				return `\x1b[35m${match}\x1b[0m`;
			})
			.replace(/:\s*"([^"]+)"/, (match) => {
				// number (cyan)
				return `\x1b[36m${match}\x1b[0m`;
			});
	};

	return (
		<Panel
			footer={
				<>
					<ToggleButtonGroup value={language} exclusive size="small">
						{Object.entries(LANGUAGE).map(([value, name]) => {
							return (
								<ToggleButton
									key={value}
									value={value}
									title={`Switch to ${name}`}
									color={
										language === value
											? "primary"
											: undefined
									}
									onClick={() => {
										setCommand("");
										setLanguage(value);
									}}
								>
									{value === "PIXEL" && (
										<CodeRounded fontSize="inherit" />
									)}
									{value === "PYTHON" && (
										<StyledImage src={PythonLogo} />
									)}
									{value === "R" && (
										<StyledImage src={RLogo} />
									)}
									{value === "SHELL" && (
										<TerminalRounded fontSize="inherit" />
									)}
								</ToggleButton>
							);
						})}
					</ToggleButtonGroup>
					<Stack flex={1}>&nbsp;</Stack>
					<Button
						variant="contained"
						size={"small"}
						onClick={() => runCommand()}
						disabled={command?.trim() === ""}
					>
						Run
					</Button>
				</>
			}
		>
			<Terminal //removing loading option from terminal as per request from ticket 1960
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
