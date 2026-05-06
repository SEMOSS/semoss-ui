import type React from "react";
import { Card } from "@semoss/ui/next";
import "./WelcomeState.css";

const QUICK_START_STEPS = [
	{
		step: 1,
		title: "Add project to toolbox and ask Playground",
		description:
			"Add your project with recorded playwright scripts, and then give a prompt.",
	},
	{
		step: 2,
		title: "Activate the extension from browser",
		description: "Click the extension icon to open this panel.",
	},
	{
		step: 3,
		title: 'Click "Execute Tool" in Playground',
		description: "The script will run automatically in this panel.",
	},
];

export const WelcomeState: React.FC = () => {
	return (
		<div className="welcome-container">
			<div className="welcome-stack">
				<Card className="welcome-card">
					<h2 className="welcome-title">Quick Start</h2>
					<div className="welcome-steps">
						{QUICK_START_STEPS.map((item) => (
							<div key={item.step} className="welcome-step-row">
								<div className="welcome-step-index">
									{item.step}
								</div>
								<div className="welcome-step-copy">
									<p className="welcome-step-heading">
										{item.title}
									</p>
									<p className="welcome-step-detail">
										{item.description}
									</p>
								</div>
							</div>
						))}
					</div>
				</Card>

				<div className="welcome-tip">
					<p>
						Tip: Keep this panel open to monitor execution progress.
					</p>
				</div>
			</div>
		</div>
	);
};
