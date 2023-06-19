import { Calculation } from './Calculation';

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
