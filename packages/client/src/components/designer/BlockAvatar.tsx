import type React from "react";

export const BlockAvatar = (props: {
	icon: React.ElementType;
	xs?: boolean;
}) => {
	const { icon: Icon } = props;
	return (
		<div className="flex size-8 shrink-0 items-center justify-center rounded border border-primary bg-primary/20 text-primary">
			<Icon className="size-4" />
		</div>
	);
};
