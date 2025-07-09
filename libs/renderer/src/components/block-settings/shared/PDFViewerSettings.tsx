import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";

import { useBlock } from "../../../hooks";
import { Block, BlockDef } from "../../../store";
import { Paths, PathValue } from "../../../types";
import { PDFViewerBlockDef } from "../../block-defaults/pdfViewer-block/PDFViewerBlock";
import { Stack, TextField, Tab, Tabs, styled, FileDropzone, Accordion, Typography, List, useNotification, Popper } from "@semoss/ui";
import { runPixel } from "@semoss/sdk/react";
import InfoIcon from "../../../assets/img/InfoGrayIcon.svg";
import { ExpandMore } from "@mui/icons-material";
import { Autocomplete, AccordionSummary } from "@mui/material";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { upload } from "@semoss/sdk/react";


interface AssetFile {
    path: string;
    name: string;
    lastModified: string;
    type: string;
}

interface Option {
    id: string;
    path: string;
    display: string;
    group: string;
}

type TabRenderProps = {
    id: string;
    data: any;
    setData: Function;
    uploadFile?: (file: File, appId: string, path: string) => Promise<any>;
    appId: string;
    insightId?: string;
};

interface PDFViewerSettings<D extends BlockDef = BlockDef> {
    /**
     * Id of the block that is being worked with
     */
    id: string;

    /**
     * Path to update
     */
    path: Paths<Block<D>["data"], 4>;
}

