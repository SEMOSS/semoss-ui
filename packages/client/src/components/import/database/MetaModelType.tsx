import { ArrowCircleDown, Create } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import type React from "react";
import { useMemo, useState } from "react";
import {
	Button,
	Chip,
	IconButton,
	Stack,
	styled,
	Table,
	Typography,
} from "@semoss/ui";
import { Metamodel } from "@/components/metamodel";
import { Section } from "@/components/ui";

const StyledPage = styled("div")(() => ({
	position: "relative",
	zIndex: "0",
}));

const StyledMetamodelContainer = styled("section")(({ theme }) => ({
	height: "55vh",
	width: "100%",
	borderWidth: "1px",
	borderStyle: "solid",
	borderRadius: theme.shape.borderRadius,
}));

const StyledTableContainer = styled(Table.Container)(() => ({
	height: "396px",
}));

interface ParsedResult {
  positions: Record<string, { left: number; top: number }>;
  relation: { relName: string; fromTable: string; toTable: string }[];
  nodeProp: Record<string, string[]>;
  dataTypes?: Record<string, string>;
  additionalDataTypes?: Record<string, string>;
  
}
type Property = {
  id: string;
  name: string;
  type: string;
};

interface MetaModelTypeProps {
	parsedData: ParsedResult[];
	onImport: () => void;
	onCancel: () => void;
}

export const MetaModelType = observer(
	({ parsedData, onImport, onCancel }: MetaModelTypeProps) => {
		const parsed = parsedData[0];
		const [selectedNode, setSelectedNode] =
			useState<React.ComponentProps<typeof Metamodel>["selectedNode"]>(
				null,
			);
		const [columnPage, setColumnPage] = useState<number>(0);
		const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

		const nodes = useMemo(() => {
			if (!parsed?.positions) return [];

			return Object.keys(parsed.positions).map((nodeName) => {
				const position = parsed.positions[nodeName];
				const isIndexNode = nodeName.toLowerCase() === "index";
				const properties = isIndexNode
					? parsed.nodeProp?.[nodeName] || []
					: [nodeName];
				return {
					id: nodeName,
					type: "metamodel",
					data: {
						name: nodeName.replace(/_/g, " "),
						properties: properties.map((prop: string) => ({
							id: `${nodeName}__${prop}`,
							name: prop.replace(/_/g, " "),
							type:
								parsed.dataTypes?.[prop] ||
								parsed.additionalDataTypes?.[prop] ||
								"",
						})),
					},
					position: {
						x: position.left,
						y: position.top,
					},
				};
			});
		}, [parsed]);

		const edges = useMemo(() => {
			if (!parsed?.relation) return [];
			return parsed.relation.map((rel) => ({
				id: rel.relName,
				type: "floating",
				source: rel.fromTable,
				target: rel.toTable,
			}));
		}, [parsed]);

		const columnRows = useMemo(() => {
			if (!selectedNode?.data?.properties?.length) return [];
			return selectedNode.data.properties.slice(
				columnPage * columnVisibleRows,
				(columnPage + 1) * columnVisibleRows,
			);
		}, [selectedNode, columnPage, columnVisibleRows]);

		const description = selectedNode?.id || "";
		const logicalNames =
			selectedNode?.data?.properties?.map((p: { name: string }): string => p.name) || [];

		return (
			<StyledPage>
				<Section>
					<Section.Header
						actions={
							<Stack direction="row" spacing={1}>
								<Button
									startIcon={<ArrowCircleDown />}
									variant="outlined"
									onClick={onImport}
								>
									Import Metamodel
								</Button>
								<Button
									variant="outlined"
									color="secondary"
									onClick={onCancel}
								>
									Cancel
								</Button>
							</Stack>
						}
					>
						Metamodel
					</Section.Header>

					<Stack spacing={2}>
						<StyledMetamodelContainer>
							<Metamodel
								nodes={nodes}
								edges={edges}
								selectedNode={selectedNode}
								onSelectNode={(n) => setSelectedNode(n)}
								isInteractive={true}
							/>
						</StyledMetamodelContainer>
					</Stack>
				</Section>

				{selectedNode && (
					<>
						<Section>
							<Section.Header>Description</Section.Header>
							<Typography variant="body2">
								{description}
							</Typography>
						</Section>

						<Section>
							<Section.Header>Logical Names</Section.Header>
							<Stack direction="row" spacing={1} flexWrap="wrap">
								{logicalNames.map((logicalName) => (
									<Chip
										key={logicalName}
										label={logicalName}
										color="primary"
										size="small"
									/>
								))}
							</Stack>
						</Section>

						<Section>
							<Section.Header>Columns</Section.Header>
							<StyledTableContainer>
								<Table stickyHeader>
									<Table.Head>
										<Table.Row>
											<Table.Cell>&nbsp;</Table.Cell>
											<Table.Cell>Name</Table.Cell>
											<Table.Cell>Type</Table.Cell>
										</Table.Row>
									</Table.Head>
									<Table.Body>
										{columnRows.map(
											(property: Property, idx: number) => (
												<Table.Row key={property.id}>
													<Table.Cell>
														<IconButton disabled>
															<Create />
														</IconButton>
													</Table.Cell>
													<Table.Cell>
														{property.name}
													</Table.Cell>
													<Table.Cell>
														{property.type}
													</Table.Cell>
												</Table.Row>
											),
										)}
									</Table.Body>
									<Table.Footer>
										<Table.Row>
											<Table.Pagination
												page={columnPage}
												rowsPerPage={columnVisibleRows}
												count={
													selectedNode.data.properties
														.length
												}
												rowsPerPageOptions={[5, 10, 25]}
												onPageChange={(e, newPage) =>
													setColumnPage(newPage)
												}
												onRowsPerPageChange={(e) => {
													setColumnVisibleRows(
														Number(e.target.value),
													);
													setColumnPage(0);
												}}
											/>
										</Table.Row>
									</Table.Footer>
								</Table>
							</StyledTableContainer>
						</Section>
					</>
				)}
			</StyledPage>
		);
	},
);