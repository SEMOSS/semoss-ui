import { observer } from "mobx-react-lite";
import React, { type CSSProperties, useEffect, useMemo } from "react";
import { LoadingScreen } from "@semoss/ui";
import { useBlock, useBlocks, useTypeWriter } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { showBlock } from "../../blocks/RendererEngine";
import { LoadingSkeleton } from "../../../assets/skeleton/LoadingSkeleton";

export interface TextBlockDef extends BlockDef<"text"> {
  widget: "text";
  data: {
    style: CSSProperties;
    text: string;
    variant?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p" | "span";
    isStreaming: boolean;
    show: string;
    loading: boolean | string;
    loadSkeleton: string;
  };
  slots: never;
  listeners: {
    preProcess: {
      type: "sync" | "async";
      order: ListenerActions[];
    };
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

  const isLoading =
    data.hasOwnProperty("loading") &&
    data.loading?.toString().toLowerCase() === "true";

  /**
   * Returns a loading screen component based on the `loadSkeleton` property.
   * If `loadSkeleton` is set to "LoadingSkeleton", it returns a `LoadingScreen`
   * containing a `LoadingSkeleton`. Otherwise, it returns a `LoadingScreen`
   * with a `LoadingScreen.Trigger`.
   */

  const loadComponent = useMemo(() => {
    if (data?.loadSkeleton && data?.loadSkeleton === "LoadingSkeleton") {
      return <LoadingSkeleton />;
    }
    return <LoadingScreen.Trigger />;
  }, [data.loadSkeleton]);
  // If the block is loading, return the loading children
  // Otherwise, render the block with the text content
  if (isLoading)
    return <LoadingScreen relative>{loadComponent}</LoadingScreen>;

  // TODO: Why?
  return showBlock(block, state)
    ? React.createElement(
        data.variant ? data.variant : "p",
        {
          style: {
            ...data.style,
            ...(data.variant === "h1" ? { lineHeight: "116.7%" } : {}),
            marginBlockStart: "0px",
            marginBlockEnd: "0px",
          },
          ...attrs,
        },
        displayTxt
      )
    : React.createElement("p", {
        style: {
          ...data.style,
          marginBlockStart: "0px",
          marginBlockEnd: "0px",
        },
        ["data-block"]: id,
      });
});
