import { ArrowCircleDown, Create, Refresh } from "@mui/icons-material";
import { observer } from "mobx-react-lite";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Chip,
  IconButton,
  Menu,
  Modal,
  Select,
  Stack,
  styled,
  Table,
  TextField,
  Typography
} from "@semoss/ui";
import { Metamodel } from "@/components/metamodel";
import { Section } from "@/components/ui";
import { useEngine, usePixel, useRootStore } from "@/hooks";
import { SyncChangesModal } from "./SyncChangesModal";

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

export const EngineMetadataPage = observer(() => {
  const { active } = useEngine();
  const { monolithStore } = useRootStore();

  const [selectedNode, setSelectedNode] = useState(null);
  const [columnPage, setColumnPage] = useState<number>(0);
  const [columnVisibleRows, setColumnVisibleRows] = useState<number>(5);

  const [customNodes, setCustomNodes] = useState(null);
  const [customEdges, setCustomEdges] = useState(null);
  const [relationships, setRelationships] = useState(null);
  const [canSave, setCanSave] = useState(true);
  
  // State for edit description dialog
  const [editDescriptionDialog, setEditDescriptionDialog] = useState({
    open: false,
    columnId: "",
    columnName: "",
    tableName: "",
    currentDescription: "",
    newDescription: "",
  });

  const [llmEngines, setLlmEngines] = useState<Array<{ database_id: string; database_name: string }>>([]);
  const [selectedLlmEngine, setSelectedLlmEngine] = useState<string>("");
  const [dialogKey, setDialogKey] = useState<number>(0);

  const navigate = useNavigate();

  const getDatabaseMetamodel = usePixel<{
    dataTypes: Record<string, "INT" | "DOUBLE" | "STRING">;
    logicalNames: Record<string, string[]>;
    nodes: { propSet: string[]; conceptualName: string }[];
    edges: {
      sourceColumn?: string;
      targetColumn?: string;
      relation: string;
      source: string;
      target: string;
    }[];
    physicalTypes: Record<string, string>;
    positions: Record<
      string,
      {
        top: number;
        left: number;
      }
    >;
    descriptions: Record<string, string>;
    additionalDataTypes: Record<string, "INT" | "FLOAT" | "VARCHAR(2000)">;
  }>(
    `GetDatabaseMetamodel( database=["${active.id}"], options=["dataTypes","additionalDataTypes","logicalNames","descriptions","positions"]); `,
  );

  const reloadDescriptions = useCallback(
    async (node = selectedNode) => {
      if (getDatabaseMetamodel.status !== "SUCCESS" || !node) return;

      try {
        const updatedDescriptions = { ...getDatabaseMetamodel.data.descriptions };

        for (const property of node.data.properties) {
          const logicalNames = getDatabaseMetamodel.data.logicalNames?.[property.id] || [];
          const columnNameForPixel = logicalNames.length > 0 ? logicalNames[0] : property.name.replace(/\s+/g, "_");

          const tableName = node.data.name;
          const pixel = `GetTableDescriptions(database=["${active.id}"], concept="${tableName}")`;
          const response = await monolithStore.runQuery(pixel);
          const output = response.pixelReturn[0]?.output || {};

          let description = "";
          if (output["0"] && Object.keys(output).length === 1) {
            description = output["0"];
          } else if (Object.keys(output).length > 0) {
            description = output[columnNameForPixel] || "";
          }

          updatedDescriptions[property.id] = description;
        }

        getDatabaseMetamodel.update({
          ...getDatabaseMetamodel.data,
          descriptions: updatedDescriptions,
        });
      } catch (error) {
        console.error("Failed to reload descriptions:", error);
      }
    },
    [getDatabaseMetamodel, monolithStore, active.id]
  );
  
  // get the data if a table is selected
  const getData = usePixel<{
    data: {
      values: (string | number | boolean)[][];
      headers: string[];
    };
    headerInfo: {
      dataType: string;
      additionalDataType: string;
      alias: string;
      header: string;
      type: string;
      derived: boolean;
    }[];
    numCollected: number;
  }>(
    selectedNode && selectedNode.data.properties.length > 0
      ? `Database(database=["${
          active.id
        }"]) | Select(${selectedNode.data.properties
          .map((p) => p.id)
          .join(", ")}) | Collect(100);`
      : "",
    {
      data: {
        data: {
          values: [],
          headers: [],
        },
        headerInfo: [],
        numCollected: 0,
      },
    },
  );

  const defaultNodes = useMemo(() => {
    if (getDatabaseMetamodel.status !== "SUCCESS") return [];
    const { nodes = [], positions = {} } = getDatabaseMetamodel.data;
    return nodes.map((n) => ({
      id: n.conceptualName,
      type: "metamodel",
      data: {
        name: n.conceptualName.replace(/_/g, " "),
        properties: n.propSet.map((p) => ({
          id: `${n.conceptualName}__${p}`,
          name: p.replace(/_/g, " "),
          type: "",
        })),
      },
      position: positions[n.conceptualName]
        ? {
            x: positions[n.conceptualName].left,
            y: positions[n.conceptualName].top,
          }
        : { x: 0, y: 0 },
    }));
  }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

  const defaultEdges = useMemo(() => {
    if (getDatabaseMetamodel.status !== "SUCCESS") return [];
    return getDatabaseMetamodel.data.edges.map((e) => ({
      id: e.relation,
      type: "floating",
      source: e.source,
      target: e.target,
    }));
  }, [getDatabaseMetamodel.status, getDatabaseMetamodel.data]);

  useEffect(() => {
	if (selectedNode) {
		reloadDescriptions();
	}
}, [selectedNode]);

  useEffect(() => {
    const fetchLlmEngines = async () => {
      try {
        const pixel = `MyEngines(engineTypes=["MODEL"]);`;
        const response = await monolithStore.runQuery(pixel);
        const { output, operationType } = response.pixelReturn[0];

        if (operationType.indexOf("ERROR") > -1) {
          throw new Error(output as string);
        }
        if (Array.isArray(output)) {
          setLlmEngines(output);
        }
      } catch (error) {
        console.error("Failed to fetch LLM engines:", error);
      }
    };

    fetchLlmEngines();
  }, [monolithStore]);


  const [showSyncModal, setShowSyncModal] = useState(false);
  const [tabledata, setTabledata] = useState<string[]>([]);
  const [viewdata, setViewdata] = useState<string[]>([]);

  const refreshData = () => {
    const pixel = `ExternalUpdateJdbcTablesAndViews(database=["${active.id}"]);`;
    monolithStore.runQuery(pixel).then((response) => {
      const output = response.pixelReturn[0].output;
      setTabledata(output.tables ?? []);
      setViewdata(output.views ?? []);
      setShowSyncModal(true);
    });
  };

  const handleSyncApply = (
    selectedTables: string[],
    selectedViews: string[],
  ) => {
    const filters = JSON.stringify([...selectedTables, ...selectedViews]);
    const pixel = `ExternalUpdateJdbcSchema(database=["${active.id}"], filters=${filters});`;

    monolithStore.runQuery(pixel).then((response) => {
      const output = response.pixelReturn[0]?.output;

      if (!output) return;

      const newNodes = output.tables.map((table) => ({
        id: table.table,
        type: "metamodel",
        data: {
          name: table.table.replace(/_/g, " "),
          properties: table.columns.map((col, idx) => ({
            id: `${table.table}__${col}`,
            name: col.replace(/_/g, " "),
            type: table.type?.[idx] || "",
          })),
        },
        position: output.positions?.[table.table]
          ? {
              x: output.positions[table.table].left,
              y: output.positions[table.table].top,
            }
          : { x: 0, y: 0 },
      }));

      const newEdges = (output.relationships || []).map((rel, i) => ({
        id: `${rel.fromTable}-${rel.toTable}-${i}`,
        type: "floating",
        source: rel.fromTable,
        target: rel.toTable,
      }));

      setRelationships(output.relationships);
      setCustomNodes(newNodes);
      setCustomEdges(newEdges);
      setShowSyncModal(false);
      setCanSave(false);
    });
  };

  const columnRows = useMemo(() => {
    if (!selectedNode?.data?.properties?.length) return [];
    return selectedNode.data.properties.slice(
      columnPage * columnVisibleRows,
      (columnPage + 1) * columnVisibleRows,
    );
  }, [selectedNode, columnPage, columnVisibleRows]);

  const description = selectedNode?.id
    ? (getDatabaseMetamodel.data?.descriptions?.[selectedNode.id] ?? "")
    : "";

  const logical = selectedNode?.id
    ? (getDatabaseMetamodel.data?.logicalNames?.[selectedNode.id] ?? [])
    : [];

  const printMeta = () => {
    const pixel = `META|DatabaseMetadataToPdf(database=["${active.id}"]);`;
    monolithStore.runQuery(pixel).then((response) => {
      const output = response.pixelReturn[0].output;
      const insightId = response.insightId;
      monolithStore.download(insightId, output);
    });
  };

  const saveDatabase = async (data) => {
    const tables = {};
    const owlPositions = {};

    data.nodes.forEach((node) => {
      const tableInfo = node.data;
      const cols = node.data.properties;
      const firstCol = cols[0].name.replace(/ /g, "_");

      if (!tables[tableInfo.name + "." + firstCol]) {
        const columns = [];

        cols.forEach((col) => {
          columns.push(col.name.replace(/ /g, "_"));
        });

        tables[tableInfo.name + "." + firstCol] = columns;
      }

      if (!owlPositions[node.id]) {
        owlPositions[node.id] = {
          top: node.position.y,
          left: node.position.x,
        };
      }
    });

    const pixel = `RdbmsExternalUpload(database=["${active.id}"], metamodel=[${JSON.stringify({ relationships: relationships, tables: tables })}], existing=[true]); META|SaveOwlPositions(database=["${active.id}"], positionMap=[${JSON.stringify(owlPositions)}]); META|SyncDatabaseWithLocalMaster(database=["${active.id}"])`;

    const resp = await monolithStore.runQuery(pixel);
    const output = resp.pixelReturn[0].output,
      operationType = resp.pixelReturn[0].operationType;

    if (operationType.indexOf("ERROR") > -1) {
      console.warn("RDBMSExternalUpload Reactor bug");
    } else {
      navigate(`/engine/database/${output.database_id}/metamodel`);
      return;
    }
  };

  const onSubmit = () => {
    const payloadObj = {
      metamodel: {
        relation: [],
        nodeProp: {},
      },
      dataTypeMap: {},
      newHeaders: {},
      additionalDataTypes: {},
      descriptionMap: {},
      logicalNamesMap: {},
      position: [{}],
      nodes: customNodes,
    };

    for (const edge of customEdges) {
      const relName = `${edge.source}_${edge.target}`;
      payloadObj.metamodel.relation.push({
        fromTable: edge.source,
        toTable: edge.target,
        relName: relName,
      });
    }

    for (const node of customNodes) {
      for (const col of node.data.properties) {
        payloadObj.dataTypeMap[col.name] = col.type;
      }

      payloadObj.metamodel.nodeProp[node.data.name] = [];
    }

    saveDatabase(payloadObj);
  };

  const handleEditDescriptionOpen = async (columnId: string, columnName: string, tableName: string, currentDescription: string) => {
    const logicalNames = getDatabaseMetamodel.data?.logicalNames?.[columnId] || [];
    const columnNameForPixel = logicalNames.length > 0 
      ? logicalNames[0] 
      : columnName.replace(/\s+/g, "_");

    const pixel = `GetOwlDescriptions(database=["${active.id}"], concept="${tableName}", column="${columnNameForPixel}")`;
    try {
      const response = await monolithStore.runQuery(pixel);
      const description = response.pixelReturn[0]?.output?.[columnName] || currentDescription;
      
      setEditDescriptionDialog(prev => ({
        ...prev,
        open: true,
        columnId,
        columnName,
        tableName,
        currentDescription: description,
        newDescription: description,
      }));
      setDialogKey(prev => prev + 1);
    } catch (error) {
      console.error("Failed to retrieve description:", error);
      setEditDescriptionDialog(prev => ({
        ...prev,
        open: true,
        columnId,
        columnName,
        tableName,
        currentDescription,
        newDescription: currentDescription,
      }));
      setDialogKey(prev => prev + 1);
    }
  };

  const handleEditDescriptionClose = () => {
    setEditDescriptionDialog({
      open: false,
      columnId: "",
      columnName: "",
      tableName: "",
      currentDescription: "",
      newDescription: "",
    });
    setSelectedLlmEngine("");
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditDescriptionDialog(prev => ({
      ...prev,
      newDescription: e.target.value,
    }));
  };

	const handlePredictDescription = async () => {
		if (!selectedLlmEngine) {
			console.error("No LLM engine selected");
			return;
		}

		const currentState = editDescriptionDialog;
		
		let columnNameForPixel = currentState.columnName.replace(/\s+/g, "_");
		
		try {
			const logicalNamesPixel = `GetDatabaseMetamodel(database=["${active.id}"], options=["logicalNames"]);`;
			const logicalNamesResponse = await monolithStore.runQuery(logicalNamesPixel);
			const logicalNames = logicalNamesResponse.pixelReturn[0]?.output?.logicalNames?.[currentState.columnId] || [];
			
			if (logicalNames.length > 0) {
				columnNameForPixel = logicalNames[0];
			}
		} catch (error) {
			console.warn("Failed to fetch logical names, using column name:", error);
		}
			
		const pixel = `PredictOwlDescriptionLLM(database=["${active.id}"], concept="${currentState.tableName}", column="${columnNameForPixel}", engine="${selectedLlmEngine}")`;

		console.log(pixel);
		
		try {
			const response = await monolithStore.runQuery(pixel);
			const predictedDescription = response.pixelReturn[0]?.output?.[0] || "";
			
			setEditDescriptionDialog(prev => ({
				...prev,
				newDescription: predictedDescription,
			}));
		} catch (error) {
			console.error("Failed to predict description:", error);
		}
	};

  const handleSaveDescription = async () => {
    const logicalNames = getDatabaseMetamodel.data?.logicalNames?.[editDescriptionDialog.columnId] || [];
    const columnNameForPixel = logicalNames.length > 0 
      ? logicalNames[0] 
      : editDescriptionDialog.columnName.replace(/\s+/g, "_");
      
    const pixel = `EditOwlDescription(database=["${active.id}"], concept="${editDescriptionDialog.tableName}", column="${columnNameForPixel}", description="${editDescriptionDialog.newDescription}")`;
    
    try {
      await monolithStore.runQuery(pixel);
      
      const isDataSectionTable = selectedNode && selectedNode.data.name === editDescriptionDialog.tableName;
      
      const descriptions: Record<string, string> = {};
      
      if (isDataSectionTable) {
        const descriptionsPixel = `GetOwlDescriptions(database=["${active.id}"], concept="${editDescriptionDialog.tableName}", column="${columnNameForPixel}")`;
        const response = await monolithStore.runQuery(descriptionsPixel);

        const rawDescriptions = response.pixelReturn[0]?.output || {};
      
        if (rawDescriptions["0"] && Object.keys(rawDescriptions).length === 1) {
          const tableNameColumnName = `${editDescriptionDialog.tableName}__${columnNameForPixel}`;
          descriptions[tableNameColumnName] = rawDescriptions["0"];
        } else {
          Object.keys(rawDescriptions).forEach(key => {
            if (key !== "0") {
              if (key.includes("__")) {
                descriptions[key] = rawDescriptions[key];
              } else {
                const tableNameColumnName = `${editDescriptionDialog.tableName}__${key}`;
                descriptions[tableNameColumnName] = rawDescriptions[key];
              }
            }
          });
        }
      } else {
        const tableNameColumnName = `${editDescriptionDialog.tableName}__${columnNameForPixel}`;
        descriptions[tableNameColumnName] = editDescriptionDialog.newDescription;
      }

      const updatedData = { ...getDatabaseMetamodel.data };
      updatedData.descriptions = {
        ...updatedData.descriptions,
        ...descriptions,
      };

      getDatabaseMetamodel.update(updatedData);
      if (isDataSectionTable) {
        getData.refresh();
        
        setTimeout(() => {
          const refreshedData = { ...getDatabaseMetamodel.data };
          refreshedData.descriptions = {
            ...refreshedData.descriptions,
            ...descriptions,
          };
          getDatabaseMetamodel.update(refreshedData);
        }, 0);
      }

      handleEditDescriptionClose();
    } catch (error) {
      console.error("Failed to update description:", error);
    }
  };

	return (
		<StyledPage>
			<Section>
				<Section.Header
					actions={
						<Stack direction="row" spacing={2}>
							<Button variant="outlined" onClick={refreshData}>
								Refresh Data
							</Button>
							<Button
								startIcon={<ArrowCircleDown />}
								variant="outlined"
								onClick={printMeta}
								data-testid={"engine-metadata-print-btn"}
							>
								Print Metadata
							</Button>
							<Button
								disabled={canSave}
								variant="outlined"
								onClick={() => onSubmit()}
							>
								Save
							</Button>
						</Stack>
					}
				>
					Metamodel
				</Section.Header>
				<Stack spacing={2}>
					<StyledMetamodelContainer>
						<Metamodel
							nodes={customNodes ?? defaultNodes}
							edges={customEdges ?? defaultEdges}
							selectedNode={selectedNode}
							onSelectNode={setSelectedNode}
							isInteractive={true}
						/>
					</StyledMetamodelContainer>
				</Stack>
			</Section>

			{selectedNode && (
				<>
					<Section>
						<Section.Header>Description</Section.Header>
						<Typography variant="body2">{description}</Typography>
					</Section>

					<Section>
						<Section.Header>Logical Names</Section.Header>
						<Stack direction="row" spacing={1} flexWrap="wrap">
							{logical.map((name) => (
								<Chip
									key={name}
									label={name}
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
										<Table.Cell>Edit</Table.Cell>
										<Table.Cell>Name</Table.Cell>
										<Table.Cell>Description</Table.Cell>
										<Table.Cell>Logical Names</Table.Cell>
									</Table.Row>
								</Table.Head>
								<Table.Body>
									{columnRows.map((property, idx) => {
										const desc =
											getDatabaseMetamodel.data
												?.descriptions?.[property.id] ||
											"";
										const logic =
											getDatabaseMetamodel.data
												?.logicalNames?.[property.id] ||
											[];
										return (
											<Table.Row
												key={`${property.id}--${idx}`}
											>
												<Table.Cell>
													<IconButton 
														onClick={() => handleEditDescriptionOpen(
															property.id,
															property.name,
															selectedNode.data.name,
															desc
														)}
													>
														<Create />
													</IconButton>
												</Table.Cell>
												<Table.Cell>
													{property.name}
												</Table.Cell>
												<Table.Cell>
													<Typography variant="caption">
														{desc}
													</Typography>
												</Table.Cell>
												<Table.Cell>
													<Stack
														direction="row"
														spacing={1}
														flexWrap="wrap"
													>
														{logic.map((ln) => (
															<Chip
																key={ln}
																label={ln}
																color="primary"
																size="small"
															/>
														))}
													</Stack>
												</Table.Cell>
											</Table.Row>
										);
									})}
								</Table.Body>
								<Table.Footer>
									<Table.Row>
										<Table.Pagination
											page={columnPage}
											count={
												selectedNode?.data?.properties
													?.length || 0
											}
											rowsPerPage={columnVisibleRows}
											rowsPerPageOptions={[7, 10, 25]}
											onPageChange={(e, v) =>
												setColumnPage(v)
											}
											onRowsPerPageChange={(e) =>
												setColumnVisibleRows(
													e.target
														.value as unknown as number,
												)
											}
										/>
									</Table.Row>
								</Table.Footer>
							</Table>
						</StyledTableContainer>
					</Section>
				</>
			)}

			{selectedNode && getData.status === "SUCCESS" && (
				<Section>
					<Section.Header>Data</Section.Header>
					<StyledTableContainer>
						<Table stickyHeader>
							<Table.Head>
								<Table.Row>
									{getData.data.data.headers.map((h) => (
										<Table.Cell key={h}>
											{h.replace(/_/g, " ")}
										</Table.Cell>
									))}
								</Table.Row>
							</Table.Head>
							<Table.Body>
								{getData.data.data.values.map((row, i) => (
									<Table.Row key={i}>
										{row.map((val, j) => (
											<Table.Cell key={j}>
												{val}
											</Table.Cell>
										))}
									</Table.Row>
								))}
							</Table.Body>
						</Table>
					</StyledTableContainer>
				</Section>
			)}

			<SyncChangesModal
				open={showSyncModal}
				onClose={() => setShowSyncModal(false)}
				onApply={handleSyncApply}
				tables={tabledata}
				views={viewdata}
			/>

			{/* Edit Description Dialog */}
			<Modal key={dialogKey} open={editDescriptionDialog.open} onClose={handleEditDescriptionClose}>
				<Modal.Title>
					<Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
						<span>Edit Column Description</span>
						<Stack direction="row" spacing={2} alignItems="center">
							<Select
								value={selectedLlmEngine}
								onChange={(e) => setSelectedLlmEngine(e.target.value)}
								displayEmpty
								size="small"
								sx={{ minWidth: 200 }}
							>
								<Menu.Item value="">
									<em>Select LLM Engine</em>
								</Menu.Item>
								{llmEngines.map((engine) => (
									<Menu.Item key={engine.database_id} value={engine.database_id}>
										{engine.database_name}
									</Menu.Item>
								))}
							</Select>
							<Button 
								variant="outlined" 
								size="small"
								onClick={handlePredictDescription}
								disabled={!selectedLlmEngine}
							>
								Predict
							</Button>
						</Stack>
					</Stack>
				</Modal.Title>
				<Modal.Content>
					<TextField
						label="Column Name"
						value={editDescriptionDialog.columnName}
						disabled
						fullWidth
						margin="normal"
					/>
					<TextField
						label="Description"
						value={editDescriptionDialog.newDescription}
						onChange={handleDescriptionChange}
						multiline
						rows={4}
						fullWidth
						margin="normal"
					/>
				</Modal.Content>
				<Modal.Actions>
					<Button onClick={handleEditDescriptionClose}>Cancel</Button>
					<Button onClick={handleSaveDescription} variant="contained">
						Save
					</Button>
				</Modal.Actions>
			</Modal>

		</StyledPage>
	);
});
