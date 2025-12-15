import type React from "react";
import { Card, Input, Label } from "@semoss/ui/next";
import type { MetaDataSectionProps } from "./types";

export const MetaDataSection: React.FC<MetaDataSectionProps> = ({
	metadata,
	title = "Meta Data",
	columns = 3,
	className = "",
}) => {
	if (!metadata || Object.keys(metadata).length === 0) {
		return null;
	}

	return (
		<Card
			className={`mb-5 w-full gap-2 rounded-lg bg-zinc-100 p-4 ${className}`}
		>
			<h3 className="mb-3 font-semibold text-base">{title}</h3>
			<div
				className="grid w-full gap-3"
				style={{
					gridTemplateColumns: `repeat(${columns}, 1fr)`,
				}}
			>
				{Object.entries(metadata).map(([key, value]) => (
					<div key={key} className="flex flex-col gap-1">
						<Label
							htmlFor={key}
							className="text-base-muted-foreground text-xm"
						>
							{key}
						</Label>
						<Input
							id={key}
							value={value}
							readOnly
							disabled
							className="w-full cursor-not-allowed border-base-input bg-white px-2 py-1 text-base-muted-foreground text-sm"
						/>
					</div>
				))}
			</div>
		</Card>
	);
};
