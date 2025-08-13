import { HighlightAlt } from "@mui/icons-material";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";
import { ContainerLayoutSettings, InputSettings } from "../../settings";
import {
  buildSpacingSection,
  buildDimensionsSection,
  buildBorderSection,
  buildColorSection,
  buildListener,
  buildShowField,
  buildShadowSection,
} from "../block-defaults.shared";
import { SelectInputSettings } from "../../settings/shared/SelectInputSettings";
import { SizeSettings } from "../../settings/shared/SizeSettings";
import { BlockSettingsConfig } from "../settings.types";
import React, { useEffect, useMemo, useState } from "react";
import { useBlock, TabBlockDef } from "@semoss/renderer";
import { FormControl, MenuItem, Select, styled, TextField } from "@semoss/ui";
import { observer } from "mobx-react-lite";



const TabLabelContainer = styled("div")(({ theme }) => ({
  display: " flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

const TabSelectorWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2),
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: "100%",
  marginBottom: theme.spacing(2),
}));

interface TabLabelSettingsProps {
  id: string;
}
interface TabLengthSettingProps {
  id: string;
}

export const TabLabelSettings = observer(({ id }: TabLabelSettingsProps) => {
  const { setData, data } = useBlock<any>(id);
  const tabLength = Math.max(data.tabLength || 1, 1);
  const [selectedTab, setSelectedTab] = React.useState(0);

  const syncTabLabelsWithLength = (
    labels: string[],
    tabLength: number
  ): string[] => {
    let newLabels = [...labels];
    let changed = false;

    for (let i = 0; i < tabLength; i++) {
      if (!newLabels[i]) {
        newLabels[i] = `Tab ${i + 1}`;
        changed = true;
      }
    }

    if (newLabels.length > tabLength) {
      newLabels = newLabels.slice(0, tabLength);
      changed = true;
    }

    return changed ? newLabels : labels;
  };

  useEffect(() => {
    const updatedLabels = syncTabLabelsWithLength(data.labels ?? [], tabLength);
    if (updatedLabels !== data.labels) {
      setData("labels", updatedLabels);
    }
  }, [tabLength]);

  const labels = useMemo(() => {
    return Array.from({ length: tabLength }, (_, i) => `Tab ${i + 1}`);
  }, [data]);

  return (
    <TabLabelContainer>
      <TabSelectorWrapper>
        <StyledFormControl size="small">
          <Select
            data-test-id="tab-selector-label"
            value={selectedTab}
            onChange={(e) => setSelectedTab(Number(e.target.value))}
            label="Select Tab"
          >
            {Array.from({ length: tabLength }).map((_, idx) => (
              <MenuItem
                sx={{ overflow: "auto", maxHeight: "100px" }}
                key={idx}
                value={idx}
              >
                {labels[idx] || `Tab ${idx + 1}`}
              </MenuItem>
            ))}
          </Select>
        </StyledFormControl>
      </TabSelectorWrapper>
      <InputSettings
        id={id}
        path={`labels.${selectedTab}`}
        label={`Tab ${selectedTab + 1} Label`}
      />
    </TabLabelContainer>
  );
});



const TabLengthSetting = ({ id }: TabLengthSettingProps) => {
  const { data, setData } = useBlock<TabBlockDef>(id);
  const [length, setLength] = React.useState(data.tabLength || 1);
  const [error, setError] = useState<string>("");

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      let newLength = Number(e.target.value);

      if (isNaN(newLength) || newLength <= 0) {
        setError("Tab length must be at least 1");
        setLength(data.tabLength);
        return;
      }

      if (newLength > 20) {
        setError("Tab length cannot exceed 20");
        setLength(data.tabLength); 
        return;
      }

      setError(""); 

      const currentLabels = data.labels ?? [];
      const updatedLabels = [...currentLabels];

      for (let i = 0; i < newLength; i++) {
        if (!updatedLabels[i]) {
          updatedLabels[i] = `Tab - ${i + 1}`;
        }
      }

      updatedLabels.length = newLength;

      setData("tabLength", newLength, true);
      setData("labels", updatedLabels, true);
      setLength(newLength);
    };

    return (
      <TextField
        type="number"
        value={length}
        onChange={(e) => setLength(Number(e.target.value))}
        onBlur={handleBlur}
        label="Tab Length"
        fullWidth
        error={!!error}
        helperText={error}
        inputProps={{ min: 1, max: 20 }}
      />
  );
};

// export the config for the block
export const config: BlockSettingsConfig = {
  type: BLOCK_TYPE_LAYOUT,
  icon: HighlightAlt,
  contentMenu: [
    {
      name: "Tab Length",
      children: [{ description: "Number of Tabs", render: TabLengthSetting }],
    },
    {
      name: "Tab Labels",
      children: [
        {
          description: "Tab Label",
          render: (props: { id: string }) => <TabLabelSettings id={props.id} />,
        },
      ],
    },
    {
      name: "Conditional",
      children: [...buildShowField()],
    },
    {
      name: "Pre Process",
      children: [...buildListener("preProcess")],
    },
    {
      name: "On Change",
      children: [...buildListener("onChange")],
    },
  ],
  styleMenu: [
    {
      name: "Layout",
      children: [
        {
          description: "Layout",
          render: ({ id }) => <ContainerLayoutSettings id={id} />,
        },
      ],
    },
    {
      name: "Position",
      children: [
        {
          description: "Position",
          render: ({ id }) => (
            <SelectInputSettings
              id={id}
              path="style.position"
              label="Position"
              options={[
                { value: "static", display: "Static" },
                { value: "relative", display: "Relative" },
                { value: "absolute", display: "Absolute" },
                { value: "fixed", display: "Fixed" },
                { value: "sticky", display: "Sticky" },
              ]}
            />
          ),
        },
        {
          description: "Top",
          render: ({ id }) => (
            <SizeSettings id={id} label="Top" path="style.top" />
          ),
        },
        {
          description: "Z-Index",
          render: ({ id }) => (
            <SizeSettings id={id} label="Z-Index" path="style.zIndex" />
          ),
        },
        {
          description: "Overflow",
          render: ({ id }) => (
            <SelectInputSettings
              id={id}
              path="style.overflow"
              label="Overflow"
              options={[
                { value: "visible", display: "Visible" },
                { value: "hidden", display: "Hidden" },
                { value: "scroll", display: "Scroll" },
                {
                  value: "auto",
                  display: "Auto",
                  isDefault: true,
                },
              ]}
            />
          ),
        },
      ],
    },
    buildSpacingSection(),
    buildDimensionsSection(),
    buildColorSection(),
    buildBorderSection(),
    buildShadowSection(),
  ],
};
