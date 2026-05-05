import type React from "react";
import { Box, Card, Stack, Typography } from "@semoss/ui";

export const WelcomeState: React.FC = () => {
	return (
		<div className="welcome-container">
			<Stack spacing={1.5} alignItems="center">
				{/* Quick Start Guide */}
				<Card
					sx={{
						width: "100%",
						maxWidth: 500,
						p: 2,
						mt: 1,
						border: "1px solid",
						borderColor: "divider",
					}}
				>
					<Typography
						variant="h4"
						sx={{ mb: 1.5, fontWeight: 600, fontSize: "1rem" }}
					>
						Quick Start
					</Typography>
					<Stack spacing={1.5}>
						<Stack direction="row" spacing={2}>
							<Box
								sx={{
									minWidth: 28,
									height: 28,
									borderRadius: "50%",
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
									color: "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "14px",
									fontWeight: "bold",
								}}
							>
								1
							</Box>
							<Stack spacing={0.5}>
								<Typography
									variant="body2"
									sx={{ fontWeight: 600 }}
								>
									Add project to toolbox and ask Playground
								</Typography>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary" }}
								>
									Add your project with recorded playwright
									scripts, and then give a prompt
								</Typography>
							</Stack>
						</Stack>

						<Stack direction="row" spacing={2}>
							<Box
								sx={{
									minWidth: 28,
									height: 28,
									borderRadius: "50%",
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
									color: "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "14px",
									fontWeight: "bold",
								}}
							>
								2
							</Box>
							<Stack spacing={0.5}>
								<Typography
									variant="body2"
									sx={{ fontWeight: 600 }}
								>
									Activate the extension from browser
								</Typography>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary" }}
								>
									Click the extension icon to open this panel
								</Typography>
							</Stack>
						</Stack>

						<Stack direction="row" spacing={2}>
							<Box
								sx={{
									minWidth: 28,
									height: 28,
									borderRadius: "50%",
									background:
										"linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
									color: "white",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									fontSize: "14px",
									fontWeight: "bold",
								}}
							>
								3
							</Box>
							<Stack spacing={0.5}>
								<Typography
									variant="body2"
									sx={{ fontWeight: 600 }}
								>
									Click "Execute Tool" in Playground
								</Typography>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary" }}
								>
									The script will run automatically in this
									panel
								</Typography>
							</Stack>
						</Stack>
					</Stack>
				</Card>

				{/* Status Indicator */}
				<Box
					sx={{
						mt: 1,
						px: 2,
						py: 1,
						borderRadius: 2,
						background: "#f0f7ff",
						border: "1px solid #2196F3",
						width: "100%",
						maxWidth: 500,
					}}
				>
					<Typography
						variant="caption"
						sx={{ color: "#1976d2", fontSize: "0.75rem" }}
					>
						💡 Tip: Keep this panel open to monitor execution
						progress
					</Typography>
				</Box>
			</Stack>
		</div>
	);
};
