import { Card, CardProps } from "./Card";
import { CardContent, CardContentProps } from "./CardContent";
import { CardHeader, CardHeaderProps } from "./CardHeader";
import { CardActionArea, CardActionAreaProps } from "./CardActionArea";
import { CardActions, CardActionsProps } from "./CardActions";
import { CardMedia, CardMediaProps } from "./CardMedia";

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
