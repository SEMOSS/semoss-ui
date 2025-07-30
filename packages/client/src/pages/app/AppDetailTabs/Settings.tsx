import {
  Box,
  Typography,
  Switch,
  TextField,
  Button,
  Chip,
  Grid,
  Icon,
  LoadingScreen,
  useNotification,
} from "@semoss/ui";
import LockIcon from "@mui/icons-material/Lock";
import JavaIcon from "@mui/icons-material/Coffee"; // Substitute for Java reactor icon
import { OpenInBrowser } from "@mui/icons-material";
import { usePixel, useRootStore, useSettings } from "@/hooks";
import { useEffect, useState } from "react";
import { styled, Table, FileDropzone } from "@semoss/ui";

import {
  Person,
  ToggleOff,
  Cached,
  PublishedWithChanges,
  InsertLink,
  Publish,
} from "@mui/icons-material";
import { Controller, useForm } from "react-hook-form";
import { Java } from "@/assets/img/Java";
import { LoadingScreenContext } from "@/components/ui/LoadingScreen/LoadingScreenContext";

const StyledTable = styled(Table)(({ theme }) => ({
  borderRadius: theme.spacing(1),
  borderColor: "#BDBDBD",
  borderStyle: "solid",
  borderCollapse: "initial",
  borderWidth: "thin",
}));

const StyledTypography = styled(Typography)(({ theme }) => ({
  display: "flex",
  borderRadius: "16px",
  border: `1px solid ${theme.palette.divider}`,
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  height: "70px",
  color: theme.palette.text.secondary,
}));

const StyledBox = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  width: "100%",
  mb: 2,
  gap: 4,
  flexWrap: "nowrap",
}));

const StyledContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  width: "100%",
}));

const StyledReactor = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  mb: 2,
  flexWrap: "wrap",
  gap: 2,
}));

const StyledPublishContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: 2,
  border: "1px solid #ddd",
  borderRadius: 2,
  p: 2,
  height: "136px",
}));

const StyledPublishInnerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  justifyContent: "space-between",
  gap: 2,
  border: "1px solid #ddd",
  borderRadius: 2,
  p: 2,
  height: "136px",
}));

const StyledPublishContent = styled(Typography)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  fontSize: "16px",
  gap: 1,
  mb: 0.5,
}));

const StyledPublishPortalContainer = styled(Box)(({ theme }) => ({
  gap: 2,
  border: "1px solid #ddd",
  borderRadius: 2,
  p: 2,
  height: "136px",
  width: "610px",
}));

const StyledPublishPortalInnerContainer = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 2, // spacing between texts and button
  flexWrap: "wrap", // optional, allows wrapping on smaller screens
  pb: 2,
}));

interface AppSettingsProps {
  id: string;

  condensed?: boolean;
}

type EditAppForm = {
  PROJECT_UPLOAD: File;
};

