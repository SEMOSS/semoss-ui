import Tooltip from "@mui/material/Tooltip";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Breadcrumbs,
  Grid,
  Link,
  Search,
  Stack,
  styled,
  Tabs,
  Typography,
} from "@semoss/ui";
import { ModelForm } from "./ModelForm";
import { MODEL_CONNECTION } from "./model.constants";

const StyledContainer = styled("div")({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  width: "auto",
});

const StyledSearchbarContainer = styled("div")(({ theme }) => ({
  display: "flex",
  width: "100%",
  alignItems: "flex-start",
  gap: theme.spacing(3),
}));

const StyledStack = styled("div")(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
}));

const StyledCardImage = styled("img")<{ isModel?: boolean }>(
  ({ isModel }) => ({
    display: "flex",
    height: "30px",
    width: "30px",
    objectFit: "cover",
    borderRadius: isModel ? "8px" : "inherit",
  })
);

const StyledCardText = styled("p")({
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  margin: 0,
});

const StyledTypographyText = styled(Typography)(() => ({
  display: "flex",
  alignItems: "center",
  padding: "0 10px",
  backgroundColor: "#EBEBEB",
  borderRadius: "16px",
  marginLeft: "auto !important",
  fontSize: "13px",
  color: "#212121",
}));

const StyledFormTypeBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== "disabled",
})<{ disabled: boolean }>(({ disabled }) => ({
  maxWidth: "215px",
  borderRadius: "8px",
  display: "block",
  justifyContent: "center",
  alignItems: "center",
  border: "1px solid #C4C4C4",
  padding: "16px",
  backgroundColor: "#fff",
  opacity: disabled ? 0.6 : 1,
  cursor: disabled ? "auto" : "pointer",
  "&:hover": {
    border: disabled ? "1px solid #C4C4C4" : "1.5px solid #0471F0",
    backgroundColor: disabled ? "white" : "#F5F9FE",
  },
}));

const StyledTab = styled(Tabs.Item)(() => ({
  fontSize: "14px",
  fontWeight: 500,
  letterSpacing: "0.4px",
  color: "rgba(0, 0, 0, 0.60)",
}));

interface Model {
  fields: [];
  id: number;
  name: string;
  icon: string;
  disable: boolean;
}

const ModelCard = ({
  model,
  onSelect,
}: {
  model: Model;
  onSelect: () => void;
}) => {
  const textRef = useRef<HTMLParagraphElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      setIsTruncated(textRef.current.scrollWidth > textRef.current.clientWidth);
    }
  }, []);

  const cardContent = (
    <StyledFormTypeBox
      data-testid={`model-card-${model.id}`}
      disabled={model.disable}
      onClick={!model.disable ? onSelect : undefined}
    >
        {model.disable ? (
          <Stack direction="row" width="100%" spacing={1}>
            <StyledCardImage isModel src={model.icon} />
            <StyledTypographyText variant="body1">
              Coming Soon
            </StyledTypographyText>
          </Stack>
        ) : (
          <StyledCardImage isModel src={model.icon} />
        )}
        <StyledCardText ref={textRef} data-testid={`model-name-${model.id}`}>
          {model.name}
        </StyledCardText>
    </StyledFormTypeBox>
  );

  return isTruncated ? (
    <Tooltip title={model.name} placement="bottom" arrow>
      <span style={{ display: "block" }}>{cardContent}</span>
    </Tooltip>
  ) : (
    cardContent
  );
};

