import { Calculation } from './Calculation.d';

type App = {
    display: string;
    image: string;
    value: string;
};

type FormulaData = {
    calculation: Calculation;
    app: App;
};

export { FormulaData };
