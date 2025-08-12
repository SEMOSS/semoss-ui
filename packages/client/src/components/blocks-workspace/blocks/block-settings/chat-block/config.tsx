// import { BlockConfig } from "../../../store";
import { ChatBubbleOutline } from "@mui/icons-material";

import { buildListener } from "../block-defaults.shared";
import { BLOCK_TYPE_LAYOUT } from "../block-defaults.constants";

// import { ChatBlockDef, ChatBlock } from "./ChatBlock";
import { InputSettings, QuerySelectionSettings } from "../../settings";
import type { BlockSettingsConfig } from "../settings.types";

// export the config for the block
export const config: BlockSettingsConfig = {
    type: BLOCK_TYPE_LAYOUT,
    icon: ChatBubbleOutline,
    contentMenu: [
        {
            name: "General",
            children: [
                {
                    description: "Loading",
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="Loading"
                            path="loading"
                            queryPath="isLoading"
                        />
                    ),
                },
                {
                    description: "Ask",
                    render: ({ id }) => (
                        <InputSettings id={id} label="Ask" path="ask" />
                    ),
                },
                {
                    description: "History",
                    render: ({ id }) => (
                        <QuerySelectionSettings
                            id={id}
                            label="History"
                            path="history"
                            queryPath="output"
                        />
                    ),
                },
            ],
        },
        {
            name: "on Load",
            children: [...buildListener("onLoad")],
        },
        {
            name: "on Ask",
            children: [...buildListener("onAsk")],
        },
    ],
    styleMenu: [],
};

export default config;