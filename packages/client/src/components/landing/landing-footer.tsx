import { Link } from "react-router";
import { THEME } from "@/constants";

/** Configured per deployment; absent on instances without hosted docs. */
const DOCUMENTATION_URL = import.meta.env.VITE_DOCUMENTATION_URL;

interface FooterLink {
	label: string;
	/**
	 * In-app route, external URL, or `null` when this deployment has no
	 * destination configured — those render as plain text rather than as
	 * links that go nowhere.
	 */
	href: string | null;
	external?: boolean;
}

const LINK_GROUPS: readonly {
	heading: string;
	links: readonly FooterLink[];
}[] = [
	{
		heading: "Platform",
		links: [
			// TODO: wire up once the platform tour and feedback destinations exist.
			{ label: "Platform Tour", href: null },
			{ label: "Feedback", href: null },
		],
	},
	{
		heading: "Developers",
		links: [
			{
				label: "Documentation",
				href: DOCUMENTATION_URL || null,
				external: true,
			},
			{
				label: "Github",
				href: "https://github.com/SEMOSS/semoss-ui",
				external: true,
			},
		],
	},
	{
		heading: THEME.name,
		links: [{ label: "Privacy Notice", href: "/privacy-notice" }],
	},
];

const LEGAL_LINKS: readonly FooterLink[] = [
	{ label: "Privacy", href: "/privacy-notice" },
	// TODO: wire up once the terms and trust center destinations exist.
	{ label: "Terms", href: null },
	{ label: "Trust Center", href: null },
];

const FooterLinkItem = ({ link }: { link: FooterLink }) => {
	if (!link.href) {
		return (
			<span className="text-muted-foreground text-sm">{link.label}</span>
		);
	}

	if (link.external) {
		return (
			<a
				href={link.href}
				target="_blank"
				rel="noopener noreferrer"
				className="text-muted-foreground text-sm hover:text-foreground"
			>
				{link.label}
			</a>
		);
	}

	return (
		<Link
			to={link.href}
			className="text-muted-foreground text-sm hover:text-foreground"
		>
			{link.label}
		</Link>
	);
};

export const LandingFooter = () => (
	<footer className="flex flex-col gap-16">
		<div className="grid grid-cols-1 gap-12 md:grid-cols-2">
			<div className="flex flex-col gap-4">
				<h2 className="heading-sm text-foreground">{THEME.name}</h2>
				<p className="max-w-prose text-muted-foreground text-sm">
					The enterprise everything platform. Build, govern, and ship
					AI agents on infrastructure you control.
				</p>
			</div>
			<div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
				{LINK_GROUPS.map((group) => (
					<div key={group.heading} className="flex flex-col gap-4">
						<h3 className="font-mono text-foreground text-xs uppercase tracking-widest">
							{group.heading}
						</h3>
						<ul className="flex flex-col gap-4">
							{group.links.map((link) => (
								<li key={link.label}>
									<FooterLinkItem link={link} />
								</li>
							))}
						</ul>
					</div>
				))}
			</div>
		</div>
		<div className="flex flex-col items-start justify-between gap-4 border-border border-t pt-8 sm:flex-row sm:items-center">
			<p className="text-muted-foreground text-sm">
				© {new Date().getFullYear()} {THEME.name}
			</p>
			<ul className="flex flex-wrap gap-6">
				{LEGAL_LINKS.map((link) => (
					<li key={link.label}>
						<FooterLinkItem link={link} />
					</li>
				))}
			</ul>
		</div>
	</footer>
);
