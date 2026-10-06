import { DashboardAgents } from "./dashboard-agents";
import { DashboardApp } from "./dashboard-app";
import { DashboardDay } from "./dashboard-day";
import { DashboardEmail } from "./dashboard-email";
import type { DashboardWidget } from "./dashboard-layout";
import { DashboardNeeds } from "./dashboard-needs";

/** Widget identity is stable across preset changes and grid gestures. */
export function DashboardWidgetContent({
	widget,
}: {
	widget: DashboardWidget;
}) {
	switch (widget.kind) {
		case "day":
			return <DashboardDay />;
		case "needs":
			return <DashboardNeeds widget={widget} />;
		case "email":
			return <DashboardEmail widget={widget} />;
		case "agents":
			return <DashboardAgents visible={widget.visible} />;
		case "app":
			return <DashboardApp widget={widget} />;
	}
}
