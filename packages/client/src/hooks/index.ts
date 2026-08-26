import { useAPI } from "./use-api";
import { useDatabaseWorkbench } from "./use-database-workbench";
import { usePixel } from "./use-pixel";
import { useProject } from "./use-project";
import { useTabBarScroll } from "./use-tab-bar-scroll";
import { useWorkbench } from "./use-workbench";
import { useWorkbenchCommands } from "./use-workbench-commands";
import { useWorkbenchStoreApi } from "./use-workbench-store-api";
import { useDesigner } from "./useDesigner";
import { useEngine } from "./useEngine";
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
	useAPI,
	useDatabaseWorkbench,
	useDesigner,
	useEngine,
	useMetamodel,
	usePage,
	usePixel,
	useRootStore,
	useServerPagination,
	useSettings,
	useStepper,
	useTabBarScroll,
	useThemeLogo,
	useWorkbench,
	useWorkbenchCommands,
	useWorkbenchStoreApi,
	useWorkspace,
	useProject,
};
