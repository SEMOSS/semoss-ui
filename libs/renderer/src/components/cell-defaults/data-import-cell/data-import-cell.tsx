// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Pencil } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { EngineSubtypeIcon, MonacoEditor } from "@semoss/shared";
import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";
import { DataImportFormModal } from "../../shared/data-import-form-modal";

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500;
const NOTEBOOK_PIXEL_THEME_LIGHT = "notebook-pixel-theme-light";
const NOTEBOOK_PIXEL_THEME_DARK = "notebook-pixel-theme-dark";

const getNotebookPixelTheme = () =>
	typeof document !== "undefined" &&
	document.documentElement.classList.contains("dark")
		? NOTEBOOK_PIXEL_THEME_DARK
		: NOTEBOOK_PIXEL_THEME_LIGHT;

interface JoinObject {
	id: string;
	joinType: string;
	leftTable: string;
	rightTable: string;
	rightKey: string;
	leftKey: string;
}

export interface DataImportCellDef extends CellDef<"data-import"> {
	widget: "data-import";
	parameters: {
		databaseId: string;
		frameType: "NATIVE" | "PY" | "R" | "GRID" | "PIXEL";
		frameVariableName: string;
		selectQuery: string;
		rootTable: string;
		selectedColumns: string[];
		columnAliases: string[];
		tableNames: string[];
		joins: JoinObject[];
		dataLimit: number;
	};
}

