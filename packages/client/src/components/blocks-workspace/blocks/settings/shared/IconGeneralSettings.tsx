import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { useEffect, useState } from "react";
import { Stack, Switch, Tooltip, Typography } from "@semoss/ui";
import { useBlockSettings } from "@/hooks";
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
			<Stack
				sx={{
					flexDirection: "row",
					alignItems: "center",
					gap: 2,
					mt: 1,
				}}
			>
				<Stack
					direction="row"
					alignItems="center"
					spacing={0.5}
					width="100%"
				>
					<Typography variant="body2">Show Badge</Typography>
					<Tooltip
						title="Toggle to display or hide the badge on the icon"
						arrow
					>
						<HelpOutlineIcon
							color="action"
							sx={{ fontSize: 15, ml: "5px" }}
						/>
					</Tooltip>
				</Stack>
				<Switch
					value={showBadge}
					checked={showBadge}
					onChange={toggleShowBadge}
					size="small"
					color="primary"
				/>
			</Stack>
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
