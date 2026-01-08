import { Box, styled, Typography } from "@semoss/ui";

/*
import BLOCKS_APP_2 from "@/assets/img/blocks_app_2.png";
import Apps from "../../../assets/img/Apps.png";
import Download from "../../../assets/img/Downloads.png";
import Usability from "../../../assets/img/Usability.png";
import View from "../../../assets/img/ViewIcon.png";

// Statistics configuration - removed hardcoded data
const stats: any[] = [
	// { id: 4, icon: Usability, label: "Usability", value: "9.5/10" },
];

// Similar Apps Data - removed hardcoded data
const similarApps: any[] = [
	// {
	//   project_id: "1",
	//   project_name: "Task Manager",
	//   project_description: "Manage daily tasks efficiently",
	// },
];


const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();
*/

const StyledBox = styled(Box)(({ theme }) => ({
	padding: theme.spacing(3),
	width: "100%",
}));

// Text
const StyledDescription = styled(Typography)(({ theme }) => ({
	color: theme.palette.text.disabled,
	fontSize: "16px",
}));
/*
const SectionTitle = styled(Typography)(({ theme }) => ({
	paddingTop: theme.spacing(1), // 8px
}));

// Stat card
const StatCard = styled(Box)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: theme.shape.borderRadius * 2,
	padding: theme.spacing(2),
	display: "flex",
	alignItems: "center",
	gap: theme.spacing(1.5),
}));

// Similar apps - hidden

const AppCard = styled(Card)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	borderRadius: theme.shape.borderRadius * 2,
	boxShadow: theme.shadows[1] as string,
}));

const AppImage = styled("img")({
	width: "100%",
	height: 300,
	objectFit: "contain",
});

const StyledTypography = styled(Typography)(({ theme }) => ({
	padding: theme.spacing(1),
}));

const StyledCard = styled(Card)(({ theme }) => ({
	height: "100%",
	display: "flex",
	flexDirection: "column",
	borderRadius: 2,
}));
*/
const StyledPlaceholderBox = styled(Box)(({ theme }) => ({
	border: `1px solid ${theme.palette.secondary.main}`,
	borderRadius: 2,
	padding: theme.spacing(4),
	textAlign: "center",
}));

interface OverviewProps {
	appInfo: {
		markdown?: string;
	};
}

export const Overview = ({ appInfo }: OverviewProps) => {
	return (
		<StyledBox>
			<Typography variant="h6" gutterBottom>
				Details
			</Typography>
			{appInfo?.markdown ? (
				<StyledDescription variant="body2">
					{appInfo?.markdown}
				</StyledDescription>
			) : (
				<StyledPlaceholderBox>
					<Typography variant="body1" color="text.secondary">
						No markdown available
					</Typography>
				</StyledPlaceholderBox>
			)}

			{/* Statistics & Similar Apps - hidden */}
			{/* <SectionTitle variant="h6" gutterBottom sx={{ paddingTop: "8px" }}>
				Statistics
			</SectionTitle>

			{stats.length > 0 ? (
				<Grid container spacing={2} mb={4}>
					{stats.map((stat, index) => (
						<Grid item xs={12} sm={6} md={3} key={index}>
							<StatCard>
								<img
									src={stat.icon}
									alt={stat.label}
									width={60}
									height={60}
									style={{ objectFit: "contain" }}
								/>
								<Box>
									<Typography variant="body2">
										{stat.label}
									</Typography>
									<Typography
										variant="subtitle1"
										fontWeight="bold"
									>
										{stat.value}
									</Typography>
								</Box>
							</StatCard>
						</Grid>
					))}
				</Grid>
			) : (
				<StyledPlaceholderBox>
					<Typography variant="body1" color="text.secondary">
						No statistics available
					</Typography>
				</StyledPlaceholderBox>
			)}

			<Typography sx={{ paddingTop: "8px" }} variant="h6" gutterBottom>
				Similar Apps
			</Typography>

			{similarApps.length > 0 ? (
				<Grid container spacing={2}>
					{similarApps.map((app) => (
						<Grid item xs={12} sm={6} md={3} key={app.project_id}>
							<AppCard>
								<Box>
									<AppImage
										src={BLOCKS_APP_2}
										alt="App Icon"
										style={{ objectFit: "contain" }}
									/>
									<StyledTypography
										variant="subtitle1"
										gutterBottom
									>
										{app.project_name}
									</StyledTypography>
									<StyledTypography
										variant="body2"
										gutterBottom
									>
										{app.project_description}
									</StyledTypography>
								</Box>
							</AppCard>
						</Grid>
					))}
				</Grid>
			) : (
				<StyledPlaceholderBox>
					<Typography variant="body1" color="text.secondary">
						No similar apps available
					</Typography>
				</StyledPlaceholderBox>
			)} */}
		</StyledBox>
	);
};
