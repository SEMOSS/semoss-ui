import { FormulaData } from './FormulaData.d';

interface BaseFormula {
    type: string;
    leaf?: any;
    placeholder?: string;
}

interface ExpressionFormula extends BaseFormula {
    expression: string;
    left: Formula;
    right: Formula;
}

interface ValueFormula extends BaseFormula {
    name: string;
    data: FormulaData;
}

type Formula = BaseFormula | ExpressionFormula | ValueFormula;

export { Formula, ExpressionFormula, ValueFormula };
i;
