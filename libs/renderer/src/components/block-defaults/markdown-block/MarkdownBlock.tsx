import { observer } from "mobx-react-lite";
import { type CSSProperties, ReactElement, useEffect, useMemo } from "react";
import { Markdown, LoadingScreen } from "@semoss/ui";
import { useBlock, useTypeWriter } from "../../../hooks";
import type { BlockComponent, BlockDef, ListenerActions } from "../../../store";
import { LoadingSkeleton } from "../../../assets/skeleton/LoadingSkeleton";

export interface MarkdownBlockDef extends BlockDef<"markdown"> {
	widget: "markdown";
	data: {
		style: CSSProperties;
		markdown: string;
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

export const MarkdownBlock: BlockComponent = observer(({ id }) => {
	const { attrs, data, listeners } = useBlock<MarkdownBlockDef>(id);
	const markdownTxt =
		typeof data.markdown == "string"
			? data.markdown
			: JSON.stringify(data.markdown);
	let displayTxt = useTypeWriter(data.isStreaming ? markdownTxt : "");

    if (!data.isStreaming) displayTxt = markdownTxt;

  const isLoading =
    data.hasOwnProperty("loading") &&
    data.loading?.toString().toLowerCase() === "true";

	useEffect(() => {
		if (listeners.preProcess) {
			listeners.preProcess();
		}
	}, []);
  
  const loadComponent = useMemo((): ReactElement => {
    if (data.loadSkeleton === "LoadingSkeleton") {
      return <LoadingSkeleton />;
    }
    return <LoadingScreen.Trigger />;
  }, [data.loadSkeleton]);

	return (
    <div
      style={{
        ...data.style,
      }}
      {...attrs}
    >
      <LoadingScreen relative>
        {isLoading ? (
          loadComponent
        ) : (
          <Markdown>{displayTxt}</Markdown>
        )}
      </LoadingScreen>
    </div>
  );
});
