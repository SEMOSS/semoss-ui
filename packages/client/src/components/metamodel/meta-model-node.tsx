/** biome-ignore-all lint/a11y/noStaticElementInteractions: React Flow node containers manage pointer events at the graph level */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: React Flow node containers are not keyboard-focusable interactive controls */
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import {
	CalendarDays,
	Clock3,
	Edit,
	Hash,
	Key,
	type LucideIcon,
	Pencil,
	Sigma,
	Table2Icon,
	ToggleLeft,
	Type as TypeIcon,
} from "lucide-react";
import React from "react";
import { Button, Card, CardContent, cn, P } from "@semoss/ui/next";
import { useMetamodel } from "@/hooks";

type MetamodelNodeProps = NodeProps<
	Node<{
		name: string;
		isEditable?: boolean;
		openEditForColumn?: (payload: {
			nodeId: string;
			columnId: string;
			name: string;
			type: string;
			rawType?: string;
			description?: string;
			logicalNames?: string[];
		}) => void;
		openEditTable?: (payload: {
			nodeId: string;
			name: string;
			description?: string;
		}) => void;
		openViewColumnMetadata?: (payload: {
			nodeId: string;
			tableName: string;
			columnId: string;
			name: string;
			type: string;
			physicalType?: string;
			description?: string;
			logicalNames?: string[];
		}) => void;
		properties: {
			id: string;
			name: string;
			type: string;
			physicalType?: string;
			isPrimary?: boolean;
			isForeign?: boolean;
			fkTarget?: string | { table: string; column: string } | null;
			logicalNames?: string[];
			description?: string;
			label?: string;
		}[];
		isInteractive?: boolean;
		setOpenDeleteConfirmationModal?: React.Dispatch<
			React.SetStateAction<boolean>
		>;
		setDataToDelete?: React.Dispatch<
			React.SetStateAction<{
				structureId: string;
				structureName: string;
				structureType: string;
			}>
		>;
		setOpenEditColumnModal?: React.Dispatch<React.SetStateAction<boolean>>;
	}>
>;

const normalizeSearchValue = (value: string) =>
	value.toLowerCase().replace(/[\s_]+/g, "");

const toDisplayName = (value: string) =>
	value.toLowerCase().replaceAll(" ", "_");

const toSearchToken = (value: string) =>
	value.trim().toLowerCase().replaceAll(" ", "_");

type SupportedDataType =
	| "BOOLEAN"
	| "INT"
	| "DOUBLE"
	| "STRING"
	| "DATE"
	| "TIMESTAMP";

const DATA_TYPE_ICON_BY_TYPE: Record<SupportedDataType, LucideIcon> = {
	BOOLEAN: ToggleLeft,
	INT: Hash,
	DOUBLE: Sigma,
	STRING: TypeIcon,
	DATE: CalendarDays,
	TIMESTAMP: Clock3,
};

const normalizeSupportedDataType = (
	value?: string,
): SupportedDataType | null => {
	if (!value) {
		return null;
	}

	switch (value.toUpperCase()) {
		case "BOOLEAN":
		case "BOOL":
			return "BOOLEAN";
		case "INT":
		case "INTEGER":
		case "BIGINT":
		case "SMALLINT":
			return "INT";
		case "DOUBLE":
		case "FLOAT":
		case "NUMERIC":
		case "DECIMAL":
			return "DOUBLE";
		case "STRING":
		case "VARCHAR":
		case "CHAR":
		case "TEXT":
			return "STRING";
		case "DATE":
			return "DATE";
		case "TIMESTAMP":
		case "DATETIME":
			return "TIMESTAMP";
		default:
			return null;
	}
};

const renderHighlightedLabel = (
	value: string,
	searchToken: string,
	normalizedSearchTerm: string,
) => {
	const displayValue = toDisplayName(value);
	if (!searchToken) {
		return displayValue;
	}

	const matchIndex = displayValue.indexOf(searchToken);
	if (matchIndex >= 0) {
		const before = displayValue.slice(0, matchIndex);
		const match = displayValue.slice(
			matchIndex,
			matchIndex + searchToken.length,
		);
		const after = displayValue.slice(matchIndex + searchToken.length);

		return (
			<>
				{before}
				<span className="rounded bg-primary/20 text-foreground">
					{match}
				</span>
				{after}
			</>
		);
	}

	if (
		normalizedSearchTerm.length > 0 &&
		normalizeSearchValue(displayValue).includes(normalizedSearchTerm)
	) {
		return (
			<span className="rounded bg-primary/20 text-foreground">
				{displayValue}
			</span>
		);
	}

	return displayValue;
};

