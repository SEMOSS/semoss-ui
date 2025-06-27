import { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { BaseSettingSection } from "../BaseSettingSection";
import { useParams } from "react-router-dom";

import { useBlock } from "../../../hooks";
import { Block, BlockDef } from "../../../store";
import { Paths, PathValue } from "../../../types";
import { PDFViewerBlockDef } from "../../block-defaults/pdfViewer-block/PDFViewerBlock";
import { Stack, TextField, Tab, Tabs, styled, FileDropzone, Accordion, Typography, List } from "@semoss/ui";
import { runPixel } from "@semoss/sdk/react";
import InfoIcon from "../../../assets/img/InfoGrayIcon.svg";
import { ExpandMore } from "@mui/icons-material";
import { Autocomplete } from "@mui/material";

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
        const { appId } = useParams();
        const getAssets = runPixel<AssetFile[]>(
            `BrowseAsset(filePath=["version/assets/"], space=["${appId}"]);`,
        );
        const [selectedPdfPath, setSelectedPdfPath] = useState(
            data?.selectedPdf || "", // Initialize with existing value
        );
        const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
        // const pdfFiles = React.useMemo(() => {
        //     if (!getAssets.data) return [];
        //     return getAssets?.data?.filter((file) => file?.type === "pdf");
        // }, [getAssets.data]);

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
        const [uploadFile, setUploadFiles] = useState<File>(null);
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

        const groupAliasMapper = (type: string) => {
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

        // Example options with group (replace with your real data)
        const options: Option[] = [
            { id: "upload1", path: "upload1", display: "Upload Block 1", group: groupAliasMapper("upload") },
            { id: "notebook1", path: "notebook1", display: "Notebook 1", group: groupAliasMapper("notebook") },
            { id: "cell1", path: "cell1", display: "Cell 1", group: groupAliasMapper("cell") },
        ];

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
        const StyledMenuSectionTitle = styled(Accordion.Trigger)(({ theme }) => ({
            minHeight: "auto !important",
            height: theme.spacing(6),
        }));

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
                    <StyledSpanFrame>{selectedTab}</StyledSpanFrame>
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
                            id="Echart-Frame"
                            multiple={false}
                            // value={data.frame?.name}
                            options={options}
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
                    )}
                    {selectedTab === 'App' && (
                        <div>
                            <Autocomplete
                                fullWidth
                                id="Echart-Frame"
                                multiple={false}
                                // value={data.frame?.name}
                                options={options}
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
                                    value={uploadFile}
                                    disabled={isLoading}
                                    onChange={(newValue: File) => {
                                        setUploadFiles(newValue);
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </StyledSubSection>
            </Stack>
        );
    },
);
