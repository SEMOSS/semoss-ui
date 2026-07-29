import { useAPI } from "./use-api";
import { useIteratorApi } from "./use-iterator-api";
import { usePixel } from "./use-pixel";
import { useProject } from "./use-project";
import { useTabBarScroll } from "./use-tab-bar-scroll";
import { useAdminMode } from "./useAdminMode";
import { useCacheState } from "./useCacheState";
import { useDesigner } from "./useDesigner";
import { useEngine } from "./useEngine";
import { useLLM } from "./useLLM";
import { useMetamodel } from "./useMetamodel";
import { usePage } from "./usePage";
import { useRootStore } from "./useRootStore";
import { useServerPagination } from "./useServerPagination";
import { useSettings } from "./useSettings";
import { useStepper } from "./useStepper";
import { useThemeLogo } from "./useThemeLogo";
import { useWorkspace } from "./useWorkspace";

// NOTE: Do not export `useBlockSettings` from this barrel.
// Keep it as a direct import (`@/hooks/useBlockSettings`) to avoid pulling
// block/renderer dependencies into the broad `@/hooks` import graph, which
// increases production bundle size.
export {
	useAdminMode,
	useAPI,
	useCacheState,
	useDesigner,
	useEngine,
	useIteratorApi,
	useLLM,
	useMetamodel,
	usePage,
	usePixel,
	useRootStore,
	useServerPagination,
	useSettings,
	useStepper,
	useTabBarScroll,
	useThemeLogo,
	useWorkspace,
	useProject,
};
