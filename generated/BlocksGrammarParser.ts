// Generated from ./BlocksGrammar.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { FailedPredicateException } from "antlr4ts/FailedPredicateException";
import { NotNull } from "antlr4ts/Decorators";
import { NoViableAltException } from "antlr4ts/NoViableAltException";
import { Override } from "antlr4ts/Decorators";
import { Parser } from "antlr4ts/Parser";
import { ParserRuleContext } from "antlr4ts/ParserRuleContext";
import { ParserATNSimulator } from "antlr4ts/atn/ParserATNSimulator";
import { ParseTreeListener } from "antlr4ts/tree/ParseTreeListener";
import { ParseTreeVisitor } from "antlr4ts/tree/ParseTreeVisitor";
import { RecognitionException } from "antlr4ts/RecognitionException";
import { RuleContext } from "antlr4ts/RuleContext";
//import { RuleVersion } from "antlr4ts/RuleVersion";
import { TerminalNode } from "antlr4ts/tree/TerminalNode";
import { Token } from "antlr4ts/Token";
import { TokenStream } from "antlr4ts/TokenStream";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";

import { BlocksGrammarListener } from "./BlocksGrammarListener";
import { BlocksGrammarVisitor } from "./BlocksGrammarVisitor";


export class BlocksGrammarParser extends Parser {
	public static readonly INTERPOLATION = 1;
	public static readonly STRING_LITERAL = 2;
	public static readonly UNQUOTED_STRING = 3;
	public static readonly IDENTIFIER = 4;
	public static readonly IF = 5;
	public static readonly THEN = 6;
	public static readonly ELSE = 7;
	public static readonly OP = 8;
	public static readonly STOP = 9;
	public static readonly CONTINUE = 10;
	public static readonly VAR = 11;
	public static readonly BOOLEAN = 12;
	public static readonly NULL = 13;
	public static readonly NOT = 14;
	public static readonly EQ = 15;
	public static readonly COMMA = 16;
	public static readonly SEMI = 17;
	public static readonly LPAREN = 18;
	public static readonly RPAREN = 19;
	public static readonly LCURLY = 20;
	public static readonly RCURLY = 21;
	public static readonly LOGICAL_AND = 22;
	public static readonly LOGICAL_OR = 23;
	public static readonly INT = 24;
	public static readonly WORD = 25;
	public static readonly WS = 26;
	public static readonly NEWLINE = 27;
	public static readonly RULE_program = 0;
	public static readonly RULE_expression = 1;
	public static readonly RULE_logicalExpr = 2;
	public static readonly RULE_mathExpr = 3;
	public static readonly RULE_stringExpr = 4;
	public static readonly RULE_variableExpr = 5;
	public static readonly RULE_stringInterpolation = 6;
	public static readonly RULE_literalExpr = 7;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"program", "expression", "logicalExpr", "mathExpr", "stringExpr", "variableExpr", 
		"stringInterpolation", "literalExpr",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, "'if'", "'then'", 
		"'else'", undefined, "'stop'", "'continue'", "'var'", undefined, "'null'", 
		"'not'", "'='", "','", "';'", "'('", "')'", "'{'", "'}'", "'&&'", "'||'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, "INTERPOLATION", "STRING_LITERAL", "UNQUOTED_STRING", "IDENTIFIER", 
		"IF", "THEN", "ELSE", "OP", "STOP", "CONTINUE", "VAR", "BOOLEAN", "NULL", 
		"NOT", "EQ", "COMMA", "SEMI", "LPAREN", "RPAREN", "LCURLY", "RCURLY", 
		"LOGICAL_AND", "LOGICAL_OR", "INT", "WORD", "WS", "NEWLINE",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(BlocksGrammarParser._LITERAL_NAMES, BlocksGrammarParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return BlocksGrammarParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "BlocksGrammar.g4"; }

