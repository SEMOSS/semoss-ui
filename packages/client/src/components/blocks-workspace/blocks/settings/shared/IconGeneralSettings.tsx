import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import {
	Muted,
	Switch,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@semoss/ui/next";
import { useBlockSettings } from "@/hooks/useBlockSettings";
import { InputSettings, SelectInputSettings } from "../shared";

const badgeColorOptions = [
	{ value: "primary", display: "Primary" },
	{ value: "default", display: "No Badge" },
	{ value: "secondary", display: "Secondary" },
	{ value: "error", display: "Error" },
	{ value: "info", display: "Info" },
	{ value: "success", display: "Success" },
	{ value: "warning", display: "Warning" },
];

export const IconGeneralSettings = ({ id }: { id: string }) => {
	const { data, setData } = useBlockSettings(id);
	const [showBadge, setShowBadge] = useState<boolean>(false);

	// Initialize local state from MobX once
	useEffect(() => {
		if (typeof data?.showBadge === "boolean") {
			setShowBadge(data.showBadge);
		}
	}, [data?.showBadge]);

	const toggleShowBadge = () => {
		const newValue = !showBadge;
		setShowBadge(newValue);
		setData("showBadge", newValue);

		if (!newValue) {
			setData("badgeContent", 0);
			setData("color", "default");
		}
	};

	return (
		<>
			{/* Toggle field */}
			<div className="mt-2 flex flex-row items-center gap-2">
				<div className="flex w-full flex-row items-center gap-0.5">
					<Muted>Show Badge</Muted>
					<Tooltip>
						<TooltipTrigger asChild>
							<CircleHelp
								style={{ marginLeft: "5px" }}
								className="size-4"
							/>
						</TooltipTrigger>
						<TooltipContent>
							Toggle to display or hide the badge on the icon
						</TooltipContent>
					</Tooltip>
				</div>
				<Switch checked={showBadge} onCheckedChange={toggleShowBadge} />
			</div>
			{/* Render badge settings if showBadge is true */}
			{showBadge && (
				<>
					<InputSettings
						id={id}
						label="Badge Content"
						path="badgeContent"
					/>
					<SelectInputSettings
						id={id}
						label="Badge Color"
						path="color"
						options={badgeColorOptions}
					/>
				</>
			)}
		</>
	);
};
