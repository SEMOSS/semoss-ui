import { useState, useEffect, useMemo } from "react";
import {
    Select,
    Tab,
    Tabs,
    FormControl,
    Box,
    Typography,
    MenuItem,
    Stack,
    FileDropzone,
    Tooltip,
    ListItemText,
    List,
    IconButton,
    Autocomplete,
    TextField,
    useNotification,
} from "@semoss/ui";
import { runPixel, usePixel } from "@semoss/sdk/react";
import { BaseSettingSection, InputSettings } from "../../block-settings";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { useBlockSettings, useBlock } from "../../../hooks";
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { computed } from "mobx";
// import { useRootStore, monolithStore } from "@/hooks";

const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

const imageExtensions = imageTypes.map((ext) => `.${ext}`);

interface GeneralSettingsProps {
    id: string;
    data?: any;
}

type TabRenderProps = {
    id: string;
    data: any;
    setData: Function;
    uploadFile?: (file: File, appId: string, path: string) => Promise<any>;
    appId: string;
    insightId?: string;
};

const SelectedItem = ({ file, setData }) => {
    return file ? (
        <List>
            <List.Item>
                <ListItemText>{file.fileName}</ListItemText>
                <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                        setData("file", null);
                    }}
                >
                    <DeleteIcon color="error" />
                </IconButton>
            </List.Item>
        </List>
    ) : null;
};