export const PDFViewerSettings = observer(
    <D extends BlockDef = BlockDef>({ id, path }: PDFViewerSettings<D>) => {
        const { data, setData } = useBlock<PDFViewerBlockDef>(id);
        const { renderEngineId, appId } = useParams();
        const [appOptions, setAppOptions] = useState<any>([]);
        const [engineIds, setEngineIds] = useState<{ app_id: string; app_type: string }[]>([]);
        const [engineOptions, setEngineOptions] = useState<{ file_name: string; file_type: string; app_type: string }[]>([]);
        const pixel = `MyEngines(engineTypes=["MODEL", "DATABASE", "VECTOR", "FUNCTION", "STORAGE"]);`;
        const res = runPixel(pixel);
        const { uploadFile, insightId } = useBlock(id);

        const getAssetsApp = runPixel<any>(
            `BrowseAppAssets(project=["${appId}"], filePath=["/portals"]);`,
        );

        // Fetch and set appOptions
        useEffect(() => {
            getAssetsApp.then((result) => {
                // Only include items where the name ends with .pdf (case-insensitive)
                const outputNames = (result.pixelReturn[0].output || [])
                    .filter((item: any) => typeof item.name === "string" && item.name.toLowerCase().endsWith(".pdf"))
                    .map((item: any) => item.name);
                setAppOptions(outputNames);
            }).catch((error) => {
                console.error("Error fetching assets:", error);
            });
        }, []);

        useEffect(() => {
            res.then((result) => {
                const output = result.pixelReturn?.[0]?.output;
                const engineIds = Array.isArray(output)
                    ? Array.from(
                        new Map(
                            output
                                .filter((item: any) => item.app_id && item.app_type)
                                .map((item: any) => [item.app_id, { app_id: item.app_id, app_type: item.app_type }])
                        ).values()
                    )
                    : [];
                setEngineIds(engineIds);
            }).catch((error) => {
                console.error("Error fetching engines:", error);
            });
        }, []);

        useEffect(() => {

            const getFiles = engineIds.map((id) => ({
                promise: runPixel<any>(
                    `BrowseEngineAssets(engine=["${id.app_id}"], filePath=["/"]);`
                ),
                app_type: id.app_type,
                app_id: id.app_id,
            }));

            const fetchEngineOptions = async () => {
                let pdfFiles: { file_name: string; app_type: string; file_type: string }[] = [];
                for (const obj of getFiles) {
                    try {
                        const resolvedResult = await obj.promise;
                        const output = resolvedResult.pixelReturn?.[0]?.output || [];
                        const files = output
                            .filter((item: any) => item.type === "pdf")
                            .map((item: any) => ({
                                file_name: item.name,
                                app_type: obj.app_type,
                                file_type: item.type,
                            }));
                        pdfFiles = [...pdfFiles, ...files];
                        setEngineOptions([...pdfFiles]);
                    } catch (e) {
                        console.error("Error fetching engine assets:", e);
                    }
                }
            };
            fetchEngineOptions();
        }, [engineIds]);

        const [selectedPdfPath, setSelectedPdfPath] = useState(
            data?.selectedPdf || "", // Initialize with existing value
        );
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        // const pdfFiles = React.useMemo(() => {
        //     if (!getAssets.data) return [];
        //     return getAssets?.data;
        // }, [getAssets.data]);
        // console.log("pdfFiles", pdfFiles);

        // Handle selection change
        const setBlockData = (newValue, optPath) => {
            if (!newValue) {
                setSelectedPdfPath("");
                return;
            }
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }

            timeoutRef.current = setTimeout(() => {
                try {
                    setData(
                        optPath,
                        newValue as PathValue<D["data"], typeof path>,
                        true,
                    );
                    setSelectedPdfPath(newValue);
                } catch (e) {
                    console.log(e);
                }
            }, 300);
        };

        const tabs = ['Insight', 'Engine', 'App'];
        // const options = ['Upload Blocks', 'Notebooks', 'Cells'];

        const [selectedTab, setSelectedTab] = useState(tabs[0]);
        const [uploadFiles, setUploadFiles] = useState<File>(null);
        const [isLoading, setIsLoading] = useState(false);

        //styled section for the selected tab
        const StyledSubSection = styled("div")(() => ({
            padding: "0.5rem",
            width: "100%",
            marginTop: "10px",
        }));

        //styled span of the selected tab
        const StyledSpanFrame = styled("span")(() => ({
            fontSize: "1rem",
            color: "#808080",
            paddingLeft: "3px",
            position: "relative",
        }));

        const StyledPopper = styled(Popper)({
            zIndex: 1300,
            width: 'auto',
          });

        const groupAliasAppMapper = (type: string) => {
            switch (type) {
                case "upload":
                    return "Upload Blocks";
                case "notebook":
                    return "Notebooks";
                case "cell":
                    return "Cells";
                default:
                    return "Others";
            }
        };

        const groupAliasEngineMapper = (type: string) => {
            switch (type) {
                case "MODEL":
                    return "Models";
                case "DATABASE":
                    return "Databases";
                case "VECTOR":
                    return "Vectors";
                case "FUNCTION":
                    return "Functions";
                case "STORAGE":
                    return "Storage";
                default:
                    return "Others";
            }
        }

        // Example options with group (replace with your real data)
        const options: Option[] = [
            { id: "upload1", path: "upload1", display: "Upload Block 1", group: groupAliasAppMapper("upload") },
            { id: "notebook1", path: "notebook1", display: "Notebook 1", group: groupAliasAppMapper("notebook") },
            { id: "cell1", path: "cell1", display: "Cell 1", group: groupAliasAppMapper("cell") },
        ];

        const allEngineTypes = ["MODEL", "DATABASE", "VECTOR", "FUNCTION", "STORAGE"];

        const allEngineGroups = allEngineTypes.map(type => ({
            type,
            group: groupAliasEngineMapper(type)
        }));

        const filesByType: Record<string, Option[]> = {};
        allEngineTypes.forEach(type => {
            filesByType[type] = [];
        });
        engineOptions.forEach((item, idx) => {
            if (!filesByType[item.app_type]) filesByType[item.app_type] = [];
            filesByType[item.app_type].push({
                id: `${item.app_type}-${item.file_name}-${idx}`,
                path: item.file_name,
                display: item.file_name,
                group: groupAliasEngineMapper(item.app_type),
            });
        });

        const engineOptionList: Option[] = allEngineGroups.flatMap(({ type, group }) =>
            filesByType[type].length > 0
                ? filesByType[type]
                : [{
                    id: `${type}-empty`,
                    path: "",
                    display: "",
                    group,
                }]
        );

        const [expandedQueryInputGroup, setExpandedQueryInputGroup] = useState<
            string | null
        >(null);

        const StyledMenuSection = styled(Accordion)(({ theme }) => ({
            boxShadow: "none",
            borderRadius: "0 !important",
            border: "0px",
            borderBottom: `1px solid ${theme.palette.divider}`,
            "&:before": { display: "none" },
            "&.Mui-expanded": { margin: "0" },
        }));
        const StyledMenuSectionTitle = styled(AccordionSummary)(({ theme }) => ({
            minHeight: "auto !important",
            height: theme.spacing(6),
        }));

        //add file in the files functionality
        // const addFile = async () => {
        //     try {
        //         setIsLoading(true);

        //         let upload = await monolithStore.uploadFiles(
        //             [uploadFiles],
        //             configStore.store.insightID,
        //             space,
        //             uploadPath,
        //         );
        //     } catch (e) {
        //         console.error(e);
        //     }
        // }

        const notification = useNotification();

        const addFile = async (file: File) => {
            try {
                setIsLoading(true);
                let uploadTemp = null;

                uploadTemp = await upload(file, insightId, appId, "version/assets/");
                notification.add({
                    color: "success",
                    message: "PDF uploaded successfully",
                });
                if (!uploadTemp) {
                    throw new Error("Error missing uploading app");
                }
            }
            catch (e) {
                notification.add({
                    color: "error",
                    message: "Error uploading PDF",
                });
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

        return (
            <Stack>
                <Tabs
                    value={selectedTab}
                    onChange={(_, value: string) => {
                        setSelectedTab(value);
                    }}
                    color="primary"
                    sx={{
                        '& .MuiTabs-flexContainer': {
                            justifyContent: 'space-between',
                            width: '100%',
                        },
                    }}
                >
                    {tabs.map((key, idx: number) => (
                        <Tabs.Item
                            key={`${key}-${idx}`}
                            label={
                                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {key}
                                    <img src={String(InfoIcon)} alt="Info Icon" style={{ marginLeft: '10px', alignItems: 'center' }} />
                                </span>
                            }
                            value={key}
                        />
                    ))}
                </Tabs>
                <StyledSubSection>
                    <StyledSpanFrame>
                        {selectedTab === "App" && uploadFiles ? (
                            <span>
                                File Selected
                            </span>
                        ) : (
                            selectedTab
                        )}
                    </StyledSpanFrame>
                    {selectedTab === 'Insight' && (
                        <Autocomplete
                            fullWidth
                            id="PDFViewer-Insight"
                            multiple={false}
                            options={options}
                            groupBy={(option) => (typeof option === "object" && "group" in option ? option.group : "")}
                            getOptionLabel={(option) => typeof option === "object" && "display" in option ? option.display : option}
                            renderOption={(props, option) => (
                                <li {...props} key={typeof option === "object" && "id" in option ? option.id : undefined}>
                                    <Typography variant="body2">
                                        {typeof option === "object" && "display" in option ? option.display : option}
                                    </Typography>
                                </li>
                            )}
                            renderGroup={(params) => (
                                <li key={params.key}>
                                    <StyledMenuSection
                                        onChange={() => {
                                            if (
                                                params.group ===
                                                expandedQueryInputGroup
                                            )
                                                setExpandedQueryInputGroup(
                                                    null,
                                                );
                                            else
                                                setExpandedQueryInputGroup(
                                                    params.group,
                                                );
                                        }}
                                        expanded={
                                            expandedQueryInputGroup ===
                                            params.group
                                        }
                                    >
                                        <StyledMenuSectionTitle expandIcon={<ExpandMore />}>
                                            <Typography variant="body2">{params.group}</Typography>
                                        </StyledMenuSectionTitle>
                                        <Accordion.Content>
                                            <List disablePadding>{params.children}</List>
                                        </Accordion.Content>
                                    </StyledMenuSection>
                                </li>
                            )}
                            renderInput={(params) => (
                                <TextField {...params} placeholder="Select File" size="small" variant="outlined" />
                            )}
                            sx={{ marginTop: "12px" }}
                        />
                    )}
                    {selectedTab === 'Engine' && (
                        <Autocomplete
                        fullWidth
                        id="PDFViewer-Engine"
                        disableCloseOnSelect
                        blurOnSelect={false}
                        multiple={false}
                        options={engineOptionList}
                        groupBy={(option) =>
                          typeof option === 'object' && 'group' in option ? option.group : ''
                        }
                        getOptionLabel={(option) =>
                          typeof option === 'object' && 'display' in option
                            ? option.display
                            : option
                        }
                        PopperComponent={(props) => <StyledPopper {...props} />}
                        renderOption={(props, option) => (
                          <li
                            {...props}
                            key={
                              typeof option === 'object' && 'id' in option ? option.id : undefined
                            }
                          >
                            <Typography variant="body2">
                              {typeof option === 'object' && 'display' in option
                                ? option.display
                                : option}
                            </Typography>
                          </li>
                        )}
                        renderGroup={(params) => {
                          return (
                            <li key={params.key}>
                              <StyledMenuSection>
                                <StyledMenuSectionTitle
                                  expandIcon={<ExpandMore />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                  }}
                                >
                                  <Typography variant="body2">{params.group}</Typography>
                                </StyledMenuSectionTitle>
                                <Accordion.Content>
                                  <List disablePadding>{params.children}</List>
                                </Accordion.Content>
                              </StyledMenuSection>
                            </li>
                          );
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Select File"
                            size="small"
                            variant="outlined"
                          />
                        )}
                        sx={{ marginTop: '12px' }}
                      />
                      
                    )}
                    {selectedTab === 'App' && (
                        <div>
                            {uploadFiles ? (
                                <div style={{ marginTop: '5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body2">
                                        {uploadFiles.name}
                                    </Typography>
                                    <DeleteOutlineIcon
                                        style={{ cursor: 'pointer', color: '#DA291C' }}
                                        onClick={() => {
                                            setUploadFiles(null);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <Autocomplete
                                        fullWidth
                                        id="PDFViewer-App"
                                        multiple={false}
                                        // value={data.frame?.name}
                                        options={appOptions}
                                        // getOptionLabel={(option) => option}
                                        // onChange={(_, value) => {
                                        //     setData("frame.name", value);
                                        //     syncHeader(value);
                                        // }}
                                        freeSolo={false}
                                        renderInput={(params) => (
                                            <TextField {...params} placeholder="Select File" size="small" variant="outlined" />
                                        )}
                                        sx={{ marginTop: "12px" }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
                                        <span style={{ marginTop: '5%', color: '#808080' }}>Or</span>
                                    </div>
                                    <div style={{ marginTop: '5%' }}>
                                        <FileDropzone
                                            multiple={false}
                                            value={uploadFiles}
                                            disabled={isLoading}
                                            onChange={(newValue: File) => {
                                                setUploadFiles(newValue);
                                                addFile(newValue);
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </StyledSubSection>
            </Stack>
        );
    },
);
