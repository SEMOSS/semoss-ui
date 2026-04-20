import { Tag } from "lucide-react";
import {
	Badge,
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@semoss/ui/next";
import type { Prompt } from "../prompt.types";

interface PromptCardProps {
	prompt: Prompt;
	onClick: (p: Prompt) => void;
}

export const PromptCard = (props: PromptCardProps) => {
	const { prompt, onClick } = props;

	return (
		<Card
			className="h-full cursor-pointer"
			onClick={() => onClick(prompt)}
		>
			<CardHeader>
				<CardTitle className="truncate text-base font-medium text-muted-foreground">
					{prompt.title}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<p className="truncate text-sm text-muted-foreground">
					{prompt.context}
				</p>
			</CardContent>
			<div className="flex-1" />
			<CardFooter>
				<div className="flex w-full flex-wrap gap-2">
					{Array.from(prompt.tags.sort(), (tag, i) => (
						<Badge
							key={`${prompt.id}-tag-${i}`}
							variant="secondary"
							className="capitalize"
						>
							<Tag className="mr-1 h-3 w-3" />
							{tag}
						</Badge>
					))}
				</div>
			</CardFooter>
		</Card>
	);
};
