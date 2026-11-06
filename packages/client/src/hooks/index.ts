import { useAPI } from "./use-api";
import { useAssistantStore } from "./use-assistant-store";
import { useConfig } from "./use-config";
import { useDatabaseWorkbench } from "./use-database-workbench";
import { useModelChat } from "./use-model-chat";
import { usePage } from "./use-page";
import { useProject } from "./use-project";
import { useSession } from "./use-session";
import { useAdminMode } from "./useAdminMode";
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
	useAdminMode,
	useAPI,
	useAssistantStore,
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
	useThemeLogo,
	useWorkspace,
	useProject,
};
