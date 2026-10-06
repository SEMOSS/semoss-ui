import { ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router";
import { Button, H3, P } from "@semoss/ui/next";
import { useDashboard } from "@/features/dashboard/dashboard.context";

/** Opens the visual editor without replacing an existing dashboard draft. */
export function DashboardSettings() {
	const { layout } = useDashboard();
	const navigate = useNavigate();
	return (
		<section className="space-y-6">
			<header className="space-y-2">
				<H3 className="text-xl">Dashboard</H3>
				<P className="text-base text-muted-foreground">
					Choose your widgets, arrange your dashboard, and manage
					layout presets.
				</P>
			</header>
			<div className="space-y-4">
				<P className="text-base text-muted-foreground">
					Customize directly on your dashboard. Your changes stay as a
					draft until you save the layout.
				</P>
				<Button
					onClick={() => {
						if (!layout.isEditing) layout.begin();
						void navigate("/");
					}}
				>
					Customize dashboard <ArrowUpRight aria-hidden="true" />
				</Button>
			</div>
		</section>
	);
}