export const DataImportCell: CellComponent<DataImportCellDef> = observer(
	(props) => {
		// biome-ignore lint/suspicious/noExplicitAny: external API type
		const editorRef = useRef<any>(null);
		// biome-ignore lint/suspicious/noExplicitAny: external API type
		const monacoRef = useRef<any>(null);
		const [showStyledView, setShowStyledView] = useState(true);
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [isDataImportModalOpen, setIsDataImportModalOpen] =
			useState(false);

		interface DatabaseEntry {
			id: string;
			name: string;
			type: string;
			subtype?: string;
		}

		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState<{
			loading: boolean;
			display: Record<string, string>;
			ids: string[];
			byId: Record<string, DatabaseEntry>;
		}>({
			loading: true,
			display: {},
			ids: [],
			byId: {},
		});
		const [dataLimit, setDataLimit] = useState(
			cell.parameters.dataLimit || null,
		);

		const myDbs = usePixel<
			Array<{
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype?: string;
			}>
		>(`MyEngines(engineTypes=['DATABASE']);`);

		const selectedDatabase = useMemo(
			() => cfgLibraryDatabases.byId[cell.parameters.databaseId],
			[cfgLibraryDatabases.byId, cell.parameters.databaseId],
		);

		// Ask the backend to materialize the SQL behind the cell's
		// `Database(...) | Select(...) | ...` pixel via the ConvertToQuery
		// reactor. We strip the trailing semicolon so we can pipe.
		const convertToQueryPixel = (() => {
			const sq = cell.parameters.selectQuery?.trim();
			if (!sq || !cell.parameters.databaseId) return "";
			const withoutTrailingSemi = sq.replace(/;\s*$/, "");
			return `META | ${withoutTrailingSemi} | ConvertToQuery();`;
		})();
		const generatedQuery = usePixel<string>(convertToQueryPixel);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") return;

			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			const byId: Record<string, DatabaseEntry> = {};
			myDbs.data.forEach((db) => {
				dbIds.push(db.engine_id);
				dbDisplay[db.engine_id] = db.engine_name;
				byId[db.engine_id] = {
					id: db.engine_id,
					name: db.engine_name,
					type: db.engine_type,
					subtype: db.engine_subtype,
				};
			});
			setCfgLibraryDatabases({
				loading: false,
				display: dbDisplay,
				ids: dbIds,
				byId,
			});

			if (!cell.parameters.databaseId && dbIds.length) {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						path: "parameters.databaseId",
						queryId: cell.query.id,
						cellId: cell.id,
						value: dbIds[0],
					},
				});
			}
		}, [myDbs.status, myDbs.data]);

		// biome-ignore lint/suspicious/noExplicitAny: external API type
		const handleEditorMount = (editor: any, monaco: any) => {
			editorRef.current = editor;
			monacoRef.current = monaco;
			let ignoreResize = false;
			editor.onDidContentSizeChange(() => {
				try {
					if (ignoreResize) return;
					ignoreResize = true;
					resizeEditor();
				} finally {
					ignoreResize = false;
				}
			});

			editor.addAction({
				id: "run",
				label: "Run",
				keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
				// biome-ignore lint/suspicious/noExplicitAny: external API type
				run: (editor: any) => {
					const newValue = editor.getValue();
					state.dispatch({
						message: ActionMessages.UPDATE_CELL,
						payload: {
							path: "parameters.selectQuery",
							queryId: cell.query.id,
							cellId: cell.id,
							value: newValue,
						},
					});
					state.dispatch({
						message: ActionMessages.RUN_CELL,
						payload: { queryId: cell.query.id, cellId: cell.id },
					});
				},
			});

			monaco.editor.defineTheme(NOTEBOOK_PIXEL_THEME_LIGHT, {
				base: "vs",
				inherit: true,
				rules: [],
				colors: { "editor.background": "#FAFAFA" },
			});
			monaco.editor.defineTheme(NOTEBOOK_PIXEL_THEME_DARK, {
				base: "vs-dark",
				inherit: true,
				rules: [],
				colors: { "editor.background": "#171717" },
			});
			monaco.editor.setTheme(getNotebookPixelTheme());
			resizeEditor();
		};

		useEffect(() => {
			const root =
				typeof document !== "undefined"
					? document.documentElement
					: null;
			if (!root) return;

			const applyTheme = () => {
				const monaco = monacoRef.current;
				if (!monaco) return;
				monaco.editor.setTheme(getNotebookPixelTheme());
			};

			applyTheme();
			const observer = new MutationObserver(applyTheme);
			observer.observe(root, {
				attributes: true,
				attributeFilter: ["class"],
			});

			return () => observer.disconnect();
		}, []);

		const resizeEditor = () => {
			if (!editorRef.current) return;
			let height = 0;
			if (isExpanded) {
				height = Math.min(
					editorRef.current.getContentHeight(),
					EDITOR_MAX_HEIGHT,
				);
			}
			height += EDITOR_LINE_HEIGHT;
			editorRef.current.layout({
				width: editorRef.current.getContainerDomNode().clientWidth,
				height,
			});
		};

		const handleEditorChange = (newValue: string | undefined) => {
			if (cell.isLoading || !newValue) return;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					value: newValue,
					path: "parameters.selectQuery",
					queryId: cell.query.id,
					cellId: cell.id,
				},
			});
		};

		const updateDataLimit = (query: string): string => {
			return query.replace(
				/Limit\s*\(\s*-*\d+\s*\)/,
				`Limit ( ${cell.parameters.dataLimit || -1} )`,
			);
		};

		const handleDataLimitUpdate = (
			e: React.ChangeEvent<HTMLInputElement>,
		) => {
			let value = parseInt(e.target.value, 10);
			if (Number.isNaN(value)) {
				value = -1;
			} else {
				if (value <= 0) value = 1;
				if (value >= 10000) value = 10000;
			}
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					path: "parameters.dataLimit",
					queryId: cell.query.id,
					cellId: cell.id,
					value,
				},
			});
			const updatedSelectQuery = updateDataLimit(
				cell.parameters.selectQuery,
			);
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					path: "parameters.selectQuery",
					queryId: cell.query.id,
					cellId: cell.id,
					value: updatedSelectQuery,
				},
			});
			setDataLimit(value === -1 ? null : value);
		};

		const dispatch = (path: string, value: unknown) =>
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path,
					value,
				},
			});

		return (
			<div className="relative flex w-full flex-col gap-2">
				{isExpanded && (
					<div className="flex flex-row flex-wrap items-end justify-between gap-2">
						{selectedDatabase ? (
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="text-muted-foreground text-xs">
									Database
								</span>
								<Select
									disabled
									value={cell.parameters.databaseId}
								>
									<SelectTrigger className="h-auto min-h-9 w-full max-w-md py-1.5">
										<SelectValue>
											<div className="flex items-center gap-2">
												<EngineSubtypeIcon
													engineType={
														selectedDatabase.type
													}
													engineSubtype={
														selectedDatabase.subtype
													}
													alt={`${selectedDatabase.name} icon`}
													className="size-5 shrink-0 object-contain"
												/>
												<div className="flex min-w-0 flex-col items-start text-left">
													<span className="truncate text-sm">
														{selectedDatabase.name}
													</span>
													<span className="truncate text-muted-foreground text-xs">
														{selectedDatabase.id}
													</span>
												</div>
											</div>
										</SelectValue>
									</SelectTrigger>
									<SelectContent />
								</Select>
							</div>
						) : (
							<div />
						)}
						<Button
							variant="outline"
							size="sm"
							className="h-9"
							onClick={() => setIsDataImportModalOpen(true)}
							key={`cell-edit-data-import-${cell.id}`}
						>
							<Pencil className="mr-1 size-3.5" />
							Edit
						</Button>
					</div>
				)}

				{showStyledView ? (
					<div className="flex flex-col gap-3">
						{convertToQueryPixel && (
							<div className="flex flex-col gap-1">
								<span className="text-muted-foreground text-xs">
									Generated Query
								</span>
								<pre className="max-h-[200px] overflow-auto whitespace-pre-wrap break-words rounded-md border bg-muted/30 px-3 py-2 font-mono text-xs">
									{generatedQuery.status === "SUCCESS"
										? typeof generatedQuery.data ===
											"string"
											? generatedQuery.data
											: JSON.stringify(
													generatedQuery.data,
													null,
													2,
												)
										: generatedQuery.status === "ERROR"
											? "Unable to generate SQL"
											: "Generating…"}
								</pre>
							</div>
						)}
					</div>
				) : (
					<div>
						<Suspense fallback={<>...</>}>
							<MonacoEditor
								defaultValue={
									cell.parameters.selectQuery
										.slice(0, -1)
										.replace(
											/\s*\|\s*Limit\s*\(\s*[^)]*\s*\)/,
											"",
										) +
									` | Import ( frame = [ CreateFrame ( frameType = [ "${cell.parameters.frameType}" ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] ) ; Frame ( frame = [ "${cell.parameters.frameVariableName}" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`
								}
								language="pixel"
								options={{
									scrollbar: {
										alwaysConsumeMouseWheel: false,
									},
									lineHeight: EDITOR_LINE_HEIGHT,
									scrollBeyondLastLine: false,
									overviewRulerBorder: false,
									minimap: { enabled: false },
									lineNumbersMinChars: 2,
									automaticLayout: true,
									glyphMargin: false,
									lineNumbers: "on",
									readOnly: true,
									folding: false,
								}}
								onChange={handleEditorChange}
								onMount={handleEditorMount}
							/>
						</Suspense>
					</div>
				)}

				{isExpanded && (
					<div className="flex flex-row flex-wrap items-end gap-3 overflow-hidden rounded-md border bg-muted/30 px-3 py-2">
						<div className="flex min-w-[110px] max-w-[170px] flex-1 flex-col gap-1">
							<span className="text-muted-foreground text-xs">
								Frame type
							</span>
							<Select
								disabled={cell.isLoading}
								value={cell.parameters.frameType}
								onValueChange={(val) =>
									dispatch("parameters.frameType", val)
								}
							>
								<SelectTrigger className="h-9 w-full">
									<SelectValue placeholder="Frame type" />
								</SelectTrigger>
								<SelectContent>
									{Object.values(DATA_FRAME_TYPES).map(
										(frame, i) => (
											<SelectItem
												key={`${i}-${cell.id}-${frame.value}`}
												value={frame.value}
											>
												{frame.display}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
						</div>
						<div className="flex min-w-[140px] max-w-[170px] flex-1 flex-col gap-1 overflow-hidden">
							<span className="text-muted-foreground text-xs">
								Variable name
							</span>
							<Input
								title="Set frame variable name"
								value={cell.parameters.frameVariableName}
								key={`frame-variable-name-${cell.id}`}
								disabled={cell.isLoading}
								size={1}
								className="box-border h-9 w-full text-sm"
								onChange={(e) =>
									dispatch(
										"parameters.frameVariableName",
										e.target.value,
									)
								}
							/>
						</div>
						<div className="flex min-w-[100px] max-w-[170px] flex-1 flex-col gap-1 overflow-hidden">
							<span className="text-muted-foreground text-xs">
								Data limit
							</span>
							<Input
								type="number"
								placeholder="No limit"
								value={dataLimit ?? ""}
								onChange={handleDataLimitUpdate}
								size={1}
								className="box-border h-9 w-full text-sm"
								key="data-limit-number"
							/>
						</div>
						<Button
							variant="ghost"
							size="sm"
							className="ml-auto h-9 self-end"
							onClick={() => setShowStyledView(!showStyledView)}
							key="show-hide-pixel-button"
						>
							{showStyledView ? "Show" : "Hide"} Pixel
						</Button>
					</div>
				)}

				{isDataImportModalOpen && (
					<DataImportFormModal
						setIsDataImportModalOpen={setIsDataImportModalOpen}
						query={cell.query}
						previousCellId={undefined}
						editMode={true}
						cell={cell}
					/>
				)}
			</div>
		);
	},
);
