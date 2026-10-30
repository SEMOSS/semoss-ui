import type { ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import { RoutineHistory } from "./routine-history";
import type { RoutineId } from "./routine-schema";

interface RoutineDetailProps {
	/** The routine the history lists. */
	routineId: RoutineId;
	/** The owner's time zone, for the run times. */
	timezone: string;
	/** The routine's settings and latest result. */
	children: ReactNode;
}

/** One routine's Settings and History; the settings stay mounted so a pending autosave survives a switch. */
export function RoutineDetail({
	routineId,
	timezone,
	children,
}: RoutineDetailProps) {
	return (
		<Tabs defaultValue="settings" className="min-w-0 gap-4">
			<TabsList className="w-fit">
				<TabsTrigger value="settings">Settings</TabsTrigger>
				<TabsTrigger value="history">History</TabsTrigger>
			</TabsList>
			<TabsContent
				value="settings"
				forceMount
				className="min-w-0 data-[state=inactive]:hidden"
			>
				{children}
			</TabsContent>
			<TabsContent value="history" className="min-w-0">
				<RoutineHistory routineId={routineId} timezone={timezone} />
			</TabsContent>
		</Tabs>
	);
}
