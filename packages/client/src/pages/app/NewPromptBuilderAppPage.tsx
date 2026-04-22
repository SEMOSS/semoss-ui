import { NewAppStep } from "@/components/app";
import { PromptBuilder } from "@/components/prompt";
import { NavbarHeader, NavbarLeft } from "../../components/shared";

export const NewPromptBuilderAppPage = () => {
	return (
		<>
			<NavbarLeft>
				<NavbarHeader />
			</NavbarLeft>
			<NewAppStep>
				<PromptBuilder />
			</NewAppStep>
		</>
	);
};
