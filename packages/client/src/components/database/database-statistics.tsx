import { Download, Eye, Star, TrendingUp } from "lucide-react";
import { Card, Small } from "@semoss/ui/next";
import { usePixel } from "@/hooks";

interface DatabaseStatisticsProps {
	id: string;
}

export const DatabaseStatistics = (props: DatabaseStatisticsProps) => {
	const { id } = props;

	const { status, data } = usePixel<
		| {
				totalUses: number;
				totalViews: number;
				usabilityScore: number;
				usedIn: unknown[];
				usesByDate: Record<string, unknown>;
				viewsByDate: Record<string, unknown>;
		  }
		| false
	>(`EngineActivity(engine='${id}');`);

	if (!data) {
		return null;
	}

	if (status === "ERROR") {
		return <div>Error</div>;
	} else if (status !== "SUCCESS") {
		return <div>Loading</div>;
	}

	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
			<Card className="rounded-xl bg-card shadow-sm">
				<div className="flex items-center gap-2.5 self-stretch p-2">
					<div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-primary/10">
						<Eye className="h-6 w-6 text-primary" />
					</div>

					<div className="flex flex-1 flex-col items-start gap-1">
						<Small className="text-muted-foreground">Views</Small>
						<Small className="text-foreground">
							{data.totalViews}
						</Small>
					</div>
				</div>
			</Card>

			<Card className="rounded-xl bg-card shadow-sm">
				<div className="flex items-center gap-2.5 self-stretch p-2">
					<div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-primary/10">
						<Download className="h-6 w-6 text-primary" />
					</div>

					<div className="flex flex-1 flex-col items-start gap-1">
						<Small className="text-muted-foreground">
							Downloads
						</Small>
						<Small className="text-foreground">N/A</Small>
					</div>
				</div>
			</Card>

			<Card className="rounded-xl bg-card shadow-sm">
				<div className="flex items-center gap-2.5 self-stretch p-2">
					<div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-primary/10">
						<TrendingUp className="h-6 w-6 text-primary" />
					</div>

					<div className="flex flex-1 flex-col items-start gap-1">
						<Small className="text-muted-foreground">
							Insights
						</Small>
						<Small className="text-foreground">
							{data.usedIn.length}
						</Small>
					</div>
				</div>
			</Card>

			<Card className="rounded-xl bg-card shadow-sm">
				<div className="flex items-center gap-2.5 self-stretch p-2">
					<div className="flex h-[60px] w-[60px] items-center justify-center rounded-md bg-primary/10">
						<Star className="h-6 w-6 text-primary" />
					</div>

					<div className="flex flex-1 flex-col items-start gap-1">
						<Small className="text-muted-foreground">
							Usability
						</Small>
						<Small className="text-foreground">
							{data.usabilityScore}/10
						</Small>
					</div>
				</div>
			</Card>
		</div>
	);
};
