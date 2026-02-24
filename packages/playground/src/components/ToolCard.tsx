import type React from "react";
import { Button, Card, CardContent, CardFooter } from "@semoss/ui/next";

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
	return (
		<Card className="flex flex-col justify-between">
			                  
			<CardContent className="flex flex-col gap-3 p-5">
				                            
				<div className="font-semibold text-base">
					                              
					{tool.project_name || "Untitled"}
					                        
				</div>
				                                            
				<div className="line-clamp-2 text-muted-foreground text-sm">
					                              
					{tool.description ?? "No description available"}
					                        
				</div>
				                                      
				<div>
					                              
					<span className="-full inline-block rounded border px-2.5 py-0.5 font-medium text-muted-foreground">
						                                    
						{tool.project_global ? "Public" : "Private"}
						                              
					</span>
					                        
				</div>
				                  
			</CardContent>
			                  
			<CardFooter className="px-5 pt-0 pb-5">
				                        
				<Button
					className="w-full"
					variant="outline"
					onClick={() => {
						window.open(`/app/${tool.project_id}`, "_blank");
					}}
				>
					                              View Documentation
					                        
				</Button>
				                  
			</CardFooter>
			            
		</Card>
	);
};

export { ToolCard };
