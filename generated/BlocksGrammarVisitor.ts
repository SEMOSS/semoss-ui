// Generated from ./BlocksGrammar.g4 by ANTLR 4.9.0-SNAPSHOT


import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";

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
 * This interface defines a complete generic visitor for a parse tree produced
 * by `BlocksGrammarParser`.
 *
 * @param <Result> The return type of the visit operation. Use `void` for
 * operations with no return type.
 */
export interface BlocksGrammarVisitor<Result> extends ParseTreeVisitor<Result> {
	/**
	 * Visit a parse tree produced by the `interpolatedString`
	 * labeled alternative in `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitInterpolatedString?: (ctx: InterpolatedStringContext) => Result;

	/**
	 * Visit a parse tree produced by the `logicalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLogicalExpression?: (ctx: LogicalExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `mathExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMathExpression?: (ctx: MathExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `stringExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStringExpression?: (ctx: StringExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `variableExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariableExpression?: (ctx: VariableExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `parenthesizedExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitParenthesizedExpression?: (ctx: ParenthesizedExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `literalExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLiteralExpression?: (ctx: LiteralExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `nullExpression`
	 * labeled alternative in `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitNullExpression?: (ctx: NullExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by the `mathOperation`
	 * labeled alternative in `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMathOperation?: (ctx: MathOperationContext) => Result;

	/**
	 * Visit a parse tree produced by the `logicalOperation`
	 * labeled alternative in `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLogicalOperation?: (ctx: LogicalOperationContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.program`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitProgram?: (ctx: ProgramContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.expression`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitExpression?: (ctx: ExpressionContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.logicalExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLogicalExpr?: (ctx: LogicalExprContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.mathExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitMathExpr?: (ctx: MathExprContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.stringExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStringExpr?: (ctx: StringExprContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.variableExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitVariableExpr?: (ctx: VariableExprContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.stringInterpolation`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitStringInterpolation?: (ctx: StringInterpolationContext) => Result;

	/**
	 * Visit a parse tree produced by `BlocksGrammarParser.literalExpr`.
	 * @param ctx the parse tree
	 * @return the visitor result
	 */
	visitLiteralExpr?: (ctx: LiteralExprContext) => Result;
}

