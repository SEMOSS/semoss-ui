import { H4, P } from "@semoss/ui/next";
import { THEME } from "@/constants";
import { useRootStore } from "@/hooks";

export const LandingFooter: React.FC = () => {
	const { configStore } = useRootStore();
	// `logo` has three intentional states:
	// - `undefined`: show default branding (theme logo + name)
	// - `ReactNode`: show custom branding content
	// - `null`: hide branding completely
	let customThemeMap: Record<string, unknown> = {};
	try {
		const rawThemeMap = (
			configStore.store.config.theme as { THEME_MAP?: string }
		)?.THEME_MAP;
		if (rawThemeMap) {
			customThemeMap = JSON.parse(rawThemeMap) as Record<string, unknown>;
		}
	} catch {}

	const customLandingPageName =
		typeof customThemeMap.landingPageName === "string" &&
		customThemeMap.landingPageName.trim().length > 0
			? customThemeMap.landingPageName
			: "";
	const customThemeName =
		typeof customThemeMap.name === "string" &&
		customThemeMap.name.trim().length > 0
			? customThemeMap.name
			: "";
	const defaultLandingPageName = THEME.name;
	// Navbar title priority:
	// 1) custom THEME_MAP.landingPageName
	// 2) custom THEME_MAP.name
	// 3) default theme.landingPageName (defaults to THEME.name)
	const brandingName =
		customLandingPageName || customThemeName || defaultLandingPageName;

	return (
		<footer className="grid gap-12 border-border border-t pt-12 md:grid-cols-2">
			<div className="flex max-w-sm flex-col gap-4">
				<H4 className="font-medium text-xl">{brandingName}</H4>
				<P className="text-muted-foreground">
					The enterprise everything platform. Build, govern, and ship
					AI agents on infrastructure you control.
				</P>
			</div>
			<div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
				<div className="flex flex-col gap-4">
					<span className="font-mono text-foreground text-xs uppercase tracking-widest">
						Platform
					</span>
					<div className="flex flex-col gap-3 text-muted-foreground text-sm">
						<span>Platform Tour</span>
						<span>Feedback</span>
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<span className="font-mono text-foreground text-xs uppercase tracking-widest">
						Developers
					</span>
					<div className="flex flex-col gap-3 text-muted-foreground text-sm">
						<span>Documentation</span>
						<span>GitHub</span>
					</div>
				</div>
				<div className="flex flex-col gap-4">
					<span className="font-mono text-foreground text-xs uppercase tracking-widest">
						&nbsp;
					</span>
					<span className="text-muted-foreground text-sm">
						Privacy Notice
					</span>
				</div>
			</div>
		</footer>
	);
};
