import { createElement } from "react";
import { observer } from "mobx-react-lite";

import { useBlocks } from "../../hooks";

export interface RendererEngineProps {
    /** Id of the block */
    id: string;
}

export function showBlock(block, state): boolean {
    if (block.data.hasOwnProperty("show") && block.data.show !== undefined) {
        let condition: unknown;
        const trimmedBlockData = block.data.show
            ?.toString()
            ?.trimLeft()
            ?.trimRight();
        const trimmedBlockDataArray =
            trimmedBlockData?.split(" ").filter((item) => item.length > 0) ||
            [];
        let trimmedBlockDataObject = {};
        trimmedBlockDataArray.forEach((item) => {
            trimmedBlockDataObject = {
                ...trimmedBlockDataObject,
                [item]: false,
            };
        });
        trimmedBlockDataArray.forEach((item, index) => {
            const trimmedBlockDataToVerify = item;
            try {
                //if a variable is assigned then parsed result is added to condition
                if (
                    trimmedBlockDataToVerify.startsWith("{{") &&
                    trimmedBlockDataToVerify.endsWith("}}")
                ) {
                    condition = state.parseVariable(
                        trimmedBlockDataToVerify?.toString(),
                    );
                } else {
                    condition = trimmedBlockDataToVerify; //direct value is passed if no variable is added
                }
                if (
                    condition !== undefined &&
                    condition !== null &&
                    condition !== ""
                ) {
                    if (condition.toString() === undefined) {
                        trimmedBlockDataObject[item] = false;
                    }
                    // console.log("Condition", condition.toString());
                    switch (condition.toString().toLowerCase()) {
                        case "true":
                        case "1":
                            trimmedBlockDataObject[item] = true;
                            break;
                        case "false":
                        case "0":
                            trimmedBlockDataObject[item] = false;
                            break;
                        default:
                            trimmedBlockDataObject[item] = false;
                    }
                } else {
                    // render the generic view of a block if data.show is undefined or false
                    trimmedBlockDataObject[item] = false;
                }
            } catch (e) {
                trimmedBlockDataObject[item] = true;
            }
        });
        const resultValues = Object.values(trimmedBlockDataObject).includes(
            false,
        )
            ? false
            : true;
        return resultValues;
    }
    //render the block directly if there is no show property for a block
    return true;
}
/**
 * Render a block
 */

/**
 * TODO: Rename possibly BlockElement
 */
export const RendererEngine = observer(
    ({ id }: RendererEngineProps): JSX.Element => {
        // get the store and mode
        const { state, registry } = useBlocks();

        // get the block
        const block = state.getBlock(id);

        // get block
        if (!block) {
            return null;
        }

        // get the widget
        const b = registry[block.widget];

        if (!b) {
            throw Error(
                `Widget ${block.widget} for block ${id} is not registered`,
            );
        }

        if (showBlock(block, state)) {
            return createElement(b.render, {
                key: id,
                id: id,
            });
        }

        return createElement("div", {
            key: id,
            id: id,
            ["data-block"]: id,
        });
    },
);
