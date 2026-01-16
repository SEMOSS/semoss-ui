import { useEffect, useState, lazy, Suspense } from "react";
import { usePixel, useRootStore } from "@/hooks";
import {
  styled,
  Button,
  Stack,
  useNotification,
  Typography,
  TextArea,
  Paper,
  Box,
  IconButton,
  LoadingScreen,
} from "@semoss/ui";
import {
  CachedRounded,
  CheckRounded,
  ContentCopyOutlined,
  EditOutlined,
  PlayArrowRounded,
} from "@mui/icons-material";

const Editor = lazy(() => import("@monaco-editor/react"));

const StyledWrapper = styled("div")({
  position: "relative",
  paddingTop: "15px",
  marginBottom: "40px",
});

const StyledButtonGroup = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "5px",
  position: "absolute",
  right: "15px",
  top: "-33px",
  zIndex: 1,
});

const StyledButton = styled(Button)({
  borderColor: "#c4c4c4",
  color: "#212121",
  fontSize: "13px",
  borderRadius: "12px",
});

const StyledRunButton = styled(Button)({
  borderRadius: "12px",
});

const StyledPaper = styled(Paper)<{ readOnly: boolean }>(({ readOnly }) => ({
  position: "relative",
  border: "1px solid #90caf9",
  borderRadius: "8px",
  paddingTop: readOnly ? "20px" : "50px",
  "& .monaco-editor": {
    outline: "none !important",
    border: "none !important",
    boxShadow: "none !important",
    borderRadius: "8px",
  },
  "& .monaco-editor .overflow-guard": {
    borderRadius: "8px",
  },
}));

const StyledCopyIcon = styled(IconButton)({
  position: "absolute",
  top: "40px",
  right: "10px",
  zIndex: 1,
});

const StyledBox = styled(Box)({
  width: "100%",
  position: "absolute",
  top: "0",
  left: "50%",
  right: "50%",
  transform: "translateX(-50%)",
  backgroundColor: "#e3f2fd",
  padding: "8px 12px",
  borderRadius: "8px 8px 0 0",
  textAlign: "center",
  fontSize: "14px",
  fontWeight: 600,
  color: "#1976d2",
  zIndex: 1,
});

const StyledResultsWrapper = styled("div")({
  marginTop: "15px",
  border: "1px solid #c4c4c4",
  borderRadius: "16px",
  boxShadow: "0px 5px 22px 0px rgba(0, 0, 0, 0.06)",
});

const StyledDiv = styled("div")({
  padding: "10px 16px 16px",
});

const StyledTextArea = styled(TextArea)({
  borderRadius: "8px",
  marginTop: "10px",
});

const StyledInnerDiv = styled("div")({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  background: "rgba(0, 0, 0, 0.04)",
  padding: "6px 16px",
  borderRadius: "16px 16px 0 0",
});

const StyledTypography = styled(Typography)({
  color: "rgba(0, 0, 0, 0.38)",
});

