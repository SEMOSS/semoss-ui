import { WorkbenchProvider } from "@semoss/workbench";
import type {
	CatalogItem,
	DesktopInstanceProfile,
	InstanceConfig,
} from "@/types";
import { DATABASE_WORKBENCH_COMPONENTS } from "./database-workbench-dock";
import { DatabaseWorkbenchRuntime } from "./database-workbench-runtime";

interface DatabaseWorkbenchViewProps {
	item: CatalogItem;
	profile: DesktopInstanceProfile;
	config: InstanceConfig;
}

export const DatabaseWorkbenchView = ({ item }: DatabaseWorkbenchViewProps) => (
	<WorkbenchProvider key={item.id} components={DATABASE_WORKBENCH_COMPONENTS}>
		<DatabaseWorkbenchRuntime item={item} />
	</WorkbenchProvider>
);
