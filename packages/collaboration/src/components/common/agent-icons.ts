import {
	BriefcaseBusiness,
	ChartNoAxesCombined,
	Compass,
	PenLine,
	Users,
} from "lucide-react";
import type { AgentIcon } from "@/types/agent";

export const agentIcons: Record<AgentIcon, typeof Compass> = {
	compass: Compass,
	briefcase: BriefcaseBusiness,
	chart: ChartNoAxesCombined,
	pen: PenLine,
	users: Users,
};
