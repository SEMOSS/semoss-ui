// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import {
	ArrowLeftFromLine,
	ArrowRightFromLine,
	CalendarDays,
	FilePenLine,
	Maximize2,
	Merge,
	Pencil,
} from "lucide-react";
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
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useBlocks } from "../../../hooks";
import {
	ActionMessages,
	type CellComponent,
	type CellDef,
} from "../../../store";
import { DataImportFormModal } from "../../shared/DataImportFormModal";

const EDITOR_LINE_HEIGHT = 19;
const EDITOR_MAX_HEIGHT = 500;

const JOIN_ICONS = {
	inner: <Merge className="size-4" />,
	"right.outer": <ArrowRightFromLine className="size-4" />,
	"left.outer": <ArrowLeftFromLine className="size-4" />,
	outer: <Merge className="size-4" />,
};

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
		enableBatching?: boolean;
		batchSize?: number;
		currentOffset?: number;
	};
}

export const DataImportCell: CellComponent<DataImportCellDef> = observer(
	(props) => {
		// biome-ignore lint/suspicious/noExplicitAny: external API type
		const editorRef = useRef<any>(null);
		const [showStyledView, setShowStyledView] = useState(true);
		const { cell, isExpanded } = props;
		const { state } = useBlocks();

		const [isDataImportModalOpen, setIsDataImportModalOpen] =
			useState(false);

		const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
			loading: true,
			display: {} as Record<string, string>,
			ids: [] as string[],
		});
		const [dataLimit, setDataLimit] = useState(
			cell.parameters.dataLimit || null,
		);

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
				display: dbDisplay,
				ids: dbIds,
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
					<div className="flex flex-col gap-1">
						<div className="flex flex-row items-center justify-between">
							<Select
								value={cell.parameters.databaseId}
								disabled={true}
								key={`database-${cell.parameters.databaseId}`}
							>
								<SelectTrigger className="h-[30px] w-[200px]">
									<SelectValue placeholder="Select Database" />
								</SelectTrigger>
								<SelectContent>
									{cfgLibraryDatabases.ids.map(
										(databaseId, i) => (
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
							<Button
								variant="ghost"
								onClick={() => setIsDataImportModalOpen(true)}
								key={`cell-edit-data-import-${cell.id}`}
							>
								<Pencil className="mr-1 size-4" />
								Edit
							</Button>
						</div>
					</div>
				)}

				{showStyledView ? (
					<>
						<div className="mb-0 flex items-center pb-0">
							{cell.parameters.tableNames?.map((tableName) => (
								<Tooltip key={`table-key-${tableName}`}>
									<TooltipTrigger asChild>
										<div className="mt-0 mr-4 inline-flex w-fit cursor-default items-center rounded-[10px] bg-[#F1E9FB] px-[17.5px] py-[7.5px] font-normal text-xs">
											<CalendarDays
												className="-ml-0.5 mr-1.5 size-4 text-[#95909C]"
												style={{ strokeWidth: 0.025 }}
											/>
											{tableName}
										</div>
									</TooltipTrigger>
									<TooltipContent>
										{tableName} Table
									</TooltipContent>
								</Tooltip>
							))}
						</div>

						{isExpanded &&
							cell.parameters.joins &&
							cell.parameters.joins.map((join) => (
								<div
									className="block"
									key={`column-${join.leftTable}-${join.joinType}`}
								>
									<div className="flex items-center">
										<div className="flex items-center">
											<Tooltip>
												<TooltipTrigger asChild>
													<div className="cursor-default rounded-xl bg-primary/10 px-3 font-medium text-black text-xs">
														{join.leftTable}
													</div>
												</TooltipTrigger>
												<TooltipContent>
													Left Join Table
												</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<Button
														variant="ghost"
														size="icon-sm"
														className="mx-[7.5px]"
													>
														{
															JOIN_ICONS[
																join.joinType as keyof typeof JOIN_ICONS
															]
														}
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													{join.joinType} join
												</TooltipContent>
											</Tooltip>

											<Tooltip>
												<TooltipTrigger asChild>
													<div className="cursor-default rounded-xl bg-[#DEF4F3] px-3 font-medium text-black text-xs">
														{join.rightTable}
													</div>
												</TooltipTrigger>
												<TooltipContent>
													Right Join Table
												</TooltipContent>
											</Tooltip>

											<span className="mx-3 cursor-default">
												ON
											</span>

											<Tooltip>
												<TooltipTrigger asChild>
													<div className="cursor-default rounded-xl bg-primary/10 px-3 font-medium text-black text-xs">
														{join.leftKey}
													</div>
												</TooltipTrigger>
												<TooltipContent>
													Left Join Key
												</TooltipContent>
											</Tooltip>

											<span className="mx-3 cursor-default">
												=
											</span>

											<Tooltip>
												<TooltipTrigger asChild>
													<div className="cursor-default rounded-xl bg-[#DEF4F3] px-3 font-medium text-black text-xs">
														{join.rightKey}
													</div>
												</TooltipTrigger>
												<TooltipContent>
													Right Join Key
												</TooltipContent>
											</Tooltip>
										</div>
									</div>
								</div>
							))}
					</>
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
									(cell.parameters.enableBatching
										? ` | Offset ( ${cell.parameters.currentOffset ?? 0} ) | Limit ( ${cell.parameters.batchSize ?? 100} ) | Import ( frame = [ CreateFrame ( frameType = [ "${cell.parameters.frameType}" ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] ) ; Frame ( frame = [ "${cell.parameters.frameVariableName}" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`
										: ` | Import ( frame = [ CreateFrame ( frameType = [ "${cell.parameters.frameType}" ] , override = [ true ] ) .as ( [ "${cell.parameters.frameVariableName}" ] ) ] ) ; Frame ( frame = [ "${cell.parameters.frameVariableName}" ] ) | QueryAll ( ) | Limit ( 20 ) | CollectAll ( ) ;`)
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
					<div className="flex flex-row flex-nowrap items-center justify-end gap-2">
						<Input
							type="number"
							placeholder="Data Limit"
							value={dataLimit ?? ""}
							onChange={handleDataLimitUpdate}
							disabled={cell.parameters.enableBatching ?? false}
							className="h-[30px] w-[100px]"
							key="data-limit-number"
						/>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowStyledView(!showStyledView)}
							key="show-hide-pixel-button"
						>
							{showStyledView ? "Show" : "Hide"} Pixel
						</Button>

						<Select
							disabled={cell.isLoading}
							value={cell.parameters.frameType}
							onValueChange={(val) =>
								dispatch("parameters.frameType", val)
							}
						>
							<SelectTrigger className="h-[30px] w-[140px]">
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
							<FilePenLine className="absolute left-2 size-4 text-muted-foreground" />
							<Input
								title="Set Frame Variable Name"
								value={cell.parameters.frameVariableName}
								key={`frame-variable-name-${cell.id}`}
								disabled={cell.isLoading}
								className="h-[30px] w-[200px] pl-7"
								onChange={(e) =>
									dispatch(
										"parameters.frameVariableName",
										e.target.value,
									)
								}
							/>
						</div>

						<Tooltip>
							<TooltipTrigger asChild>
								{/* biome-ignore lint/a11y/noLabelWithoutControl: label wraps its input */}
								<label className="flex cursor-pointer items-center gap-1">
									<Checkbox
										checked={
											cell.parameters.enableBatching ??
											false
										}
										disabled={cell.isLoading}
										onCheckedChange={(checked: boolean) => {
											dispatch(
												"parameters.enableBatching",
												checked,
											);
											dispatch(
												"parameters.currentOffset",
												0,
											);
											if (checked) {
												dispatch(
													"parameters.batchSize",
													100,
												);
											}
										}}
									/>
									{!cell.parameters.enableBatching && (
										<span className="text-muted-foreground text-sm">
											Enable Batching
										</span>
									)}
								</label>
							</TooltipTrigger>
							<TooltipContent>
								{cell.parameters.enableBatching
									? "Disable Batching"
									: "Enable Batching"}
							</TooltipContent>
						</Tooltip>

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
