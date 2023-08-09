import { Card, CardProps } from "./Card";
import { CardContent, CardContentProps } from "./CardContent";
import { CardHeader, CardHeaderProps } from "./CardHeader";
import { CardActions, CardActionsProps } from "./CardActions";
import { CardMedia, CardMediaProps } from "./CardMedia";

const CardNameSpace = Object.assign(Card, {
    Content: CardContent,
    Header: CardHeader,
    Actions: CardActions,
    Media: CardMedia,
});

export type {
    CardProps,
    CardContentProps,
    CardHeaderProps,
    CardActionsProps,
    CardMediaProps,
};

export { CardNameSpace as Card };
