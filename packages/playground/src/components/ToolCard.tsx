import type React from "react";
import { usePixel } from "@semoss/sdk/react";
import { Card, CardContent, CardFooter } from "@semoss/ui/next";

interface ToolCardProps {
	tool: {
		project_id: string;
		project_name: string;
		description?: string;
		project_type: string;
		project_global: boolean;
		project_published_user?: string;
	};
}

const ToolCard: React.FC<ToolCardProps> = ({ tool }) => {
	const getMCP = usePixel<{
		tools: {
			name: string;
			title?: string;
			description?: string;
		}[];
	}>(`GetMCPTools(project=["${tool.project_id}"]);`, {
		data: {
			tools: [
				{
					name: "",
					title: "",
					description: "",
				},
			],
		},
	});

	return (
		<>
			{getMCP.data.tools
				.filter((t) => t.name)
				.map((mcpTool) => (
					<Card
						key={mcpTool.name}
						className="flex flex-col justify-between"
					>
						<CardContent className="flex flex-col gap-3 p-5">
							<div className="font-semibold text-base">
								{mcpTool.title || mcpTool.name}
							</div>

							<div className="line-clamp-2 text-muted-foreground text-sm">
								{mcpTool.description ||
									"No description available"}
							</div>

							<div className="text-muted-foreground text-xs">
								App: {tool.project_name}
							</div>

							<div
								className={`w-fit rounded-full border px-2.5 py-0.5 font-medium text-xs ${
									tool.project_global
										? "border-primary/30 bg-primary/4 text-primary"
										: "text-muted-foreground"
								}`}
							>
								{tool.project_global ? "Public" : "Private"}
							</div>
						</CardContent>

						<CardFooter className="px-5 pt-0 pb-5">
							{/* <Button
								className="w-full"
								variant="outline"
								onClick={() =>
									window.open(
										`/#/app/${tool.project_id}`,
										"_blank",
									)
								}
							>
								View Documentation
							</Button> */}
						</CardFooter>
					</Card>
				))}
		</>
	);
};

export { ToolCard };