const AppImageTab = ({ id, data, setData, appId }) => {
    const { uploadFile } = useBlock(id);
    const getAssetsApp = usePixel<{ status: string; data: any }>(
        `BrowseAppAssets(project=["${appId}"], filePath=["/"]);`, // portals
    );
    // .then((res) => {
    //     console.log("getAssetsApp: ", res);
    // });
    let imageFiles = [];
    if (getAssetsApp.status === "SUCCESS") {
        imageFiles = Array.isArray(getAssetsApp.data)
            ? getAssetsApp.data.filter(
                  (file) =>
                      typeof file.type === "string" &&
                      imageTypes.includes(file.type.toLowerCase()),
              )
            : [];
    }
    console.log("getAssetsApp: ", getAssetsApp);
    const notification = useNotification();
    // const { monolithStore, configStore } = useRootStore();
    const [isLoading, setIsLoading] = useState(false);
    console.log("GeneralSettings data: ", data);
    const addFile = async (file: File) => {
        try {
            setIsLoading(true);

            let upload = null;
            //  if (type === "app") {
            upload = await uploadFile(file, appId, "version/assets/"); // portals
            setData("src", "");
            setData("title", "");
            setData("file", upload[0]);
            notification.add({
                color: "success",
                message: "Image uploaded successfully",
            });
            if (!upload) {
                throw new Error("Error missing uploading app");
            }

            // const path = `${uploadPath}${upload[0].fileName}`;
        } catch (e) {
            notification.add({
                color: "error",
                message: "Error uploading image",
            });
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <>
            {isLoading ? (
                <Typography variant="body1">Loading...</Typography>
            ) : data.file ? (
                <SelectedItem file={data.file} setData={setData} />
            ) : (
                <>
                    <BaseSettingSection label="">
                        <Select
                            label="Select Image"
                            size="small"
                            fullWidth
                            value={(data.file?.fileName ?? "") as string}
                            onChange={(e) => {
                                const selectedName = e.target.value;
                                const selectedFile = imageFiles.find(
                                    (f) => f.name === selectedName,
                                );
                                if (selectedFile) {
                                    setData("src", "");
                                    setData("title", "");
                                    setData("file", {
                                        fileLocation: selectedFile.path,
                                        fileName: selectedFile.name,
                                    });
                                }
                            }}
                        >
                            {imageFiles?.map((file) => (
                                <Select.Item key={file.name} value={file.name}>
                                    <ListItemText>{file.name}</ListItemText>
                                </Select.Item>
                            ))}
                        </Select>
                    </BaseSettingSection>
                    <Typography variant="body1" align="center">
                        Or
                    </Typography>
                    <FileDropzone
                        description="Upload your image here"
                        extensions={[
                            ".jpg",
                            ".jpeg",
                            ".png",
                            ".gif",
                            ".webp",
                            ".svg",
                            ".avif",
                        ]}
                        multiple={false}
                        value={data.file}
                        id={`upload_image_${id}`}
                        onChange={(file: File) => {
                            if (addFile) addFile(file);
                        }}
                    />
                </>
            )}
        </>
    );
};

const InsightImageTab = ({
    insightId,
    data,
    setData,
    appId,
}: TabRenderProps) => {
    const getAssetsApp = usePixel<{ status: string; data: any }>(
        `BrowseAsset(filePath=["/"] );`, // portals
        {},
        insightId,
    );
    // BrowseAsset(space=["8205b8c5-8068-47ab-8068-9bbe10d2a245"], filePath=["/"]);
    // `BrowseAsset(insightId="${insightId}", filePath=["/"] )
    console.log("getAssetsApp insifghts : ", getAssetsApp);
    let imageFiles = [];
    if (getAssetsApp.status === "SUCCESS") {
        imageFiles = Array.isArray(getAssetsApp.data)
            ? getAssetsApp.data.filter(
                  (file) =>
                      typeof file.type === "string" &&
                      imageTypes.includes(file.type.toLowerCase()),
              )
            : [];
    }
    console.log("InsightImageTab params: ", appId);
    return !data?.file ? (
        <BaseSettingSection label="">
            <Select
                label="Select Image"
                size="small"
                fullWidth
                value={(data.file?.fileName ?? "") as string}
                onChange={(e) => {
                    const selectedName = e.target.value;
                    const selectedFile = imageFiles.find(
                        (f) => f.name === selectedName,
                    );
                    if (selectedFile) {
                        setData("src", "");
                        setData("title", "");
                        setData("file", {
                            fileLocation: selectedFile.path,
                            fileName: selectedFile.name,
                        });
                    }
                }}
            >
                {imageFiles?.map((file) => (
                    <Select.Item key={file.name} value={file.name}>
                        <ListItemText>{file.name}</ListItemText>
                    </Select.Item>
                ))}
            </Select>
        </BaseSettingSection>
    ) : (
        <SelectedItem file={data.file} setData={setData} />
    );
};

const tabConfig = [
    {
        label: "Insight",
        tooltip: "Image generated when the app runs",
        render: (props: TabRenderProps) => <InsightImageTab {...props} />,
    },
    {
        label: "App",
        tooltip: "Image stored in app assets",
        render: (props) => <AppImageTab {...props} />,
    },
    {
        label: "External",
        tooltip: "Add image from external link",
        render: ({ id, data, setData }: TabRenderProps) => (
            <>
                {data.file ? (
                    <SelectedItem file={data.file} setData={setData} />
                ) : (
                    <>
                        <BaseSettingSection label={"Image URL"}>
                            <TextField
                                fullWidth
                                value={data.src ?? ""}
                                onChange={(e) => {
                                    // sync the data on change
                                    setData("src", e.target.value);
                                }}
                                type={"text"}
                                size="small"
                                variant="outlined"
                                autoComplete="off"
                            />
                        </BaseSettingSection>
                        <InputSettings
                            id={id}
                            label="Description"
                            path="title"
                        />
                        <BaseSettingSection label="If Image is Unavailable">
                            <Select
                                fullWidth
                                value={data.unavailable ?? ""}
                                onChange={(e) => {
                                    console.log(
                                        "Selected value:",
                                        e.target.value,
                                    );
                                    const value = e.target.value as string;
                                    setData("unavailable", value);
                                }}
                                size="small"
                                variant="outlined"
                            >
                                <Select.Item value="placeholder">
                                    Add placeholder text
                                </Select.Item>
                                <Select.Item value="default">
                                    Use system default image
                                </Select.Item>
                            </Select>
                        </BaseSettingSection>
                    </>
                )}
                {data.file && data.unavailable === "placeholder" && (
                    <InputSettings
                        id={id}
                        label="Enter Placeholder Text"
                        path="placeholderText"
                    />
                )}
            </>
        ),
    },
];

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
    // const { insightId } = useBlockSettings(id);
    const { data, setData: setBlockData, insightId } = useBlock(id);
    // const computedValue = useMemo(() => {
    //     return computed(() => {
    //         if (!data) {
    //             return {};
    //         }
    //         // const v = getValueByPath(data, path);
    //         // if (typeof v === "undefined") {
    //         //     return "";
    //         // } else if (typeof v === "string") {
    //         //     return v;
    //         // }
    //         return data;
    //     });
    // }, [data]).get();
    // console.log("GeneralSettings computedValue: ", computedValue);
    const { appId } = useParams();
    console.log("GeneralSettings params: ", data, appId, insightId);
    const [value, setValue] = useState(0);
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const setData = (path: string, value: any) => {
        setBlockData(path, value, true);
    };

    return (
        <Box sx={{ width: "100%" }}>
            <Tabs
                value={value}
                onChange={handleChange}
                centered
                TabIndicatorProps={{
                    sx: {
                        top: "inherit",
                        bottom: "unset",
                        justifyContent: "space-evenly",
                    },
                }}
            >
                {tabConfig.map((tab) => (
                    <Tab
                        key={tab.label}
                        label={tab.label}
                        iconPosition="end"
                        sx={{ minHeight: 30, px: 2, py: 1 }}
                        icon={
                            <Tooltip title={tab.tooltip} placement="top">
                                <InfoOutlinedIcon fontSize="small" />
                            </Tooltip>
                        }
                    />
                ))}
            </Tabs>
            <Stack sx={{ mt: 2 }} gap={2} flexDirection={"column"}>
                {tabConfig[value].render({
                    id,
                    data,
                    setData,
                    appId: appId || "",
                    insightId: insightId || "",
                })}
            </Stack>
        </Box>
    );
});

export default GeneralSettings;
