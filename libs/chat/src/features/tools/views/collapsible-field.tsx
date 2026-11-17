import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useTranslation } from "@semoss/i18n";
import { Badge, Button, cn, Label } from "@semoss/ui/next";

/** Props for {@link CollapsibleField}. */
interface CollapsibleFieldProps {
	/** The parameter's name, shown as the label and matching its input's id. */
	fieldName: string;
	/** Whether the parameter is required, which marks its label. */
	required?: boolean;
	/** The schema type shown beside the label. */
	badge: string;
	/** The field's input and description. */
	children: ReactNode;
}

/**
 * Wraps a field that can render a lot of content (a multiline string, an
 * array, or an object) with a collapse toggle, so a card with several long
 * fields can be scanned/scrolled without paging through all of them.
 */
export const CollapsibleField = ({
	fieldName,
	required,
	badge,
	children,
}: CollapsibleFieldProps) => {
	const { t } = useTranslation("mcp");
	const [isCollapsed, setIsCollapsed] = useState(false);

	return (
		<div className="space-y-1">
			<div className="mb-2 flex items-center gap-2">
				<Button
					type="button"
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0 text-muted-foreground"
					onClick={() => setIsCollapsed((prev) => !prev)}
					aria-label={t(
						isCollapsed
							? "tools.expandField"
							: "tools.collapseField",
					)}
				>
					<ChevronDown
						className={cn(
							"size-4 transition-transform",
							isCollapsed && "-rotate-90",
						)}
					/>
				</Button>
				<Label htmlFor={fieldName} className="font-semibold">
					{fieldName}
					{required && <span className="text-destructive"> *</span>}
				</Label>
				<Badge variant="outline" className="text-xs">
					{badge}
				</Badge>
			</div>
			{!isCollapsed && children}
		</div>
	);
};