export const SettingsTab = (props: AppSettingsProps) => {
  const { id, condensed = false } = props;
  const { monolithStore, configStore } = useRootStore();
  const notification = useNotification();
  const { adminMode } = useSettings();
  const [isLoading, setIsLoading] = useState<any>(false);

  const { handleSubmit, control, reset, watch } = useForm<EditAppForm>({
    defaultValues: {
      PROJECT_UPLOAD: null,
    },
  });

  const uploadFile = watch("PROJECT_UPLOAD");

  const admin = configStore.store.user.admin;

  const [portalReactors, setPortalReactors] = useState<{
    reactors: string[];
    lastCompiled?: string;
    compiledBy?: string;
  }>({
    lastCompiled: "",
    reactors: [],
    compiledBy: "",
  });

  const [portalDetails, setPortalDetails] = useState<{
    url?: string;
    hasPortal?: boolean;
    // isPublished: boolean;
    project_has_portal: boolean;
    project_portal_url?: string;
    lastCompiled?: string;
    compiledBy?: string;
  }>({
    url: "",
    hasPortal: false,
    // isPublished: false,
    project_has_portal: false,
    project_portal_url: "",
    lastCompiled: "12/25/2022",
    compiledBy: "J.Smith",
  });

  const getPortalDetails = usePixel<{
    url?: string;
    hasPortal?: boolean;
    // isPublished: boolean;
    project_has_portal: boolean;
    project_portal_url?: string;
    lastCompiled?: string;
    compiledBy?: string;
  }>(
    adminMode
      ? `AdminGetProjectPortalDetails('${id}');`
      : `GetProjectPortalDetails('${id}');`
  );

  useEffect(() => {
    if (getPortalDetails.status !== "SUCCESS") {
      return;
    }

    // Set Details for Portal
    setPortalDetails({
      ...getPortalDetails.data,
    });

    // Get the portal reactors if we have a portal
    if (getPortalDetails.data.project_has_portal) {
      getPortalReactors();
    }
  }, [getPortalDetails.status, getPortalDetails.data]);

  /** LOADING */
  if (getPortalDetails.status !== "SUCCESS") {
    return (
      <LoadingScreen>
        <LoadingScreen.Trigger description="Loading..." />
      </LoadingScreen>
    );
  }

  /**
   * @name getPortalReactors
   */
  const getPortalReactors = () => {
    const pixelString = adminMode
      ? `AdminGetProjectAvailableReactors(project=['${id}']);`
      : `GetProjectAvailableReactors(project=['${id}']);`;

    monolithStore
      .runQuery(pixelString)
      .then((response) => {
        let output = undefined;
        let type = undefined;

        output = response.pixelReturn[0].output;
        type = response.pixelReturn[0].operationType[0];

        if (type.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });

          return;
        }

        setPortalReactors({
          ...portalReactors,
          reactors: output,
        });
      })
      .catch((error) => {
        notification.add({
          color: "error",
          message: error,
        });
      });
  };

  /**
   * @name recompileReactors
   */
  const recompileReactors = ({ release }) => {
    let pixelString;
    if (release == null) {
      pixelString = `ReloadInsightClasses(project='${id}');`;
    } else {
      pixelString = `ReloadInsightClasses(project='${id}', release=true);`;
    }

    monolithStore
      .runQuery(pixelString)
      .then((response) => {
        let output = undefined;
        let type = undefined;

        output = response.pixelReturn[0].output;
        type = response.pixelReturn[0].operationType[0];

        if (type.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });
          return;
        }

        if (release == null) {
          notification.add({
            color: "success",
            message: "Successfully recompiled",
          });
        } else {
          notification.add({
            color: "success",
            message: "Successfully redeployed",
          });
        }
      })
      .catch((error) => {
        notification.add({
          color: "error",
          message: error,
        });
      });
  };

  /**
   * @name publish
   * @desc Publishes Portal
   */
  const publish = () => {
    const pixelString = `PublishProject(project='${id}', release=true);`;

    monolithStore
      .runQuery(pixelString)
      .then((response) => {
        let output = undefined;
        let type = undefined;

        output = response.pixelReturn[0].output;
        type = response.pixelReturn[0].operationType[0];

        if (type.indexOf("ERROR") > -1) {
          notification.add({
            color: "error",
            message: output,
          });

          return;
        }

        setPortalDetails({
          ...portalDetails,
          project_portal_url: output,
        });

        notification.add({
          color: "success",
          message: "Successfully published",
        });
      })
      .catch((error) => {
        notification.add({
          color: "error",
          message: error,
        });
      });
  };

  /**
   * @name enablePublishing
   */
  const enablePublishing = () => {
    monolithStore
      .setProjectPortal(admin, id, !portalDetails.project_has_portal)
      .then((resp) => {
        if (resp.data) {
          setPortalDetails({
            ...portalDetails,
            project_has_portal: !portalDetails.project_has_portal,
          });

          notification.add({
            color: "success",
            message: `Successfully ${
              !portalDetails.project_has_portal ? "enabled" : "disabled"
            } portal`,
          });
        } else {
          notification.add({
            color: "error",
            message: `Unsuccessfully ${
              !portalDetails.project_has_portal ? "disabled" : "enabled"
            } portal`,
          });
        }
      })
      .catch((error) => {
        notification.add({
          color: "error",
          message: error,
        });
      });
  };

  /**
   * @name editApp
   */
  const editApp = handleSubmit(async (data: EditAppForm) => {
    // turn on loading
    setIsLoading(true);

    try {
      const path = "version/assets/";

      // unzip the file in the new app
      await monolithStore.runQuery(
        `DeleteAsset(filePath=["${path}"], space=["${id}"]);`
      );

      // upload the file
      const upload = await monolithStore.uploadFile(
        [data.PROJECT_UPLOAD],
        configStore.store.insightID,
        id,
        path
      );

      // upnzip the file in the new app
      await monolithStore.runQuery(
        `UnzipFile(filePath=["${`${path}${upload[0].fileName}`}"], space=["${id}"]);`
      );

      // Load the insight classes
      await monolithStore.runQuery(
        `ReloadInsightClasses(project='${id}', release=true);`
      );

      // set the app portal
      await monolithStore.setProjectPortal(false, id, true, "public");

      // Publish the app the insight classes
      await monolithStore.runQuery(
        `PublishProject(project='${id}', release=true);`
      );

      notification.add({
        color: "success",
        message: "Succesfully Updated Project",
      });

      reset();
    } catch (e) {
      console.error(e);

      notification.add({
        color: "error",
        message: e.message,
      });
    } finally {
      // turn of loading
      setIsLoading(false);
    }
  });
  return (
    <StyledContainer>
      {/* Access Section */}
      <Typography variant="h6" gutterBottom>
        Access
      </Typography>
      <Grid
        container
        spacing={3}
        sx={{
          mb: 4,
          width: "100%",
        }}
      >
        {/* First Column - 20% */}
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 2,
              height: "136px",
            }}
          >
            {/* Left Text Block */}
            <Box
              sx={{
                display: "flex",
                alignItems: "flex-start",
                gap: 1,
              }}
            >
              <LockIcon fontSize="small" sx={{ color: "#C4C4C4" }} />
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: "16px",
                    gap: 1,
                    mb: 0.5,
                  }}
                >
                  Publish
                </Typography>
                <Typography variant="body2" sx={{ fontSize: "14px" }}>
                  Enable the publishing of the portal
                </Typography>
              </Box>
            </Box>
            {/* Right-aligned Switch */}
            <Switch
              defaultChecked
              size="medium"
              checked={portalDetails.project_has_portal}
              value={portalDetails.project_has_portal}
              onChange={() => {
                enablePublishing();
              }}
              disabled={
                !configStore.isEngineOperationAvailable("APP", "access")
              }
            />
          </Box>
        </Grid>

        {/* Second Column - 80% */}
        <Grid item xs={12} md={7}>
          <Box
            sx={{
              gap: 2,
              border: "1px solid #ddd",
              borderRadius: 2,
              p: 2,
              height: "136px",
              width: '610px'
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2, // spacing between texts and button
                flexWrap: "wrap", // optional, allows wrapping on smaller screens
                pb: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                  Publish Portal
                </Typography>
                <Typography variant="body2">
                  Publish the portal to generate a shareable link
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="small"
                disabled={
                  !portalDetails.project_has_portal ||
                  !configStore.isEngineOperationAvailable("APP", "access")
                }
                onClick={() => {
                  publish();
                }}
              >
                Publish
              </Button>
            </Box>

            <TextField
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
              focused={false}
              label={"Link"}
              variant={"outlined"}
              value={
                portalDetails.project_has_portal
                  ? portalDetails.project_portal_url
                  : ""
              }
              InputProps={{
                startAdornment: <InsertLink />,
              }}
            >
              {portalDetails.project_has_portal
                ? portalDetails.project_portal_url
                : ""}
            </TextField>
          </Box>
        </Grid>
      </Grid>
      <hr color="#E6E6E6" style={{ marginTop: "24px", marginBottom: "24px" }} />
      {/* Reactors Section */}
      <StyledReactor>
        <Box>
          <Typography variant="h6" sx={{ fontSize: "20px" }}>
            Reactors
          </Typography>

          {portalReactors.reactors.length > 0 && (
            <Typography variant="body2" sx={{ fontSize: "14px" }}>
              Custom reactors created for the portal
            </Typography>
          )}
        </Box>

        {portalReactors.reactors.length > 0 && (
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button
              variant="outlined"
              sx={{ fontSize: "14px" }}
              onClick={() => {
                recompileReactors({ release: true });
              }}
            >
              Deploy and Persist Changes
            </Button>
            <Button
              variant="contained"
              sx={{ fontSize: "14px" }}
              onClick={() => {
                recompileReactors({ release: null });
              }}
            >
              Compile Changes On This Instance
            </Button>
          </Box>
        )}
      </StyledReactor>

      {portalReactors.reactors.length > 0 ? (
        <StyledTable>
          <Table.Body>
            {portalReactors.reactors.map((reactor, i) => (
              <Table.Row key={reactor + i}>
                <Table.Cell>{reactor}</Table.Cell>
                <Table.Cell align="right">
                  <Java />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </StyledTable>
      ) : (
        <StyledTypography variant="body2">No reactors found</StyledTypography>
      )}

      <hr color="#E6E6E6" style={{ marginTop: "24px", marginBottom: "24px" }} />

      {/* Update Project Section */}
      <StyledBox>
        {/* Left Content */}
        <Box sx={{ width: "619px" }}>
          {isLoading && (
            <LoadingScreen>
              <LoadingScreen.Trigger description="Loading..." />
            </LoadingScreen>
          )}
          <Typography variant="h6" sx={{ fontSize: "20px" }}>
            Update Project
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, fontSize: "14px" }}>
            The maximum file size we can handle is 5MB per CSV
          </Typography>
          <Button
            variant="contained"
            disabled={isLoading || !uploadFile}
            onClick={editApp}
          >
            Update
          </Button>
        </Box>

        {/* Right Upload Box */}
        <Box sx={{ width: "518px" }}>
          <Controller
            name={"PROJECT_UPLOAD"}
            control={control}
            rules={{}}
            disabled={
              !configStore.isEngineOperationAvailable("APP", "access") ||
              isLoading
            }
            render={({ field }) => (
              <FileDropzone
                multiple={false}
                value={field.value}
                disabled={
                  !configStore.isEngineOperationAvailable("APP", "access") ||
                  isLoading
                }
                onChange={(newValues) => field.onChange(newValues)}
              >
                <OpenInBrowser sx={{ fontSize: 32, color: "#1976d2", mb: 1 }} />
                <Typography
                  variant="body2"
                  sx={{
                    color: "#1976d2",
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Browse
                </Typography>
                <Typography variant="caption" sx={{ color: "#999" }}>
                  or drop file to upload
                </Typography>
              </FileDropzone>
            )}
          />
        </Box>
      </StyledBox>
    </StyledContainer>
  );
};
