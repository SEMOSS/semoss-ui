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
import Appcode from "@/assets/img/Appcode.svg";
import AppcodeDark from "@/assets/img/Appcode-dark.svg";
import Appdragdrop from "@/assets/img/Appdragdrop.svg";
import AppdragdropDark from "@/assets/img/Appdragdrop-dark.svg";

interface LandingCard {
	title: string;
	description: string;
	image: string;
	testId: string;
	/** App-creation flow (mutually exclusive with `href`). */
	type?: "blocks" | "code" | "agent";
	/** External link (e.g. a bundled app served by SemossWeb). Opens in a new tab. */
	href?: string;
	/** Button label (defaults to "Get Started"). */
	cta?: string;
}

const CARDS: LandingCard[] = [
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		image: Appcode,
		darkImage: AppcodeDark,
		type: "code",
		testId: "new-app-code-btn",
	},
	{
		title: "Drag and drop blocks",
		description:
			"Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.",
		image: Appdragdrop,
		darkImage: AppdragdropDark,
		type: "blocks",
		testId: "new-app-drag-btn",
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: Appagent,
		darkImage: AppagentDark,
		type: "agent",
		testId: "new-app-agent-btn",
	},
	{
		title: "Build a dashboard",
		description:
			"Design interactive dashboards from your databases—charts, KPIs, filters and exports—or let the AI Dashboard Builder generate them from a description.",
		image: Appdragdrop,
		href: "../../reporting-insights/dist/",
		cta: "Launch Reporting Insights",
		testId: "launch-reporting-insights-btn",
	},
];

interface LandingHeaderProps {
	/** Trigger creation of a new app */
	onCreate: (type: "blocks" | "code" | "agent") => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
	onCreate = () => null,
}) => {
	return (
		<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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
						{card.href ? (
							<Button
								asChild
								variant="ghost"
								size="default"
								data-testid={card.testId}
								className="p-0 text-primary hover:bg-transparent hover:text-primary"
							>
								<a
									href={card.href}
									target="_blank"
									rel="noopener noreferrer"
								>
									<span className="flex items-center gap-1">
										{card.cta ?? "Get Started"}
										<ArrowUpRight />
									</span>
								</a>
							</Button>
						) : (
							<Button
								variant="ghost"
								size="default"
								data-testid={card.testId}
								onClick={(e) => {
									e.stopPropagation();

									if (card.type) onCreate(card.type);
								}}
								className="p-0 text-primary hover:bg-transparent hover:text-primary"
							>
								<span className="flex items-center gap-1">
									{card.cta ?? "Get Started"}
									<ArrowUpRight />
								</span>
							</Button>
						)}
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
