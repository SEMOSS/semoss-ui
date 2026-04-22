import type React from "react";

interface PanelProps {
	/** Children */
	children: React.ReactNode;

	/** Actions to render */
	actions?: React.ReactNode;

	/** Footer to render */
	footer?: React.ReactNode;
}
export const Panel: React.FC<PanelProps> = ({
	children,
	actions = null,
	footer = null,
}) => {
	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			{actions ? (
				<div className="flex w-full flex-row items-center bg-white px-1 py-1">
					{actions}
				</div>
			) : null}
			<div className="min-h-0 w-full flex-1 overflow-hidden bg-white">
				{children}
			</div>
			{footer ? (
				<div className="flex w-full flex-row items-center bg-white px-1 py-1">
					{footer}
				</div>
			) : null}
		</div>
	);
};
