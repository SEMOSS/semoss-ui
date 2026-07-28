import { ArrowUpRight } from "lucide-react";
import {
	Button,
	Card,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@semoss/ui/next";
import Appagent from "@/assets/img/Appagent.svg";
import AppagentDark from "@/assets/img/Appagent-dark.svg";
import Appautomation from "@/assets/img/Appautomation.svg";
import AppautomationDark from "@/assets/img/Appautomation-dark.svg";
import Appcode from "@/assets/img/Appcode.svg";
import AppcodeDark from "@/assets/img/Appcode-dark.svg";
import Appdragdrop from "@/assets/img/Appdragdrop.svg";
import AppdragdropDark from "@/assets/img/Appdragdrop-dark.svg";

const BASE_CARDS = [
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		image: Appcode,
		darkImage: AppcodeDark,
		type: "code",
		testId: "new-app-code-btn",
		adminOnly: false,
	},
	{
		title: "Drag and drop blocks",
		description:
			"Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.",
		image: Appdragdrop,
		darkImage: AppdragdropDark,
		type: "blocks",
		testId: "new-app-drag-btn",
		adminOnly: false,
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: Appagent,
		darkImage: AppagentDark,
		type: "agent",
		testId: "new-app-agent-btn",
		adminOnly: false,
	},
	{
		title: "Build an automation",
		description:
			"Connect engines, models, and data sources into repeatable automated workflows, triggered manually.",
		image: Appautomation,
		darkImage: AppautomationDark,
		type: "automation",
		testId: "new-app-automation-btn",
		adminOnly: true,
	},
] as const;

interface LandingHeaderProps {
	/** Trigger creation of a new app */
	onCreate: (type: "blocks" | "code" | "agent" | "automation") => void;
	/** Whether the current user is an admin — gates admin-only cards */
	isAdmin: boolean;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
	onCreate = () => null,
	isAdmin,
}) => {
	const CARDS = BASE_CARDS.filter((card) => !card.adminOnly || isAdmin);

	return (
		<div
			className={`grid w-full grid-cols-1 gap-4 md:grid-cols-2 ${CARDS.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}
		>
			{CARDS.map((card) => (
				<Card
					key={card.title}
					className="relative h-full w-full gap-2 overflow-hidden rounded-xl border-border bg-card py-4"
				>
					<CardHeader className="px-4">
						<CardTitle>{card.title}</CardTitle>
						<CardDescription className="line-clamp-3 h-15">
							{card.description}
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-row items-center justify-start gap-1 px-4">
						<Button
							variant="ghost"
							size="default"
							onClick={(e) => {
								e.stopPropagation();

								onCreate(card.type);
							}}
							className="p-0 text-primary hover:bg-transparent hover:text-primary"
						>
							<span className="flex items-center gap-1">
								Get Started
								<ArrowUpRight />
							</span>
						</Button>
					</CardFooter>
					<div className="relative w-full px-4">
						<img
							src={card.image}
							alt={card.title}
							className="block h-auto w-full object-contain dark:hidden"
						/>
						<img
							src={card.darkImage}
							alt={card.title}
							className="hidden h-auto w-full object-contain dark:block"
						/>
					</div>
				</Card>
			))}
		</div>
	);
};
