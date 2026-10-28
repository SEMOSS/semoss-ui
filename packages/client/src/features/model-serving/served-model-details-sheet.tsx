import { RefreshCw } from "lucide-react";
import type { ReactElement } from "react";
import {
	Button,
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	Spinner,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@semoss/ui/next";
import type { ServedModel, ServedModelEngineLink } from "@/api/model-serving";
import { ServedModelDetails } from "./served-model-details";
import { ServedModelEnginesPanel } from "./served-model-engines-panel";
import { ServedModelLogs } from "./served-model-logs";
import { useServedModelDetail } from "./use-served-model-detail";
import type { ServedModelEngineGroup } from "./use-served-model-engines";

/** The sheet's views */
export type ServedModelSheetTab = "status" | "engines" | "logs";

/** The model's engines and what can be done with them, for the Engines tab */
export interface ServedModelSheetEngines {
	group: ServedModelEngineGroup;
	isLoading: boolean;
	error: string | null;
	busy: ReadonlySet<string>;
	onLink: (engine: ServedModelEngineLink) => void;
	onUnlink: (engine: ServedModelEngineLink) => void;
	onCreate: () => void;
}

export interface ServedModelDetailsSheetProps {
	/** The model last opened; it stays while the sheet closes */
	model: ServedModel | null;
	open: boolean;
	tab: ServedModelSheetTab;
	engines: ServedModelSheetEngines;
	onTabChange: (tab: ServedModelSheetTab) => void;
	onOpenChange: (open: boolean) => void;
}

const isSheetTab = (value: string): value is ServedModelSheetTab =>
	value === "status" || value === "engines" || value === "logs";

/**
 * A served model's full status, its engines and its log, side by side with
 * the list. It reads the status only while open, and the log only while its
 * tab shows.
 */
export function ServedModelDetailsSheet({
	model,
	open,
	tab,
	engines,
	onTabChange,
	onOpenChange,
}: ServedModelDetailsSheetProps): ReactElement {
	const servedModel = model?.servedModel ?? null;
	const { value, error, isLoading, isReading, refresh } =
		useServedModelDetail(open ? servedModel : null);

	return (
		<Sheet open={open && model !== null} onOpenChange={onOpenChange}>
			<SheetContent className="w-full gap-0 sm:max-w-2xl">
				<SheetHeader className="pr-12">
					<SheetTitle className="break-all">{servedModel}</SheetTitle>
					<SheetDescription>
						{model?.displayName ??
							model?.catalogEntry ??
							"A served model"}
					</SheetDescription>
				</SheetHeader>
				<Tabs
					value={tab}
					onValueChange={(next) => {
						if (isSheetTab(next)) onTabChange(next);
					}}
					className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-4"
				>
					<div className="flex items-center justify-between gap-2">
						<TabsList>
							<TabsTrigger value="status">Status</TabsTrigger>
							<TabsTrigger value="engines">Engines</TabsTrigger>
							<TabsTrigger value="logs">Logs</TabsTrigger>
						</TabsList>
						{tab === "status" ? (
							<Button
								size="sm"
								variant="outline"
								onClick={refresh}
								disabled={isReading}
							>
								{isReading ? (
									<Spinner className="size-4" />
								) : (
									<RefreshCw className="size-4" aria-hidden />
								)}
								Refresh
							</Button>
						) : null}
					</div>
					<TabsContent
						value="status"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<ServedModelDetails
							detail={value}
							error={error}
							isLoading={isLoading}
						/>
					</TabsContent>
					<TabsContent
						value="engines"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<ServedModelEnginesPanel
							servedModel={servedModel ?? ""}
							group={engines.group}
							isLoading={engines.isLoading}
							error={engines.error}
							busy={engines.busy}
							onLink={engines.onLink}
							onUnlink={engines.onUnlink}
							onCreate={engines.onCreate}
						/>
					</TabsContent>
					<TabsContent
						value="logs"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<ServedModelLogs
							servedModel={
								open && tab === "logs" ? servedModel : null
							}
						/>
					</TabsContent>
				</Tabs>
			</SheetContent>
		</Sheet>
	);
}
