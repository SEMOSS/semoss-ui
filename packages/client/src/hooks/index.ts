import { useQueryResults } from "./use-database-query-results";
import { usePixel } from "./use-pixel";
import { useTabBarScroll } from "./use-tab-bar-scroll";
import { useAPI } from "./useAPI";
import { useCacheState } from "./useCacheState";
import { useQueryEditor } from "./useDatabaseQueryEditor";
import { useQueryExecution } from "./useDatabaseQueryExecution";
import { useDatabaseStructure } from "./useDatabaseStructure";
import { useDesigner } from "./useDesigner";
import { useEngine } from "./useEngine";
import { useLLM } from "./useLLM";
import { useMetamodel } from "./useMetamodel";
import { usePage } from "./usePage";
import { useRootStore } from "./useRootStore";
import { useServerPagination } from "./useServerPagination";
import { useSettings } from "./useSettings";
import { useStepper } from "./useStepper";
import { useWorkspace } from "./useWorkspace";

// NOTE: Do not export `useBlockSettings` from this barrel.
// Keep it as a direct import (`@/hooks/useBlockSettings`) to avoid pulling
// block/renderer dependencies into the broad `@/hooks` import graph, which
// increases production bundle size.
export {
	useAPI,
	useCacheState,
	useDatabaseStructure,
	useDesigner,
	useEngine,
	useLLM,
	useMetamodel,
	usePage,
	usePixel,
	useQueryEditor,
	useQueryExecution,
	useQueryResults,
	useRootStore,
	useServerPagination,
	useSettings,
	useStepper,
	useTabBarScroll,
	useWorkspace,
};
