import { TableChart } from "@mui/icons-material";

import { Autocomplete, Stack, TextField } from "@semoss/ui";

import { BLOCK_TYPE_DATA } from "../block-defaults.constants";
import { BlockComponent, BlockConfig } from "../../../store";
import { useBlock, useBlockSettings, useBlocksPixel } from "../../../hooks";
import {
    GridDynamicFrameBlockDef,
    GridDynamicFrameBlock,
} from "./GridDynamicFrameBlock";

const DynamicGridMenu: BlockComponent = ({ id }) => {
    const { data, setData } = useBlockSettings<GridDynamicFrameBlockDef>(id);
    // get all of the frames
    const getFrames = useBlocksPixel<string[]>("GetFrames();", {
        data: [],
    });

    // options for the autocomplete
    const options = getFrames.status === "SUCCESS" ? getFrames.data : [];

    return (
        <Stack>
            <Autocomplete
                fullWidth
                multiple={false}
                disabled={getFrames.status !== "SUCCESS"}
                value={data.frame.name}
                options={options}
                getOptionLabel={(option) => {
                    return option;
                }}
                onChange={(_, value) => {
                    // update the frame
                    setData("frame.name", value);
                }}
                freeSolo={false}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        placeholder="Select frame"
                        size="small"
                        variant="outlined"
                    />
                )}
            />
        </Stack>
    );
};

// export the config for the block
export const config: BlockConfig<GridDynamicFrameBlockDef> = {
    widget: "grid-dynamic-frame",
    type: BLOCK_TYPE_DATA,
    data: {
        frame: {
            name: "",
        },
        show: true,
    },

    listeners: {},
    slots: {},
    render: GridDynamicFrameBlock,
    icon: TableChart,
    menu: DynamicGridMenu,
};
