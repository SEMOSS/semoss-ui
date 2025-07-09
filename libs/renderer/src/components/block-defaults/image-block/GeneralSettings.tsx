import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { observer } from "mobx-react-lite";
import {
    styled,
    Select,
    Tab,
    Tabs,
    Box,
    Typography,
    Stack,
    FileDropzone,
    Tooltip,
    ListItemText,
    IconButton,
    TextField,
    useNotification,
} from "@semoss/ui";
import { usePixel, upload } from "@semoss/sdk/react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import { BaseSettingSection, InputSettings } from "../../block-settings";
import { useBlock } from "../../../hooks";

const imageTypes = ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"];

const imageExtensions = imageTypes.map((ext) => `.${ext}`);

function getImageFiles(data: any) {
    return Array.isArray(data)
        ? data.filter(
              (file) =>
                  typeof file.type === "string" &&
                  imageTypes.includes(file.type.toLowerCase()),
          )
        : [];
}

interface GeneralSettingsProps {
    id: string;
}

type TabRenderProps = {
    id: string;
    data: any;
    setData: (path: string, value: any) => void;
    uploadFile?: (file: File, appId: string, path: string) => Promise<any>;
    appId: string;
    insightId?: string;
};

const StyledInfo = styled(Typography)(({ theme }) => ({
    color: theme.palette.text.disabled,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
    marginTop: 0,
}));

const StyledListItem = styled(Box)(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    gap: theme.spacing(1),
}));

const SelectedItem = ({ file, setData }) => {
    return file ? (
        <Box>
            <StyledListItem>
                <ListItemText>{file.fileName}</ListItemText>
                <IconButton
                    data-testid="remove-image"
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                        setData("src", "");
                    }}
                >
                    <DeleteIcon color="error" />
                </IconButton>
            </StyledListItem>
            <StyledInfo variant="caption">
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                Delete current file to upload a new one.
            </StyledInfo>
        </Box>
    ) : null;
};

const SelectImage = ({ data, imageFiles, setData }) => {
    const onImageChange = (e) => {
        const selectedName = e.target.value;
        const selectedFile = imageFiles.find((f) => f.name === selectedName);
        if (selectedFile) {
            setData("src", {
                fileLocation: selectedFile.path,
                fileName: selectedFile.name,
            });
            setData("title", "");
        }
    };
    return (
        <BaseSettingSection label="">
            <Select
                label="Select Image"
                size="small"
                fullWidth
                value={(data.src?.fileName ?? "") as string}
                onChange={onImageChange}
                data-testid="select-image"
            >
                {imageFiles?.map((file) => (
                    <Select.Item key={file.name} value={file.name}>
                        <ListItemText>{file.name}</ListItemText>
                    </Select.Item>
                ))}
            </Select>
        </BaseSettingSection>
    );
};

const AppImageTab = ({ id, data, setData, appId, insightId }) => {
    const notification = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const getAssets = usePixel<{ status: string; data: any }>(
        `BrowseAppAssets(project=["${appId}"], filePath=["/"]);`,
    );
    const imageFiles =
        getAssets.status === "SUCCESS" ? getImageFiles(getAssets.data) : [];
    const addFile = async (file: File) => {
        try {
            setIsLoading(true);

            let uploadRes = null;
            uploadRes = await upload(file, insightId, appId, "version/assets/");
            setData("title", "");
            setData("src", uploadRes[0]);
            notification.add({
                color: "success",
                message: "Image uploaded successfully",
            });
            if (!uploadRes) {
                throw new Error("Error missing uploading image");
            }
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
    if (isLoading) {
        return <Typography variant="body1">Loading...</Typography>;
    }
    if (data?.src instanceof Object) {
        return <SelectedItem file={data.src} setData={setData} />;
    }
    return (
        <>
            <SelectImage
                imageFiles={imageFiles}
                data={data}
                setData={setData}
                data-testid="select-image"
            />
            <Typography variant="body1" align="center">
                Or
            </Typography>
            <FileDropzone
                description="Upload your image here"
                extensions={imageExtensions}
                multiple={false}
                id={id}
                onChange={addFile}
                data-testid="upload-image"
            />
        </>
    );
};

const InsightImageTab = ({ insightId, data, setData }: TabRenderProps) => {
    const getAssets = usePixel<{ status: string; data: any }>(
        `BrowseAsset(filePath=["/"] );`,
        {},
        insightId,
    );
    const imageFiles =
        getAssets.status === "SUCCESS" ? getImageFiles(getAssets.data) : [];

    if (!data?.src) {
        return (
            <SelectImage
                imageFiles={imageFiles}
                data={data}
                setData={setData}
                data-testid="select-image"
            />
        );
    }

    return data.src instanceof Object ? (
        <SelectedItem file={data.src} setData={setData} />
    ) : (
        <SelectImage imageFiles={imageFiles} data={data} setData={setData} />
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
                {data.src instanceof Object ? (
                    <SelectedItem file={data.src} setData={setData} />
                ) : (
                    <>
                        <BaseSettingSection label={"Image URL"}>
                            <TextField
                                fullWidth
                                value={data.src ?? ""}
                                onChange={(e) => {
                                    setData("src", e.target.value);
                                }}
                                type={"text"}
                                size="small"
                                variant="outlined"
                                autoComplete="off"
                                data-testid="image-url"
                            />
                        </BaseSettingSection>
                        <InputSettings
                            id={id}
                            label="Description"
                            path="title"
                            data-testid="image-description"
                        />
                        <BaseSettingSection label="If Image is Unavailable">
                            <Select
                                fullWidth
                                value={data.unavailable ?? ""}
                                onChange={(e) => {
                                    const value = e.target.value as string;
                                    setData("unavailable", value);
                                }}
                                size="small"
                                variant="outlined"
                                data-testid="image-unavailable"
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
                {data.unavailable === "placeholder" && (
                    <InputSettings
                        id={id}
                        label="Enter Placeholder Text"
                        path="placeholderText"
                        data-testid="image-placeholder-text"
                    />
                )}
            </>
        ),
    },
];

const GeneralSettings: React.FC<GeneralSettingsProps> = observer(({ id }) => {
    const { data, setData: setBlockData, insightId } = useBlock(id);
    const { appId } = useParams();
    const [value, setValue] = useState(0);
    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const setData = (path: string, value: any) => {
        setBlockData(path, value, true);
    };

    const tabContent = useMemo(
        () =>
            tabConfig[value]?.render?.({
                id,
                data,
                setData,
                appId: appId || "",
                insightId: insightId || "",
            }),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [value],
    );

    return (
        <Box sx={{ width: "100%" }}>
            <Tabs
                value={value}
                onChange={handleChange}
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    minHeight: 36,
                }}
                TabIndicatorProps={{
                    sx: {
                        top: "inherit",
                        bottom: "unset",
                    },
                }}
                data-testid="image-tabs"
            >
                {tabConfig.map((tab) => (
                    <Tab
                        key={tab.label}
                        label={tab.label}
                        iconPosition="end"
                        sx={{ minHeight: 30, px: 2, py: 1, flex: 1 }}
                        icon={
                            <Tooltip title={tab.tooltip} placement="top">
                                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
                            </Tooltip>
                        }
                    />
                ))}
            </Tabs>
            <Stack flexDirection={"column"} marginTop={2}>
                {/* {tabConfig[value].render({
                    id,
                    data,
                    setData,
                    appId: appId || "",
                    insightId: insightId || "",
                })} */}
                {tabContent}
            </Stack>
        </Box>
    );
});

export default GeneralSettings;
