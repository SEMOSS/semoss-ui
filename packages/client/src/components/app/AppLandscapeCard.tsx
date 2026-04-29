import dayjs from "dayjs";
import { MoreVertical } from "lucide-react";
import { useMemo } from "react";
import { Env } from "@semoss/sdk/react";
import {
	Badge,
	Button,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	toast,
} from "@semoss/ui/next";
import { setProjectFavorite } from "@/api";
import type { AppMetadata } from "./app.types";

interface AppTileCardProps {
	app: AppMetadata;
	image?: string;
	onAction?: (app: AppMetadata) => void;
	href: string;
}

export const AppLandscapeCard = (props: AppTileCardProps) => {
	const { app, image, href } = props;

	const createdDate = useMemo(() => {
		const d = dayjs(app.project_date_created);
		if (!d.isValid()) return "";
		return d.format("MMMM D, YYYY");
	}, [app.project_date_created]);

	const copy = (content: string) => {
		navigator.clipboard
			.writeText(content)
			.then(() => toast.success("Successfully copied to clipboard"))
			.catch((e) => toast.error(e.message));
	};

	const _favoriteProject = (project) => {
		setProjectFavorite(project.project_id, true).catch((err) => {
			throw Error(err);
		});
	};

	return (
		<div className="flex w-full cursor-pointer flex-row rounded-xl border bg-background p-4 hover:shadow-md">
			<div className="flex w-full items-center justify-between">
				<div className="flex flex-grow items-center gap-2.5">
					{image ? (
						<img
							src={image}
							alt=""
							className="h-12 w-12 rounded-lg object-cover"
						/>
					) : (
						<img
							src={`${Env.MODULE}/api/project-${app.project_id}/projectImage/download`}
							alt=""
							className="h-12 w-12 rounded-lg object-cover"
						/>
					)}
					<span className="block max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap text-sm leading-6">
						{app.project_display_name || app.project_name}
					</span>
				</div>

				<div className="flex flex-grow items-center gap-0.5">
					{app.tag !== undefined &&
						(typeof app.tag === "object" ? (
							<div className="flex flex-row items-center gap-0.5">
								{(app.tag as string[])
									.slice(0, 2)
									.map((t, i) => (
										<Badge
											key={`${app.project_id}-${i}`}
											variant="secondary"
											className="max-w-[59px] overflow-hidden text-ellipsis"
										>
											{t}
										</Badge>
									))}
								{app.tag.length > 2 && (
									<span className="pl-1 text-muted-foreground text-xs">
										{`+${app.tag.length - 2}`}
									</span>
								)}
							</div>
						) : (
							<Badge
								key={app.project_id + app.tag}
								variant="secondary"
								className="max-w-[59px] overflow-hidden text-ellipsis"
							>
								{app.tag}
							</Badge>
						))}
				</div>

				<span className="text-muted-foreground text-xs">
					{createdDate}
				</span>

				<div className="flex items-center pl-4">
					<a href={href} rel="noopener noreferrer">
						<Button variant="outline" size="sm">
							Open
						</Button>
					</a>
					{app.project_created_by !== "SYSTEM" && (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="icon">
									<MoreVertical className="size-4 text-muted-foreground" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onClick={() => copy(app.project_id)}
								>
									Copy App ID
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					)}
				</div>
			</div>
		</div>
	);
};
