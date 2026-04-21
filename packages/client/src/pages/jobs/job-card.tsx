import type { ReactElement } from "react";

export const JobCard = (props: {
	title: string;
	icon: ReactElement;
	count: number;
	iconColor: string;
	avatarColor: string;
}) => {
	const { title, icon, count, iconColor, avatarColor } = props;

	return (
		<div className="flex-1 rounded-lg border p-4">
			<div className="flex flex-row items-center gap-4">
				<div
					className="flex size-10 shrink-0 items-center justify-center rounded-md"
					style={{ backgroundColor: avatarColor, color: iconColor }}
				>
					{icon}
				</div>
				<div className="flex flex-col gap-0.5">
					<p className="text-sm">{title}</p>
					<p className="text-muted-foreground text-xs">{count}</p>
				</div>
			</div>
		</div>
	);
};