	// @Override
	public get ruleNames(): string[] { return BlocksGrammarParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return BlocksGrammarParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(BlocksGrammarParser._ATN, this);
	}
	// @RuleVersion(0)
	public program(): ProgramContext {
		let _localctx: ProgramContext = new ProgramContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, BlocksGrammarParser.RULE_program);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 19;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			while ((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << BlocksGrammarParser.INTERPOLATION) | (1 << BlocksGrammarParser.STRING_LITERAL) | (1 << BlocksGrammarParser.UNQUOTED_STRING) | (1 << BlocksGrammarParser.IDENTIFIER) | (1 << BlocksGrammarParser.BOOLEAN) | (1 << BlocksGrammarParser.NULL) | (1 << BlocksGrammarParser.LPAREN) | (1 << BlocksGrammarParser.INT))) !== 0)) {
				{
				{
				this.state = 16;
				this.expression();
				}
				}
				this.state = 21;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			}
			this.state = 22;
			this.match(BlocksGrammarParser.EOF);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public expression(): ExpressionContext {
		let _localctx: ExpressionContext = new ExpressionContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, BlocksGrammarParser.RULE_expression);
		try {
			this.state = 34;
			this._errHandler.sync(this);
			switch ( this.interpreter.adaptivePredict(this._input, 1, this._ctx) ) {
			case 1:
				_localctx = new LogicalExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 24;
				this.logicalExpr();
				}
				break;

			case 2:
				_localctx = new MathExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 25;
				this.mathExpr();
				}
				break;

			case 3:
				_localctx = new StringExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 26;
				this.stringExpr();
				}
				break;

			case 4:
				_localctx = new VariableExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 27;
				this.variableExpr();
				}
				break;

			case 5:
				_localctx = new ParenthesizedExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 5);
				{
				this.state = 28;
				this.match(BlocksGrammarParser.LPAREN);
				this.state = 29;
				this.expression();
				this.state = 30;
				this.match(BlocksGrammarParser.RPAREN);
				}
				break;

			case 6:
				_localctx = new LiteralExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 6);
				{
				this.state = 32;
				this.literalExpr();
				}
				break;

			case 7:
				_localctx = new NullExpressionContext(_localctx);
				this.enterOuterAlt(_localctx, 7);
				{
				this.state = 33;
				this.match(BlocksGrammarParser.NULL);
				}
				break;
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public logicalExpr(): LogicalExprContext {
		let _localctx: LogicalExprContext = new LogicalExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, BlocksGrammarParser.RULE_logicalExpr);
		let _la: number;
		try {
			_localctx = new LogicalOperationContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 36;
			this.match(BlocksGrammarParser.STRING_LITERAL);
			this.state = 37;
			_la = this._input.LA(1);
			if (!(_la === BlocksGrammarParser.LOGICAL_AND || _la === BlocksGrammarParser.LOGICAL_OR)) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			this.state = 38;
			this.match(BlocksGrammarParser.STRING_LITERAL);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public mathExpr(): MathExprContext {
		let _localctx: MathExprContext = new MathExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, BlocksGrammarParser.RULE_mathExpr);
		try {
			_localctx = new MathOperationContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 40;
			this.match(BlocksGrammarParser.INT);
			{
			this.state = 41;
			this.match(BlocksGrammarParser.OP);
			}
			this.state = 42;
			this.match(BlocksGrammarParser.INT);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public stringExpr(): StringExprContext {
		let _localctx: StringExprContext = new StringExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, BlocksGrammarParser.RULE_stringExpr);
		try {
			let _alt: number;
			_localctx = new InterpolatedStringContext(_localctx);
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 44;
			this.match(BlocksGrammarParser.STRING_LITERAL);
			this.state = 49;
			this._errHandler.sync(this);
			_alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx);
			while (_alt !== 2 && _alt !== ATN.INVALID_ALT_NUMBER) {
				if (_alt === 1) {
					{
					{
					this.state = 45;
					this.match(BlocksGrammarParser.INTERPOLATION);
					this.state = 46;
					this.stringInterpolation();
					}
					}
				}
				this.state = 51;
				this._errHandler.sync(this);
				_alt = this.interpreter.adaptivePredict(this._input, 2, this._ctx);
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public variableExpr(): VariableExprContext {
		let _localctx: VariableExprContext = new VariableExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, BlocksGrammarParser.RULE_variableExpr);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 52;
			this.match(BlocksGrammarParser.INTERPOLATION);
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public stringInterpolation(): StringInterpolationContext {
		let _localctx: StringInterpolationContext = new StringInterpolationContext(this._ctx, this.state);
		this.enterRule(_localctx, 12, BlocksGrammarParser.RULE_stringInterpolation);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 54;
			this.variableExpr();
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}
	// @RuleVersion(0)
	public literalExpr(): LiteralExprContext {
		let _localctx: LiteralExprContext = new LiteralExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 14, BlocksGrammarParser.RULE_literalExpr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 56;
			_la = this._input.LA(1);
			if (!((((_la) & ~0x1F) === 0 && ((1 << _la) & ((1 << BlocksGrammarParser.UNQUOTED_STRING) | (1 << BlocksGrammarParser.IDENTIFIER) | (1 << BlocksGrammarParser.BOOLEAN) | (1 << BlocksGrammarParser.NULL) | (1 << BlocksGrammarParser.INT))) !== 0))) {
			this._errHandler.recoverInline(this);
			} else {
				if (this._input.LA(1) === Token.EOF) {
					this.matchedEOF = true;
				}

				this._errHandler.reportMatch(this);
				this.consume();
			}
			}
		}
		catch (re) {
			if (re instanceof RecognitionException) {
				_localctx.exception = re;
				this._errHandler.reportError(this, re);
				this._errHandler.recover(this, re);
			} else {
				throw re;
			}
		}
		finally {
			this.exitRule();
		}
		return _localctx;
	}

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x1D=\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x04\b\t\b\x04\t\t\t\x03\x02\x07\x02\x14\n\x02\f\x02\x0E\x02\x17" +
		"\v\x02\x03\x02\x03\x02\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03\x03" +
		"\x03\x03\x03\x03\x03\x03\x03\x03\x05\x03%\n\x03\x03\x04\x03\x04\x03\x04" +
		"\x03\x04\x03\x05\x03\x05\x03\x05\x03\x05\x03\x06\x03\x06\x03\x06\x07\x06" +
		"2\n\x06\f\x06\x0E\x065\v\x06\x03\x07\x03\x07\x03\b\x03\b\x03\t\x03\t\x03" +
		"\t\x02\x02\x02\n\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x0E\x02\x10" +
		"\x02\x02\x04\x03\x02\x18\x19\x05\x02\x05\x06\x0E\x0F\x1A\x1A\x02<\x02" +
		"\x15\x03\x02\x02\x02\x04$\x03\x02\x02\x02\x06&\x03\x02\x02\x02\b*\x03" +
		"\x02\x02\x02\n.\x03\x02\x02\x02\f6\x03\x02\x02\x02\x0E8\x03\x02\x02\x02" +
		"\x10:\x03\x02\x02\x02\x12\x14\x05\x04\x03\x02\x13\x12\x03\x02\x02\x02" +
		"\x14\x17\x03\x02\x02\x02\x15\x13\x03\x02\x02\x02\x15\x16\x03\x02\x02\x02" +
		"\x16\x18\x03\x02\x02\x02\x17\x15\x03\x02\x02\x02\x18\x19\x07\x02\x02\x03" +
		"\x19\x03\x03\x02\x02\x02\x1A%\x05\x06\x04\x02\x1B%\x05\b\x05\x02\x1C%" +
		"\x05\n\x06\x02\x1D%\x05\f\x07\x02\x1E\x1F\x07\x14\x02\x02\x1F \x05\x04" +
		"\x03\x02 !\x07\x15\x02\x02!%\x03\x02\x02\x02\"%\x05\x10\t\x02#%\x07\x0F" +
		"\x02\x02$\x1A\x03\x02\x02\x02$\x1B\x03\x02\x02\x02$\x1C\x03\x02\x02\x02" +
		"$\x1D\x03\x02\x02\x02$\x1E\x03\x02\x02\x02$\"\x03\x02\x02\x02$#\x03\x02" +
		"\x02\x02%\x05\x03\x02\x02\x02&\'\x07\x04\x02\x02\'(\t\x02\x02\x02()\x07" +
		"\x04\x02\x02)\x07\x03\x02\x02\x02*+\x07\x1A\x02\x02+,\x07\n\x02\x02,-" +
		"\x07\x1A\x02\x02-\t\x03\x02\x02\x02.3\x07\x04\x02\x02/0\x07\x03\x02\x02" +
		"02\x05\x0E\b\x021/\x03\x02\x02\x0225\x03\x02\x02\x0231\x03\x02\x02\x02" +
		"34\x03\x02\x02\x024\v\x03\x02\x02\x0253\x03\x02\x02\x0267\x07\x03\x02" +
		"\x027\r\x03\x02\x02\x0289\x05\f\x07\x029\x0F\x03\x02\x02\x02:;\t\x03\x02" +
		"\x02;\x11\x03\x02\x02\x02\x05\x15$3";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!BlocksGrammarParser.__ATN) {
			BlocksGrammarParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(BlocksGrammarParser._serializedATN));
		}

		return BlocksGrammarParser.__ATN;
	}

}

