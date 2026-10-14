import type { ReactNode } from "react";
import { type ConnectorBrand, ConnectorBrandIcon } from "@semoss/shared";
import { H4, Muted } from "@semoss/ui/next";

/** Props for {@link ToolViewCard}. */
export interface ToolViewCardProps {
	/** The app the call acts in, whose logo heads the card. */
	brand: ConnectorBrand;
	/** What the call does, such as `Send an email`. */
	title: string;
	/** A line under the title, such as that everything can be changed. */
	description?: string;
	/** The card's content. */
	children: ReactNode;
}

/**
 * The frame of a connector's tool view in a conversation: the app's logo and
 * what the call does, above what it shows. It sizes to its content.
 */
export const ToolViewCard = ({
	brand,
	title,
	description,
	children,
}: ToolViewCardProps) => (
	<section aria-label={title} className="flex min-w-0 flex-col gap-3 p-3">
		<div className="flex min-w-0 flex-col gap-0.5">
			<div className="flex min-w-0 items-center gap-2">
				<ConnectorBrandIcon brand={brand} className="size-5 shrink-0" />
				<H4 className="truncate font-medium text-sm" title={title}>
					{title}
				</H4>
			</div>
			{description ? (
				<Muted className="text-xs">{description}</Muted>
			) : null}
		</div>
		{children}
	</section>
);
