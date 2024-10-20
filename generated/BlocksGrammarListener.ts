// Generated from ./BlocksGrammar.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";

import { InterpolatedStringContext } from "./BlocksGrammarParser";
import { LogicalExpressionContext } from "./BlocksGrammarParser";
import { MathExpressionContext } from "./BlocksGrammarParser";
import { StringExpressionContext } from "./BlocksGrammarParser";
import { VariableExpressionContext } from "./BlocksGrammarParser";
import { ParenthesizedExpressionContext } from "./BlocksGrammarParser";
import { LiteralExpressionContext } from "./BlocksGrammarParser";
import { NullExpressionContext } from "./BlocksGrammarParser";
import { MathOperationContext } from "./BlocksGrammarParser";
import { LogicalOperationContext } from "./BlocksGrammarParser";
import { ProgramContext } from "./BlocksGrammarParser";
import { ExpressionContext } from "./BlocksGrammarParser";
import { LogicalExprContext } from "./BlocksGrammarParser";
import { MathExprContext } from "./BlocksGrammarParser";
import { StringExprContext } from "./BlocksGrammarParser";
import { VariableExprContext } from "./BlocksGrammarParser";
import { StringInterpolationContext } from "./BlocksGrammarParser";
import { LiteralExprContext } from "./BlocksGrammarParser";


/**
 * This interface defines a complete listener for a parse tree produced by
 * `BlocksGrammarParser`.
 */
export interface BlocksGrammarListener extends ParseTreeListener {
	/**
	 * Enter a parse tree produced by the `interpolatedString`
	 * labeled alternative in `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 */
	enterInterpolatedString?: (ctx: InterpolatedStringContext) => void;
	/**
	 * Exit a parse tree produced by the `interpolatedString`
	 * labeled alternative in `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 */
	exitInterpolatedString?: (ctx: InterpolatedStringContext) => void;

	/**
	 * Enter a parse tree produced by the `logicalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterLogicalExpression?: (ctx: LogicalExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `logicalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitLogicalExpression?: (ctx: LogicalExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `mathExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterMathExpression?: (ctx: MathExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `mathExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitMathExpression?: (ctx: MathExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `stringExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterStringExpression?: (ctx: StringExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `stringExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitStringExpression?: (ctx: StringExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `variableExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterVariableExpression?: (ctx: VariableExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `variableExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitVariableExpression?: (ctx: VariableExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `parenthesizedExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `parenthesizedExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `literalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterLiteralExpression?: (ctx: LiteralExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `literalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitLiteralExpression?: (ctx: LiteralExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `nullExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterNullExpression?: (ctx: NullExpressionContext) => void;
	/**
	 * Exit a parse tree produced by the `nullExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitNullExpression?: (ctx: NullExpressionContext) => void;

	/**
	 * Enter a parse tree produced by the `mathOperation`
	 * labeled alternative in `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 */
	enterMathOperation?: (ctx: MathOperationContext) => void;
	/**
	 * Exit a parse tree produced by the `mathOperation`
	 * labeled alternative in `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 */
	exitMathOperation?: (ctx: MathOperationContext) => void;

	/**
	 * Enter a parse tree produced by the `logicalOperation`
	 * labeled alternative in `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 */
	enterLogicalOperation?: (ctx: LogicalOperationContext) => void;
	/**
	 * Exit a parse tree produced by the `logicalOperation`
	 * labeled alternative in `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 */
	exitLogicalOperation?: (ctx: LogicalOperationContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.program`.
	 * @param ctx the parse tree
	 */
	enterProgram?: (ctx: ProgramContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.program`.
	 * @param ctx the parse tree
	 */
	exitProgram?: (ctx: ProgramContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	enterExpression?: (ctx: ExpressionContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 */
	exitExpression?: (ctx: ExpressionContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 */
	enterLogicalExpr?: (ctx: LogicalExprContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 */
	exitLogicalExpr?: (ctx: LogicalExprContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 */
	enterMathExpr?: (ctx: MathExprContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 */
	exitMathExpr?: (ctx: MathExprContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 */
	enterStringExpr?: (ctx: StringExprContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 */
	exitStringExpr?: (ctx: StringExprContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.variableExpr`.
	 * @param ctx the parse tree
	 */
	enterVariableExpr?: (ctx: VariableExprContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.variableExpr`.
	 * @param ctx the parse tree
	 */
	exitVariableExpr?: (ctx: VariableExprContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.stringInterpolation`.
	 * @param ctx the parse tree
	 */
	enterStringInterpolation?: (ctx: StringInterpolationContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.stringInterpolation`.
	 * @param ctx the parse tree
	 */
	exitStringInterpolation?: (ctx: StringInterpolationContext) => void;

	/**
	 * Enter a parse tree produced by `BlocksGrammarParser.literalExpr`.
	 * @param ctx the parse tree
	 */
	enterLiteralExpr?: (ctx: LiteralExprContext) => void;
	/**
	 * Exit a parse tree produced by `BlocksGrammarParser.literalExpr`.
	 * @param ctx the parse tree
	 */
	exitLiteralExpr?: (ctx: LiteralExprContext) => void;
}

