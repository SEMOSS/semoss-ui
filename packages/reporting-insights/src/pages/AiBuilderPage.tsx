/**
 * AiBuilderPage — the AI dashboard builder as its own full page (`#/dashboards/new/ai`),
 * reached from the create-dashboard chooser. On generate it hands the draft to the manual
 * editor for review; "Back" returns to the chooser and "Switch to manual builder" opens
 * the manual editor. Not a modal.
 */

import { useNavigate } from "react-router-dom";
import { AiBuilder } from "@/components/AiBuilderModal";
import type { Dashboard } from "@/types/dashboard";

export function AiBuilderPage() {
	const navigate = useNavigate();
	return (
		<div className="h-full w-full bg-stone-50">
			<AiBuilder
				onGenerated={(d: Dashboard) =>
					navigate("/dashboards/new/manual", {
						state: { dashboard: d },
					})
				}
				onCancel={() => navigate("/dashboards/new")}
				onSwitchToManual={() => navigate("/dashboards/new/manual")}
			/>
		</div>
	);
}
