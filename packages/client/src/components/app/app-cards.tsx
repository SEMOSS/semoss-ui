import { AppCatalogAvatar } from "@semoss/shared";
import { Card, CardContent } from "@semoss/ui/next";

export const ProjectLandscapeCard = (_props) => {
	return <div>Landscape</div>;
};

export const ProjectTileCard = (props) => {
	const { name, id, description, onClick } = props;

	return (
		<Card
			className="cursor-pointer overflow-hidden shadow-[0px_5px_22px_0px_rgba(0,0,0,0.04),0px_4px_4px_0.5px_rgba(0,0,0,0.03)]"
			onClick={() => onClick(id)}
		>
			<div className="flex items-center gap-2 px-4 pt-4 pb-2">
				<AppCatalogAvatar
					name={name}
					className="size-8 shrink-0 rounded text-xs"
				/>
				<span className="font-medium text-sm">{name}</span>
			</div>
			<CardContent className="block max-w-[350px] overflow-hidden text-ellipsis whitespace-nowrap pb-4">
				<span className="text-muted-foreground text-xs">
					{description ? description : "No description available"}
				</span>
			</CardContent>
		</Card>
	);
};
