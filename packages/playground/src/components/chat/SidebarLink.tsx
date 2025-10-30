import type React from "react";
import { Link, matchPath, useLocation } from "react-router-dom";
import { List, styled } from "@semoss/ui";

const StyledLink = styled(Link)(() => ({
	width: "100%",
	color: "inherit",
	textDecoration: "none",
	cursor: "pointer",
}));

const StyledLinkButton = styled(List.ItemButton, {
	shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
	gap: "16px",
	padding: "8px 16px",
	color: selected ? theme.palette.primary.main : undefined,
	backgroundColor: selected ? theme.palette.primary.selected : undefined,
	borderRadius: theme.shape.borderRadiusSm,
})) as unknown as typeof List.ItemButton;

const StyledLinkButtonIcon = styled(List.ItemIcon, {
	shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
	color: selected ? theme.palette.primary.main : theme.palette.secondary.dark,
	minWidth: "auto",
}));

interface SidebarLinkProps {
	/** Name of the path */
	name: string;

	/** Where the link takes you */
	path: string;

	/** Icon */
	icon: React.ReactNode;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({
	name,
	icon,
	path,
}) => {
	const { pathname } = useLocation();

	const isSelected = !!matchPath(path, pathname);

	return (
		<StyledLink to={path} aria-label={name} replace={true}>
			<StyledLinkButton selected={isSelected}>
				<StyledLinkButtonIcon selected={isSelected}>
					{icon}
				</StyledLinkButtonIcon>
				<List.ItemText
					primary={name}
					primaryTypographyProps={{
						variant: "body1",
					}}
				/>
			</StyledLinkButton>
		</StyledLink>
	);
};
