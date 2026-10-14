import { createContext } from "react";
import type { StreamingCodeFence } from "./utils/streaming-code";

/** The unfinished fence in the displayed text; adapters retain their identity. */
export const StreamingMarkdownContext =
	createContext<StreamingCodeFence | null>(null);
