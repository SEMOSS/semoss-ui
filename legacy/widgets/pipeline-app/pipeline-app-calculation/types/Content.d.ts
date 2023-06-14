import { Selector } from './Selector.d';

type IfElseContent = {
    alias: string;
    antecedent?: Selector[];
    condition?: Selector[];
    precedent?: Selector[];
};

type ConstantContent = {
    alias: string;
    constant?: string;
};

type ArithmeticContent = {
    alias: string;
    left?: Selector[];
    mathExpr?: string;
    right?: Selector[];
};

type ColumnContent = {
    alias: string;
    column?: string;
    table?: string;
};

type Content = IfElseContent &
    ConstantContent &
    ArithmeticContent &
    ColumnContent;

export {
    IfElseContent,
    ConstantContent,
    ArithmeticContent,
    ColumnContent,
    Content,
};