export const EngineFileEditor = ({
  engineId,
  filePath,
}: {
  engineId: string;
  filePath: string;
}) => {
  const { monolithStore } = useRootStore();
  const notification = useNotification();
  const [fileContent, setFileContent] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [readOnly, setReadOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const fullPath = filePath.replace(/\\/g, "/");
  const fileName = fullPath.split("/").pop();

  const { data, status } = usePixel<
    {
      lastModified: string;
      name: string;
      path: string;
      type: "directory" | "file";
    }[]
  >(`GetEngineAssets(engine=['${engineId}'], filePath=["/${fileName}"])`);

  useEffect(() => {
    if (status === "SUCCESS" && data) {
      loadFile();
    }
  }, [data, status, fileName]);

  const loadFile = async () => {
    try {
      const engineOutput = Object.values(data)?.[0] as {
        files?: { fileName: string; content: string }[];
      };
      const files = engineOutput?.files;

      if (Array.isArray(files)) {
        const file = files.find((f) => f.fileName === fileName);
        setFileContent(file?.content || "");
      } else {
        console.warn("No files found");
      }
    } catch (e) {
      notification.add({
        color: "error",
        message: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveEngine = async () => {
    // turn on loading
    setIsLoading(true);

    try {
      const { errors } = await monolithStore.runQuery<[true]>(
        `SaveEngineAssets(engine=['${engineId}'], filePath=["/${fileName}"], content=["<encode>${fileContent}</encode>"])`
      );

      if (errors.length > 0) {
        throw new Error(errors.join(""));
      }

      notification.add({
        color: "success",
        message: "Successfully saved the changes!",
      });
      setReadOnly(true);
    } catch (e) {
      notification.add({
        color: "error",
        message: e.message,
      });
    } finally {
      // turn of loading
      setIsLoading(false);
    }
  };

  const runEngine = async () => {
    setIsLoading(true);

    try {
      const { errors, pixelReturn } = await monolithStore.runQuery<[true]>(
        `ExecuteTempPythonFunctionEngine(engine=['${engineId}'], map=[{"route":"", "file_path":"", "engine_id":""}])`
      );

      const { operationType, output } = pixelReturn[0];
      const result: any = output;

      if (operationType.includes("ERROR")) {
        throw new Error(result);
      }

      if (errors.length > 0) {
        throw new Error(errors.join(""));
      }

      setResultValue(result);

      notification.add({
        color: "success",
        message: "Successfully saved the changes!",
      });
    } catch (e: any) {
      notification.add({
        color: "error",
        message: e.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(fullPath);

      notification.add({
        color: "success",
        message: "Successfully copied path",
      });
    } catch (e) {
      notification.add({
        color: "error",
        message: "Unable to copy path",
      });
    }
  };

  return (
    <StyledWrapper>
      <StyledButtonGroup>
        <Stack direction="row" spacing={1}>
          {readOnly ? (
            <StyledButton
              onClick={() => setReadOnly(false)}
              variant="outlined"
              startIcon={<EditOutlined />}
              disabled={isLoading}
            >
              Edit
            </StyledButton>
          ) : (
            <StyledButton
              onClick={() => saveEngine()}
              variant="outlined"
              startIcon={<CheckRounded />}
              disabled={isLoading}
            >
              Save
            </StyledButton>
          )}
          <StyledRunButton
            onClick={() => {
              runEngine();
            }}
            variant="contained"
            startIcon={<PlayArrowRounded />}
          >
            Run
          </StyledRunButton>
        </Stack>
      </StyledButtonGroup>
      <StyledPaper elevation={1} readOnly={readOnly}>
        {!readOnly && <StyledBox>Edit Mode</StyledBox>}
        <StyledCopyIcon
          size={"small"}
          color={"default"}
          title={`Copy path - ${fullPath}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            copyPath();
          }}
        >
          <ContentCopyOutlined fontSize="inherit" />
        </StyledCopyIcon>
        <LoadingScreen>
          <Suspense
            fallback={<LoadingScreen.Trigger description="Loading..." />}
          >
            {isLoading ? (
              <LoadingScreen.Trigger description="Loading..." />
            ) : (
              <Editor
                height="500px"
                defaultLanguage="python"
                value={fileContent}
                onChange={(value) => setFileContent(value || "")}
                options={{
                  readOnly: readOnly,
                  fontSize: 14,
                  fontFamily: "monospace",
                  minimap: { enabled: false },
                }}
              />
            )}
          </Suspense>
        </LoadingScreen>
      </StyledPaper>
      <StyledResultsWrapper>
        <StyledInnerDiv>
          <StyledTypography variant="button">
            Results
          </StyledTypography>
          <StyledButton
            onClick={() => setResultValue("")}
            variant="outlined"
            startIcon={<CachedRounded />}
          >
            Clear
          </StyledButton>
        </StyledInnerDiv>
        <StyledDiv>
          <StyledTextArea
            fullWidth
            placeholder="Enter Input Here"
            minRows={2}
            maxRows={4}
            onChange={(e) => setResultValue(e.target.value)}
            value={resultValue}
          />
          <Typography variant="caption" color="secondary">
            If your code takes input, add it in the above box before running.
          </Typography>
        </StyledDiv>
      </StyledResultsWrapper>
    </StyledWrapper>
  );
};
