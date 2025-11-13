import { EditRounded, KeyRounded } from "@mui/icons-material";
import { Handle, type Node, type NodeProps, Position } from "@xyflow/react";
import React from "react";
import { Box, Card, IconButton, styled, Typography } from "@semoss/ui";
import { useMetamodel } from "@/hooks";

const TableIcon = () => {
	return (
		<svg
			width="30"
			height="30"
			viewBox="0 0 30 30"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
		>
			<title>Table</title>
			<rect
				x="0.5"
				y="0.5"
				width="29"
				height="29"
				rx="7.5"
				fill="white"
			/>
			<path
				d="M8 7H22C22.5304 7 23.0391 7.21071 23.4142 7.58579C23.7893 7.96086 24 8.46957 24 9V21C24 21.5304 23.7893 22.0391 23.4142 22.4142C23.0391 22.7893 22.5304 23 22 23H8C7.46957 23 6.96086 22.7893 6.58579 22.4142C6.21071 22.0391 6 21.5304 6 21V9C6 8.46957 6.21071 7.96086 6.58579 7.58579C6.96086 7.21071 7.46957 7 8 7ZM8 11V15H14V11H8ZM16 11V15H22V11H16ZM8 17V21H14V17H8ZM16 17V21H22V17H16Z"
				fill="#975FE4"
			/>
			<rect
				x="0.5"
				y="0.5"
				width="29"
				height="29"
				rx="7.5"
				stroke="#975FE4"
			/>
		</svg>
	);
};

const StyledMetamodelCard = styled(Card, {
	shouldForwardProp: (prop) => prop !== "isSelected",
})<{ isSelected: boolean }>(({ isSelected, theme }) => ({
	display: "inline-flex",
	flexDirection: "column",
	alignItems: "flex-start",
	borderRadius: "var(--border-radius-radius-large, 12px)",
	backgroundColor: theme.palette.background.paper,
	boxShadow: isSelected
		? `0px 5px 22px 0px ${theme.palette.primaryContrast["shadow"]}`
		: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
	border: isSelected
		? "1px solid var(--light-primary-shades-30-p, rgba(4, 113, 240, 0.30))"
		: "",
}));
const StyledMetamodelContent = styled(Card.Content)(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flexStart",
	margin: "0px",
}));

const StyledKeyIconContainer = styled(Box)(() => ({
	display: "flex",
	alignItems: "center",
	marginLeft: "3px",
}));

const StyledPrimaryKeyIcon = styled(KeyRounded)(() => ({
	width: "24px",
	height: "24px",
	justifyContent: "center",
	alignItems: "center",
	color: "rgba(4, 113, 240, 1)",
}));

const StyledTableCellRow = styled("div")(() => ({
	display: "flex",
	alignItems: "center",
	justifyContent: "space-between",
	background: "rgba(255, 255, 255, 0)",
}));
const StyledColumnNameCell = styled(Box)(() => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	padding: "12px 13px",
}));
const StyledColumnTypeCell = styled(Box)(({ theme }) => ({
	display: "flex",
	padding: "12px 16px",
	justifyContent: "flex-end",
	alignItems: "center",
	flex: "1 0 0",
	color: "rgba(34, 164, 255, 1)",
}));
const StyledTypeFont = styled(Typography)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
	color: "rgba(34, 164, 255, 1)",
}));
const StyledNameFont = styled(Typography)(({ theme }) => ({
	display: "flex",
	flexDirection: "column",
	alignItems: "flex-start",
}));
const StyledTableHeaderRow = styled(Box)(({ theme }) => ({
	display: "flex",
	padding: "16px",
	alignItems: "center",
	gap: "10px",
	alignSelf: "stretch",
	color: "rgba(0, 0, 0, 0.87)",
	backgroundColor: theme.palette.purple[50],
}));
const StyledIconContainer = styled(Box)(({ theme }) => ({
	display: "flex",
	width: "30px",
	height: "30px",
	flexDirection: "column",
	justifyContent: "center",
	alignItems: "center",
	gap: "10px",
	borderRadius: "8px",
	border: "1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))",
}));
const StyledDivider = styled(Box)(() => ({
	height: "1px",
	alignSelf: "stretch",
	border: "1px solid var(--light-other-divider, rgba(0, 0, 0, 0.10))",
}));

