import React, { CSSProperties, useEffect } from "react";
import { observer } from "mobx-react-lite";

import { useBlock, useTypeWriter, useBlocks } from "../../../hooks";
import { BlockDef, BlockComponent } from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";

export interface TextBlockDef extends BlockDef<"text"> {
    widget: "text";
    data: {
        style: CSSProperties;
        text: string;
        variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
        isStreaming: boolean;
        show: string;
    };
    slots: never;
    listeners: {
        preProcess: true;
    };
}

export const TextBlock: BlockComponent = observer(({ id }) => {
    // const { attrs, data } = useBlock<TextBlockDef>(id);
    const block = useBlock<TextBlockDef>(id);
    const state = useBlocks();
    const { attrs, data, listeners } = block;

    const textContent =
        typeof data.text == "string" ? data.text : JSON.stringify(data.text);
    let displayTxt = useTypeWriter(data.isStreaming ? textContent : "");

    if (!data.isStreaming) displayTxt = textContent;

    useEffect(() => {
        if (listeners.preProcess) {
            listeners.preProcess();
        }
    }, []);

    // TODO: Why?
    return showBlock(block, state)
        ? React.createElement(
              data.variant ? data.variant : "p",
              {
                  style: { ...data.style },
                  ...attrs,
              },
              displayTxt,
          )
        : React.createElement("p", {
              style: { ...data.style },
              ["data-block"]: id,
          });
});
