import type { ReactElement } from "react";
import {
	Avatar,
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
} from "@semoss/ui/next";

export const JobCard = (props: {
	title: string;
	icon: ReactElement;
	count: number;
	iconColor: string;
	avatarColor: string[];
}) => {
	const { title, icon, count, iconColor, avatarColor } = props;

	return (
		<Field className="rounded-md border border-gray-200 p-4">
			<FieldContent className="flex flex-row items-center gap-4">
				<div className="flex items-center justify-center">
					<Avatar
						className="h-8 w-8 rounded-sm"
						style={{
							background: `linear-gradient(45deg, ${avatarColor.join(", ")})`,
						}}
					>
						<div
							className="flex h-full w-full items-center justify-center"
							style={{ color: iconColor }}
						>
							{icon}
						</div>
					</Avatar>
				</div>

				<div className="flex flex-col justify-center">
					<FieldLabel className="font-medium text-xs">
						{title}
					</FieldLabel>
					<FieldDescription className="text-[10px] text-gray-500">
						{count}
					</FieldDescription>
				</div>
			</FieldContent>
		</Field>
	);
};
