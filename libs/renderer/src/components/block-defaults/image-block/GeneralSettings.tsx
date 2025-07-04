import { useState } from "react";
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
import { usePixel } from "@semoss/sdk/react";
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
                    edge="end"
                    aria-label="delete"
                    onClick={() => {
                        setData("file", null);
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
            setData("src", "");
            setData("title", "");
            setData("file", {
                fileLocation: selectedFile.path,
                fileName: selectedFile.name,
            });
        }
    };
    return (
        <BaseSettingSection label="">
            <Select
                label="Select Image"
                size="small"
                fullWidth
                value={(data.file?.fileName ?? "") as string}
                onChange={onImageChange}
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

const AppImageTab = ({ id, data, setData, appId }) => {
    const { uploadFile } = useBlock(id);
    const notification = useNotification();
    const [isLoading, setIsLoading] = useState(false);
    const getAssetsApp = usePixel<{ status: string; data: any }>(
        `BrowseAppAssets(project=["${appId}"], filePath=["/"]);`,
    );
    const imageFiles =
        getAssetsApp.status === "SUCCESS"
            ? getImageFiles(getAssetsApp.data)
            : [];
    const addFile = async (file: File) => {
        try {
            setIsLoading(true);

            let upload = null;
            upload = await uploadFile(file, appId, "version/assets/"); // portals
            setData("src", "");
            setData("title", "");
            setData("file", upload[0]);
            notification.add({
                color: "success",
                message: "Image uploaded successfully",
            });
            if (!upload) {
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
    if (data.file) {
        return <SelectedItem file={data.file} setData={setData} />;
    }
    return (
        <>
            <SelectImage
                imageFiles={imageFiles}
                data={data}
                setData={setData}
            />
            <Typography variant="body1" align="center">
                Or
            </Typography>
            <FileDropzone
                description="Upload your image here"
                extensions={imageExtensions}
                multiple={false}
                value={data.file}
                id={`upload_image_${id}`}
                onChange={addFile}
            />
        </>
    );
};

const InsightImageTab = ({ insightId, data, setData }: TabRenderProps) => {
    const getAssetsApp = usePixel<{ status: string; data: any }>(
        `BrowseAsset(filePath=["/"] );`,
        {},
        insightId,
    );
    const imageFiles =
        getAssetsApp.status === "SUCCESS"
            ? getImageFiles(getAssetsApp.data)
            : [];

    return !data?.file ? (
        <SelectImage imageFiles={imageFiles} data={data} setData={setData} />
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
                {!data.file && data.unavailable === "placeholder" && (
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
    const { data, setData: setBlockData, insightId } = useBlock(id);
    const { appId } = useParams();
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
