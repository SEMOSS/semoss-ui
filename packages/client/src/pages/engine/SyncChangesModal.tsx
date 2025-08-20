import React, { useState, useMemo } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
  Stack,
  Typography,
  Divider,
  Modal,
  styled,
} from "@semoss/ui";

const StyledModalPaper = styled(Modal)({
  "& .MuiDialog-paper": {
    width: "600px",
    height: "760px",
  },
});
const ScrollContainer = styled("div")({
  border: "1px solid #ccc",
  borderRadius: 4,
  paddingLeft: "20px",
  paddingRight: "20px",
  height: "440px",
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
});
const StyledFormControlLabel = styled(FormControlLabel)({
  marginLeft: 0,
  marginRight: 0,
  marginTop: 0,
  "& .MuiFormControlLabel-label": {
    fontSize: "12px",
  },
  "& .MuiTypography-root": {
    fontSize: "12px",
  },
  "& .MuiFormControlLabel-root": {
    margin: "0px",
  },
  "& .MuiButtonBase-root": {
    padding: "5px",
  },
});
const StickyLabel = styled("div")`
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
`;
interface SyncChangesModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (selectedTables: string[], selectedViews: string[]) => void;
  tables: string[];
  views: string[];
}

export const SyncChangesModal: React.FC<SyncChangesModalProps> = ({
  open,
  onClose,
  onApply,
  tables,
  views,
}) => {
  const [tableSearch, setTableSearch] = useState("");
  const [viewSearch, setViewSearch] = useState("");
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedViews, setSelectedViews] = useState<string[]>([]);

  const toggleSelection = (
    id: string,
    list: string[],
    setter: (val: string[]) => void
  ) => {
    if (list.includes(id)) {
      setter(list.filter((i) => i !== id));
    } else {
      setter([...list, id]);
    }
  };

  const filteredTables = useMemo(
    () =>
      tables.filter((t) => t.toLowerCase().includes(tableSearch.toLowerCase())),
    [tables, tableSearch]
  );

  const filteredViews = useMemo(
    () =>
      views.filter((v) => v.toLowerCase().includes(viewSearch.toLowerCase())),
    [views, viewSearch]
  );

  const allTablesSelected = selectedTables.length === tables.length;
  const allViewsSelected = selectedViews.length === views.length;

  return (
    <StyledModalPaper
      data-testid="sync-changes-modal"
      open={open}
      onClose={onClose}
      maxWidth={"sm"}
      fullWidth
    >
      <Modal.Title>Sync Changes</Modal.Title>
      <Modal.Content>
        <Typography variant="caption">
          Select tables and views below to sync with external database changes.
          <br />
          <b>Note:</b> any local changes made to selected table and view
          properties will be overwritten by sync.
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Stack direction="row" spacing={2}>
          {/* Tables */}
          <Stack flex={1} spacing={1}>
            <Typography variant="subtitle2">Select Tables:</Typography>
            <TextField
              data-testid="table-search-input"
              placeholder="Search..."
              size="small"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
            />
            <ScrollContainer>
              {[
                { id: "select-all", label: "(Select all)" },
                ...filteredTables.map((t) => ({
                  id: t,
                  label: t,
                })),
              ].map((item, index) => {
                const checkboxLabel = (
                  <StyledFormControlLabel
                    key={item.id}
                    data-testid={
                      item.id === "select-all"
                        ? "select-all-tables-checkbox"
                        : `table-checkbox-${index}`
                    }
                    control={
                      <Checkbox
                        checked={
                          item.id === "select-all"
                            ? allTablesSelected
                            : selectedTables.includes(item.id)
                        }
                        onChange={() =>
                          item.id === "select-all"
                            ? setSelectedTables(allTablesSelected ? [] : tables)
                            : toggleSelection(
                                item.id,
                                selectedTables,
                                setSelectedTables
                              )
                        }
                      />
                    }
                    label={item.label}
                  />
                );

                return item.id === "select-all" ? (
                  <StickyLabel key="select-all-tables-sticky">
                    {checkboxLabel}
                  </StickyLabel>
                ) : (
                  checkboxLabel
                );
              })}
            </ScrollContainer>
          </Stack>
          {/* Views */}
          <Stack flex={1} spacing={1}>
            <Typography variant="subtitle2">Select Views:</Typography>
            <TextField
              data-testid="view-search-input"
              placeholder="Search..."
              size="small"
              value={viewSearch}
              onChange={(e) => setViewSearch(e.target.value)}
            />
            <ScrollContainer>
              {[
                { id: "select-all", label: "(Select all)" },
                ...filteredViews.map((v) => ({
                  id: v,
                  label: v,
                })),
              ].map((item, index) => {
                const checkboxLabel = (
                  <StyledFormControlLabel
                    key={item.id}
                    data-testid={
                      item.id === "select-all"
                        ? "select-all-views-checkbox"
                        : `view-checkbox-${index}`
                    }
                    control={
                      <Checkbox
                        checked={
                          item.id === "select-all"
                            ? allViewsSelected
                            : selectedViews.includes(item.id)
                        }
                        onChange={() =>
                          item.id === "select-all"
                            ? setSelectedViews(allViewsSelected ? [] : views)
                            : toggleSelection(
                                item.id,
                                selectedViews,
                                setSelectedViews
                              )
                        }
                      />
                    }
                    label={item.label}
                  />
                );
                return item.id === "select-all" ? (
                  <StickyLabel key="select-all-sticky">
                    {checkboxLabel}
                  </StickyLabel>
                ) : (
                  checkboxLabel
                );
              })}
            </ScrollContainer>
          </Stack>
        </Stack>
      </Modal.Content>
      <Modal.Actions>
        <Button onClick={onClose} variant="text" data-testid="cancel-button">
          Cancel
        </Button>
        <Button
          data-testid="apply-button"
          onClick={() => onApply(selectedTables, selectedViews)}
          disabled={selectedTables.length === 0 && selectedViews.length === 0}
          variant="contained"
        >
          Apply
        </Button>
      </Modal.Actions>
    </StyledModalPaper>
  );
};
