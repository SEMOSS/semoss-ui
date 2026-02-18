/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */
/** biome-ignore-all lint/suspicious/noArrayIndexKey: <explanation> */
/** biome-ignore-all lint/correctness/noUnusedVariables: <explanation> */
import { Card, CardContent } from "@semoss/ui/next";
import BLOCKS_APP_2 from "@/assets/img/blocks_app_2.png";

// Statistics configuration - removed hardcoded data
const stats: any[] = [
	// { id: 4, icon: Usability, label: "Usability", value: "9.5/10" },
];

// Similar Apps Data - removed hardcoded data
const similarApps: any[] = [
	// {
	//   project_id: "1",
	//   project_name: "Task Manager",
	//   project_description: "Manage daily tasks efficiently",
	// },
];

const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

interface OverviewProps {
	appInfo: {
		markdown?: string;
	};
}

export const Overview = ({ appInfo }: OverviewProps) => {
	return (
		<div className="space-y-6">
			{/* Details */}
			<h3 className="font-semibold text-lg">Details</h3>

			{appInfo?.markdown ? (
				<p className="text-muted-foreground text-sm leading-relaxed">
					{appInfo?.markdown}
				</p>
			) : (
				<PlaceholderBox label="No markdown available" />
			)}

			{/* Statistics */}
			<h3 className="pt-2 font-semibold text-lg">Statistics</h3>

			{stats.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
					{stats.map((stat, index) => (
						<Card key={index} className="border border-secondary">
							<CardContent className="flex items-center gap-4 p-4">
								<img
									src={stat.icon}
									alt={stat.label}
									className="h-14 w-14 object-contain"
								/>
								<div>
									<p className="text-muted-foreground text-sm">
										{stat.label}
									</p>
									<p className="font-semibold text-base">
										{stat.value}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<PlaceholderBox label="No statistics available" />
			)}

			{/* Similar Apps */}
			<h3 className="pt-2 font-semibold text-lg">Similar Apps</h3>

			{similarApps.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
					{similarApps.map((app) => (
						<Card
							key={app.project_id}
							className="flex h-full flex-col"
						>
							<CardContent className="space-y-3 p-4">
								<img
									src={BLOCKS_APP_2}
									alt="App Icon"
									className="h-[300px] w-full object-contain"
								/>
								<h4 className="font-semibold">
									{app.project_name}
								</h4>
								<p className="text-muted-foreground text-sm">
									{app.project_description}
								</p>
							</CardContent>
						</Card>
					))}
				</div>
			) : (
				<PlaceholderBox label="No similar apps available" />
			)}
		</div>
	);
};

const PlaceholderBox = ({ label }: { label: string }) => {
	return (
		<div className="rounded-md border border-secondary p-8 text-center">
			<p className="text-muted-foreground text-sm">{label}</p>
		</div>
	);
};
