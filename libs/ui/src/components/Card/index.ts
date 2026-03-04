import { Card, type CardProps } from "./Card";
import { CardActionArea, type CardActionAreaProps } from "./CardActionArea";
import { CardActions, type CardActionsProps } from "./CardActions";
import { CardContent, type CardContentProps } from "./CardContent";
import { CardHeader, type CardHeaderProps } from "./CardHeader";
import { CardMedia, type CardMediaProps } from "./CardMedia";

const CardNameSpace = Object.assign(Card, {
	Content: CardContent,
	Header: CardHeader,
	ActionsArea: CardActionArea,
	Actions: CardActions,
	Media: CardMedia,
});

export type {
	CardProps,
	CardContentProps,
	CardHeaderProps,
	CardActionAreaProps,
	CardActionsProps,
	CardMediaProps,
};

export { CardNameSpace as Card };
