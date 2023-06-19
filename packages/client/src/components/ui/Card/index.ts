import { Card, CardProps } from './Card';
import { CardHeader, CardHeaderProps } from './CardHeader';
import { CardContent, CardContentProps } from './CardContent';
import { CardFooter, CardFooterProps } from './CardFooter';

const CardNameSpace = Object.assign(Card, {
    Header: CardHeader,
    Content: CardContent,
    Footer: CardFooter,
});

export type { CardProps, CardHeaderProps, CardFooterProps, CardContentProps };
export { CardNameSpace as Card };
