import { Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@semoss/ui/next";
import { SEMOSS } from "@/assets/img/SEMOSS";

export const InsightTileCard = (props) => {
	const { name, description, modifiedDate, onClick } = props;

	return (
		<Card
			className="flex cursor-pointer flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md"
			style={{ height: "200px" }}
			onClick={() => {
				onClick();
			}}
		>
			<CardHeader className="flex flex-row items-center gap-2 pb-0">
				<SEMOSS />
				<CardTitle className="font-medium text-sm">{name}</CardTitle>
			</CardHeader>
			<CardContent className="-mt-2 overflow-hidden text-ellipsis">
				<p className="text-muted-foreground text-xs">
					{description ? description : "No description available"}
				</p>
			</CardContent>

			<div className="mt-auto flex items-center gap-2 px-6 pb-4">
				<Clock className="size-4" />
				<p className="text-muted-foreground text-xs">
					{modifiedDate ? modifiedDate : "7/19/2023 · 10:00AM"}
				</p>
			</div>
		</Card>
	);
};

export const InsightLandscapeCard = (_props) => {
	return <div>Landscape</div>;
};
