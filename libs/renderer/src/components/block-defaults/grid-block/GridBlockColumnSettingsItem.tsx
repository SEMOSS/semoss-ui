import { observer } from "mobx-react-lite";
import { Delete } from "@mui/icons-material";

import { IconButton, List } from "@semoss/ui";

import { GridBlockDef } from "./GridBlock";
import { GridBlockColumn } from "./grid-block.types";
import { useBlockSettings } from "../../../hooks";

interface GridBlockColumnSettingsItemProps {
    /** Id of the block */
    id: string;

    /** Index of the column */
    column: GridBlockColumn;

    /** Index of the column */
    index: number;
}

export const GridBlockColumnSettingsItem = observer(
    ({ id, column, index }: GridBlockColumnSettingsItemProps) => {
        const { data, setData } = useBlockSettings<GridBlockDef>(id);

        return (
            <List.Item
                dense={true}
                divider
                secondaryAction={
                    <>
                        <IconButton
                            disabled={false}
                            size="small"
                            onClick={() => {
                                // get the columns except the current one
                                const columns = data.columns.filter(
                                    (v, idx) => index !== idx,
                                );

                                // update the data
                                setData("columns", columns);
                            }}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <Delete />
                        </IconButton>
                    </>
                }
            >
                <List.ItemText
                    primary={column.name}
                    secondary={column.selector}
                    primaryTypographyProps={{
                        title: column.name,
                        style: {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        },
                    }}
                    secondaryTypographyProps={{
                        title: column.selector,
                        style: {
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        },
                    }}
                />
            </List.Item>
        );
    },
);