export const ModelPageContent: React.FC<{ name: string }> = ({ name }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  const ModelOptions = MODEL_CONNECTION.MODEL;

  const pageTitle = "Connect to Model";
  const pageDescription =
    "In an era fueled by information, the seamless interlinking of various databases stands as a cornerstone for unlocking the untapped potential of LLM applications.";

    const flattenCommerciallyHosted = (data: object[]) => {
  if (!data || !data.length) return [];
  const providers = data[0]; 
  return Object.values(providers).flat();
};

  const tabLabels = useMemo(() => ["All", "Commercially Hosted",  "Locally Hosted", "Embedded","File Uploads",], []);
  const allModels = useMemo(() => {
    return [
      ...flattenCommerciallyHosted(ModelOptions["Commercially Hosted"] || []),
        ...(ModelOptions["Locally Hosted"] || []), 
        ...(ModelOptions["Embedded"] || []),
      ...(ModelOptions["File Uploads"] || []),
    ];
  }, [ModelOptions]);


const modelsForTab = useMemo(() => {
  const label = tabLabels[selectedTab];

  if (label === "All") return allModels;
  if (label === "Commercially Hosted") {
    return flattenCommerciallyHosted(ModelOptions["Commercially Hosted"]);
  }

  return ModelOptions[label] || [];
}, [selectedTab, tabLabels, ModelOptions, allModels]);

  const renderBreadcrumbs = () => (
    <Breadcrumbs separator="/" data-testid="breadcrumbs">
      <Breadcrumbs.Item
        // @ts-expect-error TODO FIX
        as={Link}
        underline="none"
        color="inherit"
        variant="body1"
        onClick={() =>
          window.history.length > 1 ? navigate(-1) : navigate("/")
        }
        data-testid="breadcrumb-catalog"
      >
        {name} Catalog
      </Breadcrumbs.Item>

      <Breadcrumbs.Item
        // @ts-expect-error TODO FIX
        as={Link}
        underline="none"
        color={selectedModel ? "inherit" : "text.disabled"}
        variant="body1"
        onClick={() => {
          if (selectedModel) {
            setSelectedModel(null);
          }
        }}
        sx={{ cursor: selectedModel ? "pointer" : "default" }}
        data-testid="breadcrumb-page"
      >
        Connect to Model Database
      </Breadcrumbs.Item>

      {selectedModel && (
        <Breadcrumbs.Item
          // @ts-expect-error TODO FIX
          as={Link}
          underline="none"
          color="text.disabled"
          variant="body1"
          data-testid="breadcrumb-selected-model"
        >
          {selectedModel.name}
        </Breadcrumbs.Item>
      )}
    </Breadcrumbs>
  );

  const renderModelGrid = (models: Model[]) => (
    <Grid
      container
      columns={6}
      columnSpacing={2}
      rowSpacing={2}
      data-testid="model-grid"
    >
      {models
        .filter((v) => v.name?.toLowerCase().includes(search?.toLowerCase()))
        .map((v) => (
          <Grid key={v.id} item lg={1} md={1} xs={1} xl={1} sm={1}>
            <ModelCard model={v} onSelect={() => setSelectedModel(v)} />
          </Grid>
        ))}
    </Grid>
  );

  return (
    <>
      {renderBreadcrumbs()}

      {selectedModel ? (
        <div data-testid="model-form-wrapper">
          <ModelForm
            id={selectedModel.id}
            title={selectedModel.name}
            description={`Fill out ${name} details in order to add model to catalog`}
            fields={selectedModel.fields}
          />
        </div>
      ) : (
        <Stack direction="column" gap={2} data-testid="model-page">
          <StyledStack>
            <Typography
              variant="h4"
              sx={{ fontWeight: 500 }}
              data-testid="page-title"
            >
              {pageTitle}
            </Typography>
            <Typography
              variant="body1"
              color="secondary"
              data-testid="page-description"
            >
              {pageDescription}
            </Typography>
          </StyledStack>

          <StyledContainer>
            <StyledSearchbarContainer>
              <Search
                size="small"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                data-testid="search-box"
              />
            </StyledSearchbarContainer>

            <Box sx={{ width: "100%" }}>
              <Tabs
                value={selectedTab}
                onChange={(_, newValue) => setSelectedTab(newValue)}
                variant="scrollable"
                sx={{
                  mt: 2,
                  borderBottom: "2px solid #E0E0E0",
                }}
                data-testid="tabs"
              >
                {tabLabels.map((label) => (
                  <StyledTab
                    key={label}
                    label={label}
                    data-testid={`tab-${label.toLowerCase()}`}
                  />
                ))}
              </Tabs>
              <Box sx={{ mt: 4 }}>{renderModelGrid(modelsForTab)}</Box>
            </Box>
          </StyledContainer>
        </Stack>
      )}
    </>
  );
};
