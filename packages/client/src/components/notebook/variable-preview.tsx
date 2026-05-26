import { observer } from "mobx-react-lite";
import { useMemo } from "react";
import {
	Renderer,
	type SerializedState,
	useBlocks,
	type Variable,
} from "@semoss/renderer";
import { Separator } from "@semoss/ui/next";
import PreviewButton from "@/assets/img/PreviewRounded.png";
import { JsonValueViewer } from "@/components/common/json-value-viewer";
import { isOutputJSON } from "@/utility";
import {
	type EnginesByType,
	findEngineRecord,
	getVariableTypeLabel,
	VariableIcon,
} from "./variable-icon";

interface VariablePreviewProps {
	/**
	 * Which variable to preview
	 */
	variable: Variable;

	/**
	 * id of the variable
	 */
	id: string;

	/**
	 * Engines lookup (for resolving engine display name + icon)
	 */
	engines: EnginesByType;
}

/**
 * Pull the most representative source code/text out of a cell's parameters so we
 * can preview the cell's *intent* when it hasn't yet been executed. Code cells
 * keep their source in `parameters.code`, query-import cells in
 * `parameters.selectQuery`, etc. We fall back to a JSON dump if we don't
 * recognise the shape.
 */
const extractCellCode = (
	parameters: Record<string, unknown> | undefined,
): string => {
	if (!parameters) return "";
	const candidateKeys = [
		"code",
		"selectQuery",
		"query",
		"prompt",
		"text",
		"value",
	];
	for (const key of candidateKeys) {
		const v = parameters[key];
		if (typeof v === "string" && v.trim().length > 0) return v;
	}
	return JSON.stringify(parameters, null, 2);
};