export class ProgramContext extends ParserRuleContext {
	public EOF(): TerminalNode { return this.getToken(BlocksGrammarParser.EOF, 0); }
	public expression(): ExpressionContext[];
	public expression(i: number): ExpressionContext;
	public expression(i?: number): ExpressionContext | ExpressionContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExpressionContext);
		} else {
			return this.getRuleContext(i, ExpressionContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_program; }
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterProgram) {
			listener.enterProgram(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitProgram) {
			listener.exitProgram(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitProgram) {
			return visitor.visitProgram(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExpressionContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_expression; }
	public copyFrom(ctx: ExpressionContext): void {
		super.copyFrom(ctx);
	}
}
export class LogicalExpressionContext extends ExpressionContext {
	public logicalExpr(): LogicalExprContext {
		return this.getRuleContext(0, LogicalExprContext);
	}
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterLogicalExpression) {
			listener.enterLogicalExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitLogicalExpression) {
			listener.exitLogicalExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitLogicalExpression) {
			return visitor.visitLogicalExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class MathExpressionContext extends ExpressionContext {
	public mathExpr(): MathExprContext {
		return this.getRuleContext(0, MathExprContext);
	}
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterMathExpression) {
			listener.enterMathExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitMathExpression) {
			listener.exitMathExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitMathExpression) {
			return visitor.visitMathExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class StringExpressionContext extends ExpressionContext {
	public stringExpr(): StringExprContext {
		return this.getRuleContext(0, StringExprContext);
	}
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterStringExpression) {
			listener.enterStringExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitStringExpression) {
			listener.exitStringExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitStringExpression) {
			return visitor.visitStringExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class VariableExpressionContext extends ExpressionContext {
	public variableExpr(): VariableExprContext {
		return this.getRuleContext(0, VariableExprContext);
	}
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterVariableExpression) {
			listener.enterVariableExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitVariableExpression) {
			listener.exitVariableExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitVariableExpression) {
			return visitor.visitVariableExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class ParenthesizedExpressionContext extends ExpressionContext {
	public LPAREN(): TerminalNode { return this.getToken(BlocksGrammarParser.LPAREN, 0); }
	public expression(): ExpressionContext {
		return this.getRuleContext(0, ExpressionContext);
	}
	public RPAREN(): TerminalNode { return this.getToken(BlocksGrammarParser.RPAREN, 0); }
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterParenthesizedExpression) {
			listener.enterParenthesizedExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitParenthesizedExpression) {
			listener.exitParenthesizedExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitParenthesizedExpression) {
			return visitor.visitParenthesizedExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class LiteralExpressionContext extends ExpressionContext {
	public literalExpr(): LiteralExprContext {
		return this.getRuleContext(0, LiteralExprContext);
	}
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterLiteralExpression) {
			listener.enterLiteralExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitLiteralExpression) {
			listener.exitLiteralExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitLiteralExpression) {
			return visitor.visitLiteralExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}
export class NullExpressionContext extends ExpressionContext {
	public NULL(): TerminalNode { return this.getToken(BlocksGrammarParser.NULL, 0); }
	constructor(ctx: ExpressionContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterNullExpression) {
			listener.enterNullExpression(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitNullExpression) {
			listener.exitNullExpression(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitNullExpression) {
			return visitor.visitNullExpression(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LogicalExprContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_logicalExpr; }
	public copyFrom(ctx: LogicalExprContext): void {
		super.copyFrom(ctx);
	}
}
export class LogicalOperationContext extends LogicalExprContext {
	public STRING_LITERAL(): TerminalNode[];
	public STRING_LITERAL(i: number): TerminalNode;
	public STRING_LITERAL(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(BlocksGrammarParser.STRING_LITERAL);
		} else {
			return this.getToken(BlocksGrammarParser.STRING_LITERAL, i);
		}
	}
	public LOGICAL_AND(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.LOGICAL_AND, 0); }
	public LOGICAL_OR(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.LOGICAL_OR, 0); }
	constructor(ctx: LogicalExprContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterLogicalOperation) {
			listener.enterLogicalOperation(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitLogicalOperation) {
			listener.exitLogicalOperation(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitLogicalOperation) {
			return visitor.visitLogicalOperation(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class MathExprContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_mathExpr; }
	public copyFrom(ctx: MathExprContext): void {
		super.copyFrom(ctx);
	}
}
export class MathOperationContext extends MathExprContext {
	public INT(): TerminalNode[];
	public INT(i: number): TerminalNode;
	public INT(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(BlocksGrammarParser.INT);
		} else {
			return this.getToken(BlocksGrammarParser.INT, i);
		}
	}
	public OP(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.OP, 0); }
	constructor(ctx: MathExprContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterMathOperation) {
			listener.enterMathOperation(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitMathOperation) {
			listener.exitMathOperation(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitMathOperation) {
			return visitor.visitMathOperation(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StringExprContext extends ParserRuleContext {
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_stringExpr; }
	public copyFrom(ctx: StringExprContext): void {
		super.copyFrom(ctx);
	}
}
export class InterpolatedStringContext extends StringExprContext {
	public STRING_LITERAL(): TerminalNode { return this.getToken(BlocksGrammarParser.STRING_LITERAL, 0); }
	public INTERPOLATION(): TerminalNode[];
	public INTERPOLATION(i: number): TerminalNode;
	public INTERPOLATION(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(BlocksGrammarParser.INTERPOLATION);
		} else {
			return this.getToken(BlocksGrammarParser.INTERPOLATION, i);
		}
	}
	public stringInterpolation(): StringInterpolationContext[];
	public stringInterpolation(i: number): StringInterpolationContext;
	public stringInterpolation(i?: number): StringInterpolationContext | StringInterpolationContext[] {
		if (i === undefined) {
			return this.getRuleContexts(StringInterpolationContext);
		} else {
			return this.getRuleContext(i, StringInterpolationContext);
		}
	}
	constructor(ctx: StringExprContext) {
		super(ctx.parent, ctx.invokingState);
		this.copyFrom(ctx);
	}
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterInterpolatedString) {
			listener.enterInterpolatedString(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitInterpolatedString) {
			listener.exitInterpolatedString(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitInterpolatedString) {
			return visitor.visitInterpolatedString(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class VariableExprContext extends ParserRuleContext {
	public INTERPOLATION(): TerminalNode { return this.getToken(BlocksGrammarParser.INTERPOLATION, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_variableExpr; }
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterVariableExpr) {
			listener.enterVariableExpr(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitVariableExpr) {
			listener.exitVariableExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitVariableExpr) {
			return visitor.visitVariableExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class StringInterpolationContext extends ParserRuleContext {
	public variableExpr(): VariableExprContext {
		return this.getRuleContext(0, VariableExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_stringInterpolation; }
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterStringInterpolation) {
			listener.enterStringInterpolation(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitStringInterpolation) {
			listener.exitStringInterpolation(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitStringInterpolation) {
			return visitor.visitStringInterpolation(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class LiteralExprContext extends ParserRuleContext {
	public BOOLEAN(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.BOOLEAN, 0); }
	public INT(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.INT, 0); }
	public NULL(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.NULL, 0); }
	public IDENTIFIER(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.IDENTIFIER, 0); }
	public UNQUOTED_STRING(): TerminalNode | undefined { return this.tryGetToken(BlocksGrammarParser.UNQUOTED_STRING, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlocksGrammarParser.RULE_literalExpr; }
	// @Override
	public enterRule(listener: BlocksGrammarListener): void {
		if (listener.enterLiteralExpr) {
			listener.enterLiteralExpr(this);
		}
	}
	// @Override
	public exitRule(listener: BlocksGrammarListener): void {
		if (listener.exitLiteralExpr) {
			listener.exitLiteralExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlocksGrammarVisitor<Result>): Result {
		if (visitor.visitLiteralExpr) {
			return visitor.visitLiteralExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


