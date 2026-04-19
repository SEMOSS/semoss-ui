// biome-ignore-all lint/correctness/useExhaustiveDependencies: TODO
import { FilePenLine, Maximize2 } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import { runPixel, usePixel } from "@semoss/sdk/react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
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
import type { TransformationTargetCell } from "../shared";

interface Model {
	engine_name: string;
	engine_id: string;
}
interface MetaModel {
	edges: string[];
	physicalTypes: Record<string, string>;
	dataTypes: Record<string, string>;
	positions: Record<string, unknown>;
	nodes: unknown[];
	additionalDataTypes: Record<string, unknown>;
}

interface OutputQueryResponse {
	SAMPLE: string;
	Query: string;
	COLUMN_CHANGE: string;
	frameType?: string;
	frame?: string;
}

interface TextToSQLQueryResponse {
	output: OutputQueryResponse;
	operationType: string[];
}

export interface TextToSqlCellDef extends CellDef<"text-to-sql"> {
	widget: "text-to-sql";
	parameters: {
		databaseId: string;
		userQuery: string;
		frameVariableName: string;
		dataFrameId: string;
		dataFrameQuery: string;
		model: string;
		targetCell: TransformationTargetCell;
	};
}

const TextToSqlCell: CellComponent<TextToSqlCellDef> = observer((props) => {
	const { cell, isExpanded } = props;
	const { state } = useBlocks();
	const [cfgLibraryDatabases, setCfgLibraryDatabases] = useState({
		loading: true,
		ids: [],
		display: {},
	});
	const [modelDetail, setModelDetail] = useState<{
		loading: boolean;
		modelData: Model[];
		selectedModel: string;
	}>({
		loading: true,
		modelData: [],
		selectedModel: "",
	});

	const dbsList = usePixel<{ engine_id: string; engine_name: string }[]>(
		`MyEngines(engineTypes=['DATABASE']);`,
	);

	useEffect(() => {
		if (dbsList.status !== "SUCCESS") return;

		const dbIds = dbsList.data?.map((db) => db.engine_id);
		const dbDisplay = Object.fromEntries(
			dbsList.data?.map((db) => [db.engine_id, db.engine_name]),
		);

		setCfgLibraryDatabases({
			loading: false,
			ids: dbIds,
			display: dbDisplay,
		});
		if (!cell.parameters.databaseId && dbIds.length) {
			runStateDispatch([
				{ path: "parameters.databaseId", value: dbIds[0] },
			]);
		}
		runFrameCreationQuery({
			dbId: dbIds[0],
			dbName:
				dbDisplay?.[cell.parameters.databaseId] || dbDisplay[dbIds[0]],
		});
		getMyModels();
	}, [dbsList.status, dbsList.data, cell.parameters.frameVariableName]);

	const getMyModels = async () => {
		const myModels = await state.runSideEffect(
			`MyEngines(engineTypes=['MODEL']);`,
		);
		const modelsData = myModels.pixelReturn?.[0].output;
		setModelDetail({
			loading: false,
			modelData: modelsData as Model[],
			selectedModel: modelsData?.[0]?.engine_id,
		});
	};

	const runFrameCreationQuery = async (databaseDetails) => {
		if (!databaseDetails.dbId || !databaseDetails.dbName) return;
		removeDynamicFrameAndQuery();
		let columnNames: string[] = [],
			columnAlias: string[] = [];
		try {
			const res = await runPixel(
				`META|GetDatabaseTableStructure(database=["${databaseDetails.dbId}"]);
             META|GetDatabaseMetamodel(database=["${databaseDetails.dbId}"], options=["dataTypes","positions"])`,
			);
			const output = res.pixelReturn[0]?.output || [];
			columnAlias = (output as unknown[]).map((item) => item[4]);

			const metaModelOutput = res.pixelReturn[1]?.output;
			if (
				(metaModelOutput as MetaModel).dataTypes &&
				typeof (metaModelOutput as MetaModel).dataTypes === "object"
			) {
				columnNames = Object.keys(
					(metaModelOutput as MetaModel).dataTypes,
				);
			}
			const gridQuery =
				columnNames.length > 0
					? sanitizeQuery(
							`Select (${columnNames.join(",")}) .as ([${columnAlias.join(",")}])`,
						)
					: `Query("${sanitizeQuery(`SELECT * FROM ${databaseDetails.dbName}`)}")`;

			const insightId = state.insightId;
			const query = `Database(database=["${databaseDetails.dbId}"]) | ${gridQuery} | Import(frame=[CreateFrame(frameType=[GRID], override=[true]).as(["${cell.parameters.frameVariableName}"])])`;
			await runPixel(query, insightId);
		} catch (error) {
			console.error("Error in runFrameCreationQuery:", error);
		}
	};

	useEffect(() => {
		if (!cell.isSuccessful) return;

		const output =
			((cell.output as TextToSQLQueryResponse)
				?.output as OutputQueryResponse) || {};
		if (
			!output ||
			typeof output !== "object" ||
			!Object.hasOwn(output, "Query")
		)
			return;

		if ((output as OutputQueryResponse).frame) {
			runStateDispatch([
				{
					path: "parameters.dataFrameId",
					value: (output as OutputQueryResponse).frame,
				},
			]);
		}

		if (typeof (output as OutputQueryResponse).Query === "string") {
			runStateDispatch([
				{
					path: "parameters.dataFrameQuery",
					value: sanitizeQuery((output as OutputQueryResponse).Query),
				},
			]);
		}
	}, [cell.isExecuted, cell.isLoading, cell.isSuccessful]);

	function removeDynamicFrameAndQuery() {
		runStateDispatch([
			{ path: "parameters.dataFrameId", value: "" },
			{ path: "parameters.dataFrameQuery", value: "" },
		]);
	}

	const runStateDispatch = (
		payloadProps: {
			queryId?: string;
			cellId?: string;
			path: string;
			value: unknown;
		}[],
	) => {
		payloadProps.forEach(
			({ queryId = cell.query.id, cellId = cell.id, path, value }) => {
				state.dispatch({
					message: ActionMessages.UPDATE_CELL,
					payload: { queryId, cellId, path, value },
				});
			},
		);
	};

	function sanitizeQuery(query: string): string {
		return query
			.replace(/<script.*?>.*?<\/script>/gi, "")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, '\\"');
	}

	const updateUserInputChange = (e) => {
		let paramsToBeUpdated = [];
		if (
			cell.parameters.dataFrameId !== "" &&
			cell.parameters.dataFrameQuery !== ""
		) {
			paramsToBeUpdated = [
				{
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.dataFrameId",
					value: "",
				},
				{
					queryId: cell.query.id,
					cellId: cell.id,
					path: "parameters.dataFrameQuery",
					value: "",
				},
			];
		}
		paramsToBeUpdated.push({
			queryId: cell.query.id,
			cellId: cell.id,
			path: "parameters.userQuery",
			value: e.target.value,
		});
		runStateDispatch(paramsToBeUpdated);
	};

	return (
		<div className="relative flex w-full flex-col gap-2">
			<div className="flex flex-col gap-1">
				<div className="flex flex-row justify-between">
					<Select
						disabled={cell.isLoading}
						value={cell.parameters.databaseId}
						onValueChange={(value) =>
							runStateDispatch([
								{ path: "parameters.databaseId", value },
							])
						}
					>
						<SelectTrigger
							className="h-[40px] w-[200px] px-3"
							data-testid={`user-databaseid-${cell.id}`}
						>
							<SelectValue placeholder="Select Database" />
						</SelectTrigger>
						<SelectContent>
							{cfgLibraryDatabases.ids.map((databaseId, i) => (
								<SelectItem
									key={`${i}-${cell.id}-${databaseId}`}
									value={databaseId}
									data-testid={`user-database-${cell.id}-${i}`}
								>
									{cfgLibraryDatabases.display[databaseId] ??
										""}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>

			{isExpanded && (
				<div className="flex flex-row gap-2 bg-primary/10">
					<div className="flex items-center justify-start gap-1">
						1
					</div>
					<div className="flex w-full flex-col gap-2">
						<div className="flex items-center justify-start gap-1">
							<span className="text-muted-foreground text-sm">
								Type your query in natural language
							</span>
							<div className="h-5 w-5">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 20 20"
									fill="none"
								>
									<title>Natural language query icon</title>
									<path
										d="M2.08594 4.58594C2.08594 5.2776 2.64427 5.83594 3.33594 5.83594H6.2526V14.5859C6.2526 15.2776 6.81094 15.8359 7.5026 15.8359C8.19427 15.8359 8.7526 15.2776 8.7526 14.5859V5.83594H11.6693C12.3609 5.83594 12.9193 5.2776 12.9193 4.58594C12.9193 3.89427 12.3609 3.33594 11.6693 3.33594H3.33594C2.64427 3.33594 2.08594 3.89427 2.08594 4.58594ZM16.6693 7.5026H11.6693C10.9776 7.5026 10.4193 8.06094 10.4193 8.7526C10.4193 9.44427 10.9776 10.0026 11.6693 10.0026H12.9193V14.5859C12.9193 15.2776 13.4776 15.8359 14.1693 15.8359C14.8609 15.8359 15.4193 15.2776 15.4193 14.5859V10.0026H16.6693C17.3609 10.0026 17.9193 9.44427 17.9193 8.7526C17.9193 8.06094 17.3609 7.5026 16.6693 7.5026Z"
										fill="#0000008A"
										fillOpacity="0.54"
									/>
								</svg>
							</div>
						</div>
						<textarea
							className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							placeholder="Type your question or request for data"
							value={cell.parameters.userQuery}
							disabled={cell.isLoading}
							data-testid={`user-query-${cell.id}`}
							rows={4}
							onChange={updateUserInputChange}
						/>
					</div>
				</div>
			)}

			{isExpanded && (
				<div className="flex flex-row items-center justify-start gap-4 px-4">
					<div className="relative flex items-center">
						<FilePenLine className="absolute left-2 size-4 text-muted-foreground" />
						<Input
							title="Set Frame Variable Name"
							value={cell.parameters.frameVariableName}
							disabled={cell.isLoading}
							className="h-[40px] pl-7"
							data-testid={`frame-variable-${cell.id}`}
							onChange={(e) =>
								runStateDispatch([
									{
										path: "parameters.frameVariableName",
										value: e.target.value,
									},
								])
							}
						/>
					</div>
					<Select
						disabled={cell.isLoading}
						value={cell.parameters.model}
						onValueChange={(value) =>
							runStateDispatch([
								{ path: "parameters.model", value },
							])
						}
					>
						<SelectTrigger
							className="h-[40px] min-w-[200px] max-w-[300px] px-3"
							data-testid={`model-user-${cell.id}`}
						>
							<Maximize2 className="mr-1 size-4 shrink-0" />
							<SelectValue placeholder="Select Model" />
						</SelectTrigger>
						<SelectContent>
							{modelDetail.modelData.length > 0 &&
								modelDetail.modelData.map((model, key) => (
									<SelectItem
										key={
											model.engine_id?.split("-")
												?.length > 0
												? model.engine_id
														.split("-")
														.reverse()
														.slice(0, 2)
														.join("-") + key
												: String(key)
										}
										value={model.engine_id}
										data-testid={`model-user-item-${cell.id}-${key}`}
									>
										{model.engine_name}
									</SelectItem>
								))}
						</SelectContent>
					</Select>
				</div>
			)}

			{isExpanded && cell.parameters.dataFrameQuery && (
				<div>
					<Accordion type="single" collapsible>
						<AccordionItem value="generated-sql">
							<AccordionTrigger
								data-testid={`generated-sql-${cell.id}`}
							>
								<span className="text-sm">Generated SQL</span>
							</AccordionTrigger>
							<AccordionContent>
								{cell.parameters.dataFrameQuery}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			)}
		</div>
	);
});

export default TextToSqlCell;