const _MetamodelNode = (props: MetamodelNodeProps) => {
	const { id, data } = props;
	const { selectedNodeId, onSelectNodeId, searchTerm = "" } = useMetamodel();

	const normalizedSearchTerm = normalizeSearchValue(searchTerm.trim());
	const searchToken = toSearchToken(searchTerm);
	const isTableMatch =
		normalizedSearchTerm.length > 0 &&
		normalizeSearchValue(data.name).includes(normalizedSearchTerm);

	const handleEditColumn = (e: React.MouseEvent, col) => {
		e.stopPropagation();
		e.preventDefault();
		data?.openEditForColumn?.({
			nodeId: id,
			columnId: col?.id,
			name: col?.name,
			type: col?.type,
			rawType: col?.rawType,
			description: col?.description,
			logicalNames: col?.logicalNames,
		});
	};

	const handleViewColumnMetadata = (e: React.MouseEvent, col) => {
		e.stopPropagation();
		e.preventDefault();

		data?.openViewColumnMetadata?.({
			nodeId: id,
			tableName: data?.name,
			columnId: col?.id,
			name: col?.name,
			type: col?.type,
			physicalType: col?.physicalType,
			description: col?.description,
			logicalNames: col?.logicalNames,
		});
	};

	const isSelected = selectedNodeId === id;

	return (
		<Card
			className={cn(
				"inline-flex min-w-[280px] flex-col items-start gap-0 rounded-xl border bg-card p-0 shadow-md transition-shadow",
				isSelected &&
					"border-primary shadow-primary/25 shadow-xl ring-2 ring-primary/30",
			)}
			onClick={() => {
				onSelectNodeId(id);
			}}
			data-testid={`metamodel-node-${id}`}
		>
			<Handle
				type="target"
				position={Position.Left}
				className="hidden"
				data-testid={`metamodel-node-${id}-target-handle`}
			/>

			{/* Table Header */}
			<div
				className="flex w-full items-center justify-between gap-2 self-stretch rounded-t-xl border-border/60 border-b bg-muted/40 px-3 py-2 text-foreground"
				data-testid={`metamodel-node-${id}-header`}
			>
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-border">
						<Table2Icon className="size-4" />
					</div>

					<P
						className={cn(
							"flex-1 font-normal text-foreground text-sm",
							isTableMatch && "font-medium",
						)}
						data-testid={`metamodel-node-${id}-title`}
					>
						{renderHighlightedLabel(
							data.name,
							searchToken,
							normalizedSearchTerm,
						)}
					</P>
				</div>

				{data.isEditable && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 flex-shrink-0"
						onClick={(e) => {
							e.stopPropagation();
							data?.openEditTable?.({
								nodeId: id,
								name: data.name,
							});
						}}
						onMouseDown={(e) => e.stopPropagation()}
						title="Edit table"
						data-testid={`metamodel-node-${id}-edit-table-btn`}
					>
						<Edit className="size-4" />
					</Button>
				)}
			</div>

			{/* Table Content */}
			<CardContent className="w-full p-0">
				{data.properties?.map((p, index) => {
					const isColumnMatch =
						normalizedSearchTerm.length > 0 &&
						normalizeSearchValue(p.name).includes(
							normalizedSearchTerm,
						);
					const normalizedType = normalizeSupportedDataType(p.type);
					const DataTypeIcon = normalizedType
						? DATA_TYPE_ICON_BY_TYPE[normalizedType]
						: null;

					return (
						<div key={p.id}>
							<div
								className="flex items-center justify-between gap-2 px-2 py-2"
								onMouseDown={(e) => e.stopPropagation()}
								onClick={(e) => e.stopPropagation()}
								data-testid={`metamodel-node-${id}-property-${p.id}`}
							>
								{/* Key Icon - Fixed width */}
								<div className="flex w-6 flex-shrink-0 items-center justify-center">
									{data.isEditable &&
										(p.isPrimary ? (
											<Key
												className="size-5 text-primary"
												data-testid={`metamodel-node-${id}-property-${p.id}-primary-key`}
											/>
										) : p.isForeign ? (
											<P
												className="font-bold text-foreground text-xs"
												data-testid={`metamodel-node-${id}-property-${p.id}-foreign-key`}
											>
												FK
											</P>
										) : null)}
								</div>

								{/* Column Name and FK Target */}
								<div className="flex min-w-0 flex-1 flex-col gap-0.5">
									<P
										className={cn(
											"truncate text-foreground text-sm",
											isColumnMatch && "font-medium",
										)}
										data-testid={`metamodel-node-${id}-property-${p.id}-name`}
									>
										{renderHighlightedLabel(
											p.name,
											searchToken,
											normalizedSearchTerm,
										)}
									</P>
									{p.isForeign && p.fkTarget && (
										<P
											className="truncate text-muted-foreground text-xs"
											data-testid={`metamodel-node-${id}-property-${p.id}-fk-target`}
										>
											{typeof p.fkTarget === "string"
												? p.fkTarget
												: `${p.fkTarget.table}.${p.fkTarget.column}`}
										</P>
									)}
								</div>

								{/* Column Type - Fixed width */}
								<div
									className="flex w-8 flex-shrink-0 items-center justify-end"
									data-testid={`metamodel-node-${id}-property-${p.id}-type`}
									title={normalizedType ?? undefined}
								>
									{DataTypeIcon ? (
										<DataTypeIcon className="size-4 text-muted-foreground" />
									) : null}
								</div>

								{data.openViewColumnMetadata ? (
									<div className="flex w-7 flex-shrink-0 items-center justify-center">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onMouseDown={(e) =>
												e.stopPropagation()
											}
											onClick={(e) =>
												handleViewColumnMetadata(e, p)
											}
											title="View column metadata"
											data-testid={`metamodel-node-${id}-property-${p.id}-metadata-btn`}
										>
											<Pencil className="size-3.5" />
										</Button>
									</div>
								) : null}

								{/* Edit Button - Fixed width */}
								{data.isEditable && (
									<div className="flex w-7 flex-shrink-0 items-center justify-center">
										<Button
											variant="ghost"
											size="icon"
											className="h-6 w-6"
											onMouseDown={(e) =>
												e.stopPropagation()
											}
											onClick={(e) =>
												handleEditColumn(e, p)
											}
											title="Edit column"
											data-testid={`metamodel-node-${id}-property-${p.id}-edit-btn`}
										>
											<Edit className="size-3.5" />
										</Button>
									</div>
								)}
							</div>

							{/* Divider between rows (not after last item) */}
							{index < data.properties.length - 1 && (
								<div className="mx-2 h-px border-border/50 border-t" />
							)}
						</div>
					);
				})}

				<Handle
					type="source"
					position={Position.Right}
					className="hidden"
					data-testid={`metamodel-node-${id}-source-handle`}
				/>
			</CardContent>
		</Card>
	);
};

export const MetamodelNode = React.memo(_MetamodelNode);
