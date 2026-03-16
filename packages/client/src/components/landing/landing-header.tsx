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
import Appcode from "@/assets/img/Appcode.svg";
import Appdragdrop from "@/assets/img/Appdragdrop.svg";

const CARDS = [
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		image: Appcode,
		type: "code",
		testId: "new-app-code-btn",
	},
	{
		title: "Drag and drop blocks",
		description:
			"Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.",
		image: Appdragdrop,
		type: "blocks",
		testId: "new-app-drag-btn",
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: Appagent,
		type: "agent",
		testId: "new-app-agent-btn",
	},
] as const;

interface LandingHeaderProps {
	/** Trigger creation of a new app */
	onCreate: (type: "blocks" | "code" | "agent") => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
	onCreate = () => null,
}) => {
	return (
		<div className="grid w-full grid-cols-1 gap-4 md:grid-cols-3">
			{CARDS.map((card) => (
				<Card
					key={card.title}
					className="relative mx-auto w-full max-w-sm gap-2"
				>
					<CardHeader>
						<CardTitle>{card.title}</CardTitle>
						<CardDescription className="line-clamp-3 h-15">
							{card.description}
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-row items-center justify-start gap-1">
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
					<div className="relative w-full overflow-hidden px-6">
						<img src={card.image} alt={card.title} />
					</div>
				</Card>
			))}
		</div>
	);
};