export const VariablePreview = observer(
	(props: VariablePreviewProps): JSX.Element => {
		const { variable, id, engines } = props;
		const { state } = useBlocks();

		const getStateWithBlock = (to: string) => {
			try {
				const block = state.getBlock(to);
				const s: SerializedState = {
					version: "1.0.0-alpha.3",
					executionOrder: [],
					variables: {},
					queries: {},
					blocks: {
						"page-1": {
							id: "page-1",
							widget: "page",
							parent: null,
							data: {
								style: {
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									backgroundColor: "#FAFAFA",
								},
							},
							listeners: {
								onPageLoad: {
									type: "sync",
									order: [],
								},
							},
							slots: {
								content: {
									name: "content",
									children: [to],
								},
							},
						},
						[to]: {
							id: block.id,
							widget: block.widget,
							data: block.data,
							parent: null,
							listeners: block.listeners,
							slots: block.slots,
						},
					},
				};

				return s;
			} catch {
				return null;
			}
		};

		const engine = useMemo(
			() => findEngineRecord(variable, engines),
			[variable, engines],
		);

		const typeLabel = useMemo(() => {
			if (engine) return engine.engine_name;
			return getVariableTypeLabel(variable.type);
		}, [variable, engine]);

		// For cell vars, also show which notebook (query) they belong to.
		const parentNotebook = useMemo(() => {
			if (variable.type !== "cell") return null;
			const to = variable.to;
			if (!to) return null;
			try {
				return state.getNotebook(to)?.id ?? to;
			} catch {
				return to;
			}
		}, [variable]);

		const { content, executed } = useMemo<{
			content: JSX.Element;
			executed: boolean;
		}>(() => {
			try {
				if (variable.type === "block") {
					const config = variable.to
						? getStateWithBlock(variable.to)
						: null;
					if (config) {
						return {
							content: (
								<div className="relative w-full min-w-0 overflow-hidden">
									<Renderer state={config} preview={true} />
								</div>
							),
							executed: true,
						};
					}
					return {
						content: (
							<span className="font-bold text-destructive text-sm">
								Block is no longer available
							</span>
						),
						executed: false,
					};
				}

				if (variable.type === "cell" && variable.cellId) {
					const notebook = state.getNotebook(variable.to);
					const cell = notebook?.getCell(variable.cellId);
					if (cell?.output !== undefined && cell?.output !== null) {
						const value = isOutputJSON(cell.output);
						return {
							content:
								value != null ? (
									<JsonValueViewer value={value} />
								) : (
									<span className="break-all text-muted-foreground text-sm">
										{String(cell.output)}
									</span>
								),
							executed: true,
						};
					}
					return {
						content: (
							<pre className="w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
								{extractCellCode(
									cell?.parameters as Record<string, unknown>,
								) || "—"}
							</pre>
						),
						executed: false,
					};
				}

				if (variable.type === "query") {
					if (!variable.to) {
						return {
							content: (
								<span className="text-muted-foreground text-sm">
									Value is undefined
								</span>
							),
							executed: false,
						};
					}
					const notebook = state.getNotebook(variable.to);
					if (
						notebook?.output !== undefined &&
						notebook?.output !== null
					) {
						const value = isOutputJSON(notebook.output);
						return {
							content:
								value != null ? (
									<JsonValueViewer value={value} />
								) : (
									<span className="break-all text-muted-foreground text-sm">
										{String(notebook.output)}
									</span>
								),
							executed: true,
						};
					}
					// fall back to the last cell's code
					const list = notebook?.list ?? [];
					const lastCellId = list[list.length - 1];
					const lastCell = lastCellId
						? notebook?.getCell(lastCellId)
						: null;
					return {
						content: (
							<pre className="w-full overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-muted/50 px-3 py-2 font-mono text-xs">
								{extractCellCode(
									lastCell?.parameters as Record<
										string,
										unknown
									>,
								) || "—"}
							</pre>
						),
						executed: false,
					};
				}

				// primitive / engine types — show resolved value
				const found = state.parseVariable(`{{${id}}}`);
				const value = isOutputJSON(found);
				if (value != null) {
					return {
						content: <JsonValueViewer value={value} />,
						executed: true,
					};
				}
				return {
					content: (
						<span className="break-all text-muted-foreground text-sm">
							{typeof found === "string"
								? found
								: JSON.stringify(found)}
						</span>
					),
					executed: true,
				};
			} catch {
				return {
					content: (
						<span className="text-muted-foreground text-sm">
							Value is undefined
						</span>
					),
					executed: false,
				};
			}
		}, [variable, id]);

		const valueRow = useMemo(() => {
			let val: string;

			if (variable.type === "block") {
				try {
					if (!variable.to) {
						val = "undefined";
					} else {
						const blockData = state.getBlock(variable.to).data as
							| { value?: unknown }
							| undefined;
						val =
							blockData?.value !== undefined
								? String(blockData.value)
								: "undefined";
					}
				} catch {
					val = "undefined";
				}
			} else {
				const found = state.parseVariable(`{{${id}}}`);
				val = typeof found === "string" ? found : JSON.stringify(found);
			}
			return val;
		}, [variable, id]);

		return (
			<div className="flex h-auto max-h-[80vh] w-[min(calc(100vw-2rem),26rem)] flex-col items-start overflow-hidden rounded-xl bg-background shadow-lg">
				<div className="flex w-full items-center gap-2 px-4 py-3">
					<VariableIcon
						variable={variable}
						engines={engines}
						className="size-5"
					/>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="truncate font-medium text-sm">
							{id}
						</span>
						<span className="truncate text-muted-foreground text-xs">
							{typeLabel}
							{parentNotebook && (
								<>
									{" "}
									·{" "}
									<span className="font-medium">
										in {parentNotebook}
									</span>
								</>
							)}
						</span>
					</div>
				</div>
				<Separator />
				<div className="flex items-center gap-2 px-4 py-2">
					<img src={PreviewButton} alt="" className="h-5 w-5" />
					<span className="font-medium text-[#0471F0] text-sm">
						{executed ? "Preview" : "Source (not yet executed)"}
					</span>
				</div>
				<div className="flex max-h-[220px] w-full flex-col items-start gap-2 overflow-y-auto px-4 pb-3">
					{content}
				</div>
				<Separator />
				<div className="flex w-full flex-col items-start gap-1 overflow-y-auto px-4 py-3">
					<div className="flex w-full gap-2">
						<span className="font-medium text-sm">Name:</span>
						<span className="min-w-0 break-all text-muted-foreground text-sm">
							{id}
						</span>
					</div>
					<div className="flex w-full gap-2">
						<span className="font-medium text-sm">Type:</span>
						<span className="min-w-0 break-all text-muted-foreground text-sm">
							{typeLabel}
						</span>
					</div>
					{parentNotebook && (
						<div className="flex w-full gap-2">
							<span className="font-medium text-sm">
								Notebook:
							</span>
							<span className="min-w-0 break-all text-muted-foreground text-sm">
								{parentNotebook}
							</span>
						</div>
					)}
					<div className="flex w-full gap-2">
						<span className="font-medium text-sm">Value:</span>
						<span className="min-w-0 break-all text-muted-foreground text-sm">
							{valueRow}
						</span>
					</div>
				</div>
			</div>
		);
	},
);