const StyledTypography = styled(Typography)(() => ({
	fontWeight: 700,
	color: "rgba(34,34,34,1)",
}));

const StyledCaption = styled(Typography)(() => ({
	color: "rgba(117,117,117,1)",
	marginTop: 4,
}));

const StyledHandle = styled(Handle)(() => ({
	display: "none",
}));

const StyledTitleCell = styled(Typography)(() => ({
	display: "flex",
	flexDirection: "column",
	justifyContent: "center",
	flex: "1 0 0",
	alignSelf: "stretch",
}));

const StyledBox = styled(Box)({
	display: "flex",
});

const StyledContainer = styled(Box)(() => ({
	width: 24,
	height: 24,
}));

const StyledHeader = styled(Box)({
	display: "flex",
	alignItems: "center",
	gap: 10,
});

const StyledDiv = styled(Box)({
	marginLeft: "auto",
	display: "flex",
	alignItems: "center",
});

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

	return (
		<StyledMetamodelCard
			isSelected={selectedNodeId === id}
			onClick={() => {
				onSelectNodeId(id);
			}}
		>
			<StyledHandle type="target" position={Position.Left} />

			<StyledTableHeaderRow>
				<StyledHeader>
					<StyledIconContainer>
						<TableIcon />
					</StyledIconContainer>

					<StyledTitleCell variant="body1">
						{data.name.toLowerCase().replaceAll(" ", "_")}
					</StyledTitleCell>
				</StyledHeader>

				{data.isEditable && (
					<StyledDiv>
						<IconButton
							size="small"
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
						>
							<EditRounded fontSize="small" />
						</IconButton>
					</StyledDiv>
				)}
			</StyledTableHeaderRow>

			<StyledDivider />

			<StyledMetamodelContent>
				{data.properties?.map((p) => {
					return (
						<StyledTableCellRow
							key={p.id}
							onMouseDown={(e) => e.stopPropagation()}
							onClick={(e) => e.stopPropagation()}
						>
							<StyledKeyIconContainer>
								{data.isEditable &&
									(p.isPrimary ? (
										<StyledPrimaryKeyIcon />
									) : p.isForeign ? (
										<StyledTypography variant="subtitle2">
											FK
										</StyledTypography>
									) : (
										<StyledContainer />
									))}
							</StyledKeyIconContainer>

							<StyledColumnNameCell>
								<StyledNameFont variant="body2">
									{p.name.toLowerCase().replaceAll(" ", "_")}
								</StyledNameFont>
								{p.isForeign && p.fkTarget && (
									<StyledCaption variant="caption">
										{typeof p.fkTarget === "string"
											? p.fkTarget
											: `${p.fkTarget.table}.${p.fkTarget.column}`}
									</StyledCaption>
								)}
							</StyledColumnNameCell>

							<StyledColumnTypeCell>
								<StyledTypeFont variant="body2">
									{p.type ? p.type.toLowerCase() : ""}
								</StyledTypeFont>
							</StyledColumnTypeCell>

							{data.isEditable && (
								<StyledBox>
									<IconButton
										size="small"
										onMouseDown={(e) => e.stopPropagation()}
										onClick={(e) => handleEditColumn(e, p)}
										title="Edit column"
									>
										<EditRounded fontSize="small" />
									</IconButton>
								</StyledBox>
							)}
						</StyledTableCellRow>
					);
				})}

				<StyledHandle type="source" position={Position.Right} />
			</StyledMetamodelContent>
		</StyledMetamodelCard>
	);
};

export const MetamodelNode = React.memo(_MetamodelNode);
