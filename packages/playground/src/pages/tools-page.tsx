/** biome-ignore-all lint/correctness/noUnusedImports: <explanation> */
/** biome-ignore-all lint/suspicious/noIrregularWhitespace: <explanation> */
/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */
import { SearchIcon } from "lucide-react";
import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useIteratorPixel } from "@semoss/sdk/react";
import {
	Button,
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	useDebouncedValue,
	useInfiniteScroll,
} from "@semoss/ui/next";
import { ToolCard } from "@/components/ToolCard";
import { useGlobalBreadcrumbs } from "@/hooks";

interface ToolItem {
	project_id: string;
	project_name: string;
	description?: string;
	project_type: string;
	project_global: boolean;
	project_published_user?: string;
}

export const ToolsPage = observer(() => {
	useGlobalBreadcrumbs({
		breadcrumbs: [
			{
				name: "Home",
				path: "/",
			},
			{
				name: "Tools",
				path: "/tools",
			},
		],
	});
	const [search, setSearch] = useState("");
	const debouncedSearch = useDebouncedValue(search);
	const [filter, setFilter] = useState<"All" | "Public" | "Private">("All");

	const getTools = useIteratorPixel<ToolItem[], ToolItem>(
		(limit, offset) =>
			`MyEngineProject(metaKeys=["tag","description"],metaFilters=[{"tag":"MCP"}],type=["PROJECT","STORAGE","DATABASE","FUNCTION"],${debouncedSearch ? `filterWord=["${debouncedSearch}"],` : ""}limit=[${limit}],offset=[${offset}]);`,
		(response) => {
			if (response.length < 25) {
				return -1;
			}
			return Infinity;
		},
		(response) => {
			return response;
		},
		{
			limit: 25,
		},
		[debouncedSearch],
	);

	const { setScroll } = useInfiniteScroll({
		disabled: getTools.isLoading || !getTools.hasMore,
		onNext: () => {
			getTools.next();
		},
	});

	const filteredTools = getTools.data.filter((tool) => {
		if (filter === "All") return true;
		if (filter === "Public") return tool.project_global === true;
		return true;
	});
	return (
		<div className="relative flex h-full w-full flex-col gap-4 overflow-hidden pl-2">
			<div>
				<h1 className="mb-4 gap-4 pt-4 pl-2 font-bold text-5xl">
					Tools
				</h1>
				<p className="gap-4 pl-2 text-muted-foreground text-sm">
					Powerful utilities and integrations to extend your
					capabilities.
				</p>
			</div>
			   
			<div className="flex items-center gap-2">
				         
				<InputGroup className="max-w-md bg-background">
					               
					<InputGroupInput
						placeholder="Search tools by name or description..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					/>
					               
					<InputGroupAddon>
						                     
						<SearchIcon />
						               
					</InputGroupAddon>
					         
				</InputGroup>
				         
				<div className="flex shrink-0 gap-2">
					               
					<Button
						variant={filter === "All" ? "default" : "outline"}
						onClick={() => setFilter("All")}
					>
						                     All Tools                
					</Button>
					               
					<Button
						variant={filter === "Public" ? "default" : "outline"}
						onClick={() => setFilter("Public")}
					>
						                     Public                
					</Button>
					               
					<Button
						variant={filter === "Private" ? "default" : "outline"}
						onClick={() => setFilter("Private")}
					>
						                    Private
					</Button>
					         
				</div>
				   
			</div>
			                                  
			<div className="flex-1 overflow-auto">
				                        
				{filteredTools.length === 0 && !getTools.isLoading ? (
					<div className="flex items-center justify-center py-12">
						                                    
						<p className="text-muted-foreground">No tools found</p>
						                              
					</div>
				) : (
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
						                                    
						{filteredTools.map((tool) => (
							<ToolCard key={tool.project_id} tool={tool} />
						))}
						                              
					</div>
				)}
				                  
			</div>
		</div>
	);
});
