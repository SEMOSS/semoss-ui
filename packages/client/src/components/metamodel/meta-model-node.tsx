/** biome-ignore-all lint/a11y/noStaticElementInteractions: <explanation> */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: <explanation> */
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import { Edit, Key, Table2Icon } from "lucide-react";
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
			description?: string;
			logicalNames?: string[];
		}) => void;
		openEditTable?: (payload: {
			nodeId: string;
			name: string;
			description?: string;
		}) => void;
		properties: {
			id: string;
			name: string;
			type: string;
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

const _MetamodelNode = (props: MetamodelNodeProps) => {
	const { id, data } = props;
	const { selectedNodeId, onSelectNodeId } = useMetamodel();

	const handleEditColumn = (e: React.MouseEvent, col) => {
		e.stopPropagation();
		e.preventDefault();
		data?.openEditForColumn?.({
			nodeId: id,
			columnId: col?.id,
			name: col?.name,
			type: col?.type,
			description: col?.description,
			logicalNames: col?.logicalNames,
		});
	};

	const isSelected = selectedNodeId === id;

	return (
		<Card
			className={cn(
				"inline-flex min-w-[280px] flex-col items-start gap-0 rounded-xl border bg-card p-0 shadow-md transition-shadow",
				isSelected && "border-primary/30 shadow-primary/20 shadow-xl",
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
				className="flex w-full items-center justify-between gap-2 self-stretch rounded-t-xl bg-purple-50 px-3 py-2 text-foreground"
				data-testid={`metamodel-node-${id}-header`}
			>
				<div className="flex items-center gap-2">
					<div className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-border">
						<Table2Icon className="size-4" />
					</div>

					<P
						className="flex-1 font-normal text-foreground text-sm"
						data-testid={`metamodel-node-${id}-title`}
					>
						{data.name.toLowerCase().replaceAll(" ", "_")}
					</P>
				</div>

				{data.isEditable && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 flex-shrink-0"
						onClick={(e) => {
							e.stopPropagation();
							if (data?.openEditTable) {
								data.openEditTable({
									nodeId: id,
									name: data.name,
								});
							} else {
								console.warn(
									"openEditTable not injected for node",
									id,
								);
							}
						}}
						onMouseDown={(e) => e.stopPropagation()}
						title="Edit table"
						data-testid={`metamodel-node-${id}-edit-table-btn`}
					>
						<Edit className="size-4" />
					</Button>
				)}
			</div>

			{/* Divider */}
			<div className="h-px w-full border-border border-t" />

			{/* Table Content */}
			<CardContent className="w-full p-0">
				{data.properties?.map((p, index) => {
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
										className="truncate text-foreground text-sm"
										data-testid={`metamodel-node-${id}-property-${p.id}-name`}
									>
										{p.name
											.toLowerCase()
											.replaceAll(" ", "_")}
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
								<div className="flex w-16 flex-shrink-0 items-center justify-end">
									<P
										className="font-medium text-blue-500 text-xs"
										data-testid={`metamodel-node-${id}-property-${p.id}-type`}
									>
										{p.type ? p.type.toLowerCase() : ""}
									</P>
								</div>

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
