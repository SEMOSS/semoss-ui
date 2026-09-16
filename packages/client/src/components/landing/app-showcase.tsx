import { ArrowUpRight } from "lucide-react";
import { Button } from "@semoss/ui/next";
import BI from "@/assets/img/BI.png";
import BIDark from "@/assets/img/BI-dark.png";
import DevBanner from "@/assets/img/DevBanner.png";
import DevBannerDark from "@/assets/img/DevBanner-dark.png";
import Playwright from "@/assets/img/Playwright.svg";
import PlaywrightDark from "@/assets/img/Playwright-dark.svg";
import Terminal from "@/assets/img/Terminal.png";
import TerminalDark from "@/assets/img/Terminal-dark.png";
import { PreviewFrame } from "./preview-frame";

const APPS = [
	{
		name: "Playground",
		description: "Test your apps and skills.",
		href: "../../playground/dist/",
		img: DevBanner,
		darkImg: DevBannerDark,
	},
	{
		name: "Terminal",
		description: "Execute commands and see a response.",
		href: "../../terminal/dist/",
		img: Terminal,
		darkImg: TerminalDark,
	},
	{
		name: "Business Intelligence",
		description: "Develop dashboards and visualizations to view data.",
		href: "../../legacy/dist/",
		img: BI,
		darkImg: BIDark,
	},
	{
		name: "Browser Automation",
		description:
			"Drive a remote browser, record what you do, and replay it later.",
		href: "../../browser-automation/dist/",
		img: Playwright,
		darkImg: PlaywrightDark,
	},
] as const;

/**
 * The "Try these fan favorites" rows — a numbered index of the system apps.
 */
export const AppShowcase = () => (
	<div className="grid grid-cols-1 gap-10 border-border border-t pt-10 md:grid-cols-2">
		{APPS.map((app, index) => (
			<div key={app.name} className="flex min-h-32 gap-5">
				<p
					aria-hidden="true"
					className="font-mono text-primary text-sm uppercase tracking-widest"
				>
					{String(index + 1).padStart(2, "0")}
				</p>
				<div className="flex min-w-0 flex-1 flex-col gap-2">
					<h3 className="heading-sm text-foreground">{app.name}</h3>
					<p className="text-base text-muted-foreground">
						{app.description}
					</p>
					<Button
						asChild
						variant="outline"
						size="sm"
						className="mt-auto w-fit rounded-full"
					>
						<a
							href={app.href}
							target="_blank"
							rel="noopener noreferrer"
						>
							Explore
							<ArrowUpRight aria-hidden="true" />
							<span className="sr-only">{app.name}</span>
						</a>
					</Button>
				</div>
				<PreviewFrame
					src={app.img}
					darkSrc={app.darkImg}
					className="hidden w-44 shrink-0 sm:block"
				/>
			</div>
		))}
	</div>
);
