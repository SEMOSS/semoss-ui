// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { Columns3 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import {
	EngineSubtypeIcon,
	MonacoEditor,
	registerSparqlLanguage,
	SPARQL_LANGUAGE_ID,
	SPARQL_THEME_LIGHT,
} from "@semoss/shared";
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
import { DatabaseTables } from "./database-tables";

const EDITOR_LINE_HEIGHT = 20;
const EDITOR_MIN_LINES = 6;
const EDITOR_MAX_HEIGHT = 700;

export interface NotebookImportCellDef extends CellDef<"query-import"> {
	widget: "query-import";
	parameters: {
		databaseId: string;
		frameType: "NATIVE" | "PY" | "R" | "GRID";
		frameVariableName: string;
		selectQuery: string;
	};
}

export const NotebookImportCell: CellComponent<NotebookImportCellDef> =
	observer((props) => {
		const editorRef = useRef(null);

		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [showTables, setShowTables] = useState(false);

		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState<{
			loading: boolean;
			ids: string[];
			byId: Record<
				string,
				{
					id: string;
					name: string;
					type: string;
					subtype?: string;
				}
			>;
		}>({
			loading: true,
			ids: [],
			byId: {},
		});
		const myDbs = usePixel<
			Array<{
				engine_id: string;
				engine_name: string;
				engine_type: string;
				engine_subtype?: string;
			}>
		>(`MyEngines(engineTypes=['DATABASE']);`);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") return;

			const dbIds: string[] = [];
			const byId: Record<
				string,
				{
					id: string;
					name: string;
					type: string;
					subtype?: string;
				}
			> = {};
			myDbs.data.forEach((db) => {
				dbIds.push(db.engine_id);
				byId[db.engine_id] = {
					id: db.engine_id,
					name: db.engine_name,
					type: db.engine_type,
					subtype: db.engine_subtype,
				};
			});
			setCfgLibraryDatabases({
				loading: false,
				ids: dbIds,
				byId,
			});

			if (!cell.parameters.databaseId && dbIds.length) {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "parameters.databaseId",
						value: dbIds[0],
					},
				});
			}
		}, [myDbs.status, myDbs.data]);

		const selectedDatabase = useMemo(
			() => cfgLibraryDatabases.byId[cell.parameters.databaseId],
			[cfgLibraryDatabases.byId, cell.parameters.databaseId],
		);

		const dbCategory = usePixel<string>(
			cell.parameters.databaseId
				? `META | GetDatabaseCategory(engine=["${cell.parameters.databaseId}"]);`
				: "",
		);

		const isSparql = useMemo(
			() =>
				dbCategory.status === "SUCCESS" &&
				typeof dbCategory.data === "string" &&
				dbCategory.data.toUpperCase() === "RDF",
			[dbCategory.status, dbCategory.data],
		);

		const editorLanguage = isSparql ? SPARQL_LANGUAGE_ID : "sql";
		const editorPlaceholder = isSparql
			? "# SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 100"
			: "-- SELECT * FROM ...";

		// biome-ignore lint/suspicious/noExplicitAny: monaco editor + monaco namespace types
		const handleEditorMount = (editor: any, monaco: any) => {
			editorRef.current = editor;

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
				// biome-ignore lint/suspicious/noExplicitAny: monaco editor types
				run: (editor: any) => {
					const newValue = editor.getValue();
					state.dispatch({
						message: ActionMessages.UPDATE_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: cell.id,
							path: "parameters.selectQuery",
							value: newValue,
						},
					});

					state.dispatch({
						message: ActionMessages.RUN_CELL,
						payload: {
							queryId: cell.query.id,
							cellId: cell.id,
						},
					});
				},
			});

			if (isSparql) {
				registerSparqlLanguage(monaco);
				monaco.editor.setTheme(SPARQL_THEME_LIGHT);
			} else {
				monaco.editor.defineTheme("notebook-sql-theme", {
					base: "vs",
					inherit: true,
					rules: [],
					colors: { "editor.background": "#FAFAFA" },
				});
				monaco.editor.setTheme("notebook-sql-theme");
			}
			resizeEditor();
		};

		const resizeEditor = () => {
			if (!editorRef.current) return;
			const minHeight = EDITOR_LINE_HEIGHT * EDITOR_MIN_LINES;
			let height = minHeight;
			if (isExpanded) {
				const contentHeight =
					editorRef.current.getContentHeight() + EDITOR_LINE_HEIGHT;
				height = Math.max(
					minHeight,
					Math.min(contentHeight, EDITOR_MAX_HEIGHT),
				);
			}
			editorRef.current.layout({
				width: editorRef.current.getContainerDomNode().clientWidth,
				height,
			});
		};

		const handleEditorChange = (newValue: string) => {
			if (cell.isLoading) return;
			state.dispatch({
				message: ActionMessages.UPDATE_CELL,
				payload: {
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.selectQuery",
					value: newValue,
				},
			});
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
			<div className="relative flex w-full min-w-0 flex-col gap-3 overflow-hidden">
				{isExpanded && (
					<div className="flex flex-col gap-2">
						<div className="flex flex-row flex-wrap items-end justify-between gap-2">
							<div className="flex min-w-0 flex-1 flex-col gap-1">
								<span className="text-muted-foreground text-xs">
									Database
								</span>
								<Select
									disabled={cell.isLoading}
									value={cell.parameters.databaseId}
									onValueChange={(val) =>
										dispatch("parameters.databaseId", val)
									}
								>
									<SelectTrigger className="h-auto min-h-9 w-full max-w-md py-1.5">
										<SelectValue placeholder="Select database">
											{selectedDatabase ? (
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
															{
																selectedDatabase.name
															}
														</span>
														<span className="truncate text-muted-foreground text-xs">
															{
																selectedDatabase.id
															}
														</span>
													</div>
												</div>
											) : null}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{cfgLibraryDatabases.ids.map(
											(databaseId: string, i: number) => {
												const db =
													cfgLibraryDatabases.byId[
														databaseId
													];
												return (
													<SelectItem
														key={`${i}-${cell.id}-${databaseId}`}
														value={databaseId}
													>
														<div className="flex items-center gap-2">
															<EngineSubtypeIcon
																engineType={
																	db?.type ??
																	""
																}
																engineSubtype={
																	db?.subtype
																}
																alt={`${db?.name ?? databaseId} icon`}
																className="size-5 shrink-0 object-contain"
															/>
															<div className="flex min-w-0 flex-col items-start">
																<span className="truncate text-sm">
																	{db?.name ??
																		databaseId}
																</span>
																<span className="truncate text-muted-foreground text-xs">
																	{databaseId}
																</span>
															</div>
														</div>
													</SelectItem>
												);
											},
										)}
									</SelectContent>
								</Select>
							</div>
							<Button
								variant="outline"
								size="sm"
								className="h-9"
								onClick={() => setShowTables(!showTables)}
							>
								<Columns3 className="mr-1 size-3.5" />
								{showTables ? "Hide" : "Show"} columns
							</Button>
						</div>
						{showTables && cell.parameters.databaseId ? (
							<DatabaseTables
								databaseId={cell.parameters.databaseId}
							/>
						) : null}
					</div>
				)}
				<div className="relative overflow-hidden rounded-md border bg-[#FAFAFA]">
					<span
						className="pointer-events-none absolute top-2 right-3 z-10 select-none rounded-sm bg-background/80 px-1.5 py-0.5 font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-wider"
						aria-hidden
					>
						{isSparql ? "SPARQL" : "SQL"}
					</span>
					<Suspense fallback={<>...</>}>
						<MonacoEditor
							key={editorLanguage}
							value={cell.parameters.selectQuery}
							defaultValue={editorPlaceholder}
							language={editorLanguage}
							options={{
								scrollbar: {
									alwaysConsumeMouseWheel: false,
									horizontal: "hidden",
									horizontalScrollbarSize: 0,
								},
								readOnly: false,
								minimap: { enabled: false },
								automaticLayout: true,
								scrollBeyondLastLine: false,
								lineHeight: EDITOR_LINE_HEIGHT,
								fontSize: 14,
								overviewRulerBorder: false,
								lineNumbers: "on",
								glyphMargin: false,
								folding: false,
								lineNumbersMinChars: 3,
								wordWrap: "on",
								wrappingStrategy: "advanced",
								tabSize: 4,
								quickSuggestions: true,
								suggestOnTriggerCharacters: true,
								padding: { top: 12, bottom: 12 },
								renderLineHighlight: "all",
								cursorBlinking: "smooth",
								smoothScrolling: true,
							}}
							onChange={handleEditorChange}
							onMount={handleEditorMount}
						/>
					</Suspense>
				</div>
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
					</div>
				)}
			</div>
		);
	});
