import { ClipboardListIcon } from "lucide-react";
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
		title: "Drag and drop blocks",
		description:
			"Drag and drop UI components to make your app come to life. Customize the design of your app in this low code environment.",
		image: Appdragdrop,
		type: "blocks",
		testId: "new-app-drag-btn",
	},
	{
		title: "Develop in code",
		description:
			"Choose a framework or start from scratch—code and preview your app seamlessly in our editor!",
		image: Appcode,
		type: "code",
		testId: "new-app-code-btn",
	},
	{
		title: "Construct an agent",
		description:
			"Engineer a prompt to interact with your LLM. Structure the text and design inputs to generate the optimal AI response.",
		image: Appagent,
		type: "agent",
		testId: "new-app-agent-btn",
	},
	{
		title: "Form Builder",
		description:
			"Build CRUD forms step by step—connect a database, configure fields, and generate a ready-to-use app.",
		image: null,
		type: "form",
		testId: "new-app-form-btn",
	},
] as const;

interface LandingHeaderProps {
	/** Trigger creation of a new app */
	onCreate: (type: "blocks" | "code" | "agent" | "form") => void;
}

export const LandingHeader: React.FC<LandingHeaderProps> = ({
	onCreate = () => null,
}) => {
	return (
		<div className="grid w-full grid-cols-1 gap-4 p-2 md:grid-cols-2 lg:grid-cols-4">
			{CARDS.map((card) => (
				<Card
					key={card.title}
					className="relative mx-auto w-full max-w-sm"
				>
					<CardHeader>
						<CardTitle>{card.title}</CardTitle>
						<CardDescription className="line-clamp-3 h-15">
							{card.description}
						</CardDescription>
					</CardHeader>
					<CardFooter className="flex flex-row items-center justify-end gap-1">
						<Button
							size="sm"
							onClick={(e) => {
								e.stopPropagation();

								onCreate(card.type);
							}}
						>
							Get Started
						</Button>
					</CardFooter>
					<div className="relative w-full overflow-hidden px-6">
						{card.image ? (
							<img
								src={card.image}
								alt={card.title}
								className="aspect-video w-full object-cover"
							/>
						) : (
							<div className="flex aspect-video w-full items-center justify-center bg-muted">
								<ClipboardListIcon className="size-12 text-muted-foreground" />
							</div>
						)}
					</div>
				</Card>
			))}
		</div>
	);
};
