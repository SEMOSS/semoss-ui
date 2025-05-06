import { BlockComponent } from "../../../store";
import { Stack } from "@semoss/ui";
import { AIGenerationSettings, CodeEditorSettings } from "../../block-settings";
import { useBlock } from "../../../hooks";

export const MermaidBlockMenu: BlockComponent = ({ id }) => {
    const { data } = useBlock(id);
    return (
        <Stack padding={2} height="100%">
            <CodeEditorSettings id={id} path="text" />
        </Stack>
    );
};
