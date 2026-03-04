import React, { forwardRef, type JSX } from "react";
import { cn } from "@/lib/utils";

// Reusable helper to create components with consistent structure
const createComponent = <T extends HTMLElement>(
	tag: keyof JSX.IntrinsicElements,
	defaultClassName: string,
	displayName: string,
) => {
	const Component = forwardRef<T, React.HTMLAttributes<T>>((props, ref) => {
		return React.createElement(
			tag,
			{ ...props, ref, className: cn(defaultClassName, props.className) },
			props.children,
		);
	});
	Component.displayName = displayName;
	return Component;
};

export const H1 = createComponent<HTMLHeadingElement>(
	"h1",
	"font-bold text-4xl leading-normal",
	"H1",
);

export const H2 = createComponent<HTMLHeadingElement>(
	"h2",
	"font-bold text-3xl leading-normal",
	"H2",
);

export const H3 = createComponent<HTMLHeadingElement>(
	"h3",
	"font-semibold text-2xl leading-normal",
	"H3",
);

export const H4 = createComponent<HTMLHeadingElement>(
	"h4",
	"font-semibold text-xl leading-normal",
	"H4",
);

export const Lead = createComponent<HTMLParagraphElement>(
	"p",
	"font-normal text-muted-foreground text-xl leading-normal",
	"Lead",
);

export const P = createComponent<HTMLParagraphElement>(
	"p",
	"font-normal text-base leading-normal",
	"P",
);

export const Large = createComponent<HTMLDivElement>(
	"div",
	"font-semibold text-lg leading-normal",
	"Large",
);

export const Small = createComponent<HTMLParagraphElement>(
	"p",
	"font-medium text-sm leading-sm",
	"Small",
);

export const Muted = createComponent<HTMLSpanElement>(
	"span",
	"font-medium text-muted-foreground text-sm leading-normal",
	"Muted",
);

export const InlineCode = createComponent<HTMLSpanElement>(
	"code",
	"inline-flex items-center justify-center rounded-sm bg-muted px-[4.8px] py-[3.2px] font-mono font-normal text-foreground text-sm leading-5",
	"InlineCode",
);

export const MultilineCode = createComponent<HTMLPreElement>(
	"pre",
	"flex flex-col items-center justify-center rounded-lg border-border bg-zinc-900 p-4 font-mono font-normal text-base text-white leading-6",
	"MultilineCode",
);

export const List = createComponent<HTMLUListElement>(
	"ul",
	"inline-flex list-disc flex-col items-start gap-2 my-6 ml-6 font-normal font-sans text-base text-foreground",
	"List",
);

export const Quote = createComponent<HTMLQuoteElement>(
	"blockquote",
	"flex items-center gap-2 self-stretch border-border border-l-2 ml-6 text-base text-foreground italic leading-normal",
	"Quote",
);
