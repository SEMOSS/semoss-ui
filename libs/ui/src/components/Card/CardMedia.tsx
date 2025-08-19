import { CardMedia as MuiCardMedia, type SxProps } from "@mui/material";
import type { ReactNode } from "react";

export interface CardMediaProps {
	/**
	 * The content of the component.
	 */
	children?: ReactNode;

	/**
	 * Image to be displayed as a background image.
	 * Either `image` or `src` prop must be specified.
	 * Note that caller must specify height otherwise the image will not be visible.
	 */
	image?: string;

	/**
	 * An alias for `image` property.
	 * Available only with media components.
	 * Media components: `video`, `audio`, `picture`, `iframe`, `img`.
	 */
	src?: string;

	/**
	 * The system prop that allows defining system overrides as well as additional CSS styles.
	 */
	sx?: SxProps;
}

export const CardMedia = (props: CardMediaProps) => {
	const { sx, children } = props;
	return (
		<MuiCardMedia sx={sx} {...props}>
			{children}
		</MuiCardMedia>
	);
};
