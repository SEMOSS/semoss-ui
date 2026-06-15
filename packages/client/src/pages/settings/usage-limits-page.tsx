import { Settings2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@semoss/ui/next";
import { useSettings } from "@/hooks";
import { RoomTokenLimitsPanel } from "./usage-limits/components/room-token-limits-panel";

export const UsageLimitsPage = () => {
	const { adminMode } = useSettings();

	if (!adminMode) {
		return <Navigate to="/settings" replace />;
	}

	return (
		<div className="flex w-full flex-col gap-4">
			<Tabs value="room" className="w-full">
				<TabsList className="mb-4 flex w-full flex-wrap gap-1">
					<TabsTrigger
						value="room"
						className="flex items-center gap-1.5 text-xs"
						data-testid="usage-limits-tab-room"
					>
						<Settings2 className="size-3.5" />
						Room
					</TabsTrigger>
				</TabsList>
				<TabsContent value="room">
					<RoomTokenLimitsPanel />
				</TabsContent>
			</Tabs>
		</div>
	);
};
