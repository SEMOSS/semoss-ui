// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { FilePenLine, Maximize2, Pencil } from "lucide-react";
import { observer } from "mobx-react-lite";
import { Suspense, useEffect, useRef, useState } from "react";
import { DATA_FRAME_TYPES } from "@semoss/sdk";
import { usePixel } from "@semoss/sdk/react";
import { MonacoEditor } from "@semoss/shared";
import {
	Button,
	Checkbox,
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
import { QueryImportFormModal } from "../../shared/QueryImportFormModal";
import { DatabaseTables } from "./DatabaseTables";

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500;

export interface QueryImportCellDef extends CellDef<"query-import"> {
	widget: "query-import";
	parameters: {
		databaseId: string;
		frameType: "NATIVE" | "PY" | "R" | "GRID";
		frameVariableName: string;
		selectQuery: string;
		enableBatching?: boolean;
		batchSize?: number;
		currentOffset?: number;
	};
}

export const QueryImportCell: CellComponent<QueryImportCellDef> = observer(
	(props) => {
		// biome-ignore lint/suspicious/noExplicitAny: monaco editor type is complex
		const editorRef = useRef<any>(null);

		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [showTables, setShowTables] = useState(false);
		const [isQueryImportModalOpen, setIsQueryImportModalOpen] =
			useState<boolean>(false);

		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState<{
			loading: boolean;
			ids: string[];
			display: Record<string, string>;
		}>({
			loading: true,
			ids: [],
			display: {},
		});
		const myDbs = usePixel<{ engine_id: string; engine_name: string }[]>(
			`MyEngines(engineTypes=['DATABASE']);`,
		);

		const hasInitialized = useRef(false);
		useEffect(() => {
			if (
				!hasInitialized.current &&
				cell.parameters.enableBatching &&
				(cell.parameters.currentOffset ?? 0) !== 0
			) {
				hasInitialized.current = true;
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: {
						queryId: cell.query.id,
						cellId: cell.id,
						path: "parameters.currentOffset",
						value: 0,
					},
				});
			}
		}, []);

		useEffect(() => {
			if (myDbs.status !== "SUCCESS") return;

			const dbIds: string[] = [];
			const dbDisplay: Record<string, string> = {};
			myDbs.data.forEach((db) => {
				dbIds.push(db.engine_id);
				dbDisplay[db.engine_id] = db.engine_name;
			});
			setCfgLibraryDatabases({
				loading: false,
				ids: dbIds,
				display: dbDisplay,
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

		// biome-ignore lint/suspicious/noExplicitAny: monaco types are complex
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
				// biome-ignore lint/suspicious/noExplicitAny: monaco editor type is complex
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

					if (cell.parameters.enableBatching) {
						state.dispatch({
							message: ActionMessages.UPDATE_CELL,
							payload: {
								queryId: cell.query.id,
								cellId: cell.id,
								path: "parameters.currentOffset",
								value: 0,
							},
						});
						setTimeout(() => {
							state.dispatch({
								message: ActionMessages.RUN_CELL,
								payload: {
									queryId: cell.query.id,
									cellId: cell.id,
								},
							});
						}, 50);
					} else {
						state.dispatch({
							message: ActionMessages.RUN_CELL,
							payload: {
								queryId: cell.query.id,
								cellId: cell.id,
							},
						});
					}
				},
			});

			monaco.editor.defineTheme("custom-theme", {
				base: "vs",
				inherit: false,
				rules: [],
				colors: { "editor.background": "#FAFAFA" },
			});
			monaco.editor.setTheme("custom-theme");
			resizeEditor();
		};

		const resizeEditor = () => {
			let height = 0;
			if (isExpanded) {
				height = Math.min(
					editorRef.current?.getContentHeight() ?? 0,
					EDITOR_MAX_HEIGHT,
				);
			}
			height += EDITOR_LINE_HEIGHT;
			editorRef.current?.layout({
				width:
					editorRef.current?.getContainerDomNode().clientWidth ?? 0,
				height,
			});
		};

		const handleEditorChange = (newValue: string | undefined) => {
			if (cell.isLoading || newValue === undefined) return;
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
			<div className="relative flex w-full min-w-0 flex-col gap-2 overflow-hidden">
				{isExpanded && (
					<div className="flex flex-col gap-1">
						<div className="flex flex-row items-center justify-between">
							<Select
								disabled={cell.isLoading}
								value={cell.parameters.databaseId}
								onValueChange={(val) =>
									dispatch("parameters.databaseId", val)
								}
							>
								<SelectTrigger className="h-[30px] w-[200px]">
									<SelectValue placeholder="Select Database" />
								</SelectTrigger>
								<SelectContent>
									{cfgLibraryDatabases.ids.map(
										(databaseId: string, i: number) => (
											<SelectItem
												key={`${i}-${cell.id}-${databaseId}`}
												value={databaseId}
											>
												{cfgLibraryDatabases.display[
													databaseId
												] ?? ""}
											</SelectItem>
										),
									)}
								</SelectContent>
							</Select>
							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									onClick={() => setShowTables(!showTables)}
								>
									{showTables ? "Hide" : "Show"} Available
									Columns
								</Button>
								<Button
									variant="ghost"
									onClick={() =>
										setIsQueryImportModalOpen(true)
									}
									key={`cell-edit-query-import-${cell.id}`}
								>
									<Pencil className="mr-1 size-4" />
									Edit
								</Button>
							</div>
						</div>
						{showTables && cell.parameters.databaseId ? (
							<DatabaseTables
								databaseId={cell.parameters.databaseId}
							/>
						) : null}
					</div>
				)}
				<div>
					<Suspense fallback={<>...</>}>
						<MonacoEditor
							value={cell.parameters.selectQuery}
							defaultValue="--SELECT * FROM..."
							language="sql"
							options={{
								scrollbar: { alwaysConsumeMouseWheel: false },
								readOnly: false,
								minimap: { enabled: false },
								automaticLayout: true,
								scrollBeyondLastLine: false,
								lineHeight: EDITOR_LINE_HEIGHT,
								overviewRulerBorder: false,
								lineNumbers: "on",
								glyphMargin: false,
								folding: false,
								lineNumbersMinChars: 2,
							}}
							onChange={handleEditorChange}
							onMount={handleEditorMount}
						/>
					</Suspense>
				</div>
				{isExpanded && (
					<div className="flex flex-row flex-nowrap items-center justify-end gap-2">
						<Select
							disabled={cell.isLoading}
							value={cell.parameters.frameType}
							onValueChange={(val) =>
								dispatch("parameters.frameType", val)
							}
						>
							<SelectTrigger className="h-[30px] w-[125px]">
								<Maximize2 className="mr-1 size-4 shrink-0" />
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
						<div className="relative flex items-center">
							<FilePenLine className="-translate-y-1/2 absolute top-1/2 left-2 size-4 text-muted-foreground" />
							<Input
								title="Set Frame Variable Name"
								value={cell.parameters.frameVariableName}
								disabled={cell.isLoading}
								className="h-[30px] w-[150px] pl-9"
								onChange={(e) =>
									dispatch(
										"parameters.frameVariableName",
										e.target.value,
									)
								}
							/>
						</div>
						{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
						<label className="flex cursor-pointer items-center gap-1">
							<Checkbox
								checked={
									cell.parameters.enableBatching ?? false
								}
								disabled={cell.isLoading}
								onCheckedChange={(checked: boolean) => {
									dispatch(
										"parameters.enableBatching",
										checked,
									);
									dispatch("parameters.currentOffset", 0);
									if (checked) {
										dispatch("parameters.batchSize", 100);
									}
								}}
							/>
							{!cell.parameters.enableBatching && (
								<span className="text-muted-foreground text-sm">
									Enable Batching
								</span>
							)}
						</label>
						{cell.parameters.enableBatching && (
							<>
								<Input
									title="Batch Size"
									type="number"
									placeholder="Batch Amount..."
									value={cell.parameters.batchSize ?? 100}
									disabled={cell.isLoading}
									className="h-[30px] w-[120px]"
									onChange={(e) => {
										const inputValue = e.target.value;
										if (inputValue === "") {
											dispatch(
												"parameters.batchSize",
												"",
											);
											return;
										}
										const value = Number.parseInt(
											inputValue,
											10,
										);
										if (
											!Number.isNaN(value) &&
											value >= 0
										) {
											dispatch(
												"parameters.batchSize",
												value,
											);
										}
									}}
								/>
								<Input
									title="Current Offset"
									type="number"
									value={cell.parameters.currentOffset ?? 0}
									disabled
									className="h-[30px] w-[80px]"
								/>
								<Button
									variant="outline"
									size="sm"
									onClick={() =>
										dispatch("parameters.currentOffset", 0)
									}
									disabled={cell.isLoading}
								>
									Reset
								</Button>
							</>
						)}
					</div>
				)}
				{isQueryImportModalOpen && (
					<QueryImportFormModal
						setIsQueryImportModalOpen={setIsQueryImportModalOpen}
						query={cell.query}
						cell={cell}
						editMode={true}
					/>
				)}
			</div>
		);
	},
);
