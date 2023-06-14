import { Content } from './Content.d';

type ColumnCalculation = {
    selected: Content;
};

type CustomCalculation = {
    custom: boolean;
    type: string;
    value: string;
};

type Calculation = ColumnCalculation | CustomCalculation;

export { ColumnCalculation, CustomCalculation, Calculation };
