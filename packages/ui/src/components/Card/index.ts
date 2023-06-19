import { Card as _Card, CardProps } from "./Card";
import { _CardContent, _CardContentProps } from "./CardContent";
import { _CardHeader, _CardHeaderProps } from "./CardHeader";
import { _CardActions, _CardActionsProps } from "./CardActions";
import { _CardMedia, _CardMediaProps } from "./CardMedia";

const CardNameSpace = Object.assign(_Card, {
    Content: _CardContent,
    Header: _CardHeader,
    Actions: _CardActions,
    Media: _CardMedia,
});

export type {
    CardProps,
    _CardContentProps,
    _CardHeaderProps,
    _CardActionsProps,
    _CardMediaProps,
};

export { CardNameSpace as Card };
