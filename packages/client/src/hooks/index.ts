import { useAPI } from "./use-api";
import { useAssistant } from "./use-assistant";
import { useAssistantStore } from "./use-assistant-store";
import { useAssistantStoreApi } from "./use-assistant-store-api";
import { useConfig } from "./use-config";
import { useDatabaseWorkbench } from "./use-database-workbench";
import { useModelChat } from "./use-model-chat";
import { usePage } from "./use-page";
import { useProject } from "./use-project";
import { useSession } from "./use-session";
import { useTabBarScroll } from "./use-tab-bar-scroll";
import { useDesigner } from "./useDesigner";
import { useEngine } from "./useEngine";
import { useMetamodel } from "./useMetamodel";
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
	useAssistant,
	useAssistantStore,
	useAssistantStoreApi,
	useConfig,
	useDatabaseWorkbench,
	useDesigner,
	useEngine,
	useMetamodel,
	useModelChat,
	usePage,
	useServerPagination,
	useSession,
	useSettings,
	useStepper,
	useTabBarScroll,
	useThemeLogo,
	useWorkspace,
	useProject,
};
