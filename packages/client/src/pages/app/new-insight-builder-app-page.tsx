import { NewAppStep } from "@/components/app";
import { InsightBuilder } from "@/components/insight";
import { NavbarHeader, NavbarLeft } from "../../components/shared";

export const NewInsightBuilderAppPage = () => {
	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<NewAppStep tool="Insight">
				<InsightBuilder />
			</NewAppStep>
		</>
	);
};
