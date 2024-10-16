// Generated from ./BlockGrammar.g4 by ANTLR 4.9.0-SNAPSHOT


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

import { BlockGrammarListener } from "./BlockGrammarListener";
import { BlockGrammarVisitor } from "./BlockGrammarVisitor";


export class BlockGrammarParser extends Parser {
	public static readonly T__0 = 1;
	public static readonly T__1 = 2;
	public static readonly T__2 = 3;
	public static readonly T__3 = 4;
	public static readonly T__4 = 5;
	public static readonly T__5 = 6;
	public static readonly IDENTIFIER = 7;
	public static readonly IF = 8;
	public static readonly THEN = 9;
	public static readonly ELSE = 10;
	public static readonly OP = 11;
	public static readonly STOP = 12;
	public static readonly CONTINUE = 13;
	public static readonly VAR = 14;
	public static readonly NUMBER = 15;
	public static readonly WORD = 16;
	public static readonly SPACES = 17;
	public static readonly RULE_file = 0;
	public static readonly RULE_declaration = 1;
	public static readonly RULE_expr = 2;
	public static readonly RULE_assignment = 3;
	public static readonly RULE_if_statement = 4;
	public static readonly RULE_command = 5;
	// tslint:disable:no-trailing-whitespace
	public static readonly ruleNames: string[] = [
		"file", "declaration", "expr", "assignment", "if_statement", "command",
	];

	private static readonly _LITERAL_NAMES: Array<string | undefined> = [
		undefined, "';'", "'='", "'('", "')'", "'{'", "'}'", undefined, "'if'", 
		"'then'", "'else'", undefined, "'stop'", "'continue'", "'var'",
	];
	private static readonly _SYMBOLIC_NAMES: Array<string | undefined> = [
		undefined, undefined, undefined, undefined, undefined, undefined, undefined, 
		"IDENTIFIER", "IF", "THEN", "ELSE", "OP", "STOP", "CONTINUE", "VAR", "NUMBER", 
		"WORD", "SPACES",
	];
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(BlockGrammarParser._LITERAL_NAMES, BlockGrammarParser._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return BlockGrammarParser.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace

	// @Override
	public get grammarFileName(): string { return "BlockGrammar.g4"; }

	// @Override
	public get ruleNames(): string[] { return BlockGrammarParser.ruleNames; }

	// @Override
	public get serializedATN(): string { return BlockGrammarParser._serializedATN; }

	protected createFailedPredicateException(predicate?: string, message?: string): FailedPredicateException {
		return new FailedPredicateException(this, predicate, message);
	}

	constructor(input: TokenStream) {
		super(input);
		this._interp = new ParserATNSimulator(BlockGrammarParser._ATN, this);
	}
	// @RuleVersion(0)
	public file(): FileContext {
		let _localctx: FileContext = new FileContext(this._ctx, this.state);
		this.enterRule(_localctx, 0, BlockGrammarParser.RULE_file);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 21;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			do {
				{
				this.state = 21;
				this._errHandler.sync(this);
				switch ( this.interpreter.adaptivePredict(this._input, 0, this._ctx) ) {
				case 1:
					{
					this.state = 12;
					this.expr();
					this.state = 13;
					this.match(BlockGrammarParser.T__0);
					}
					break;

				case 2:
					{
					this.state = 15;
					this.declaration();
					this.state = 16;
					this.match(BlockGrammarParser.T__0);
					}
					break;

				case 3:
					{
					this.state = 18;
					this.assignment();
					this.state = 19;
					this.match(BlockGrammarParser.T__0);
					}
					break;
				}
				}
				this.state = 23;
				this._errHandler.sync(this);
				_la = this._input.LA(1);
			} while (_la === BlockGrammarParser.IDENTIFIER || _la === BlockGrammarParser.VAR);
			this.state = 25;
			this.match(BlockGrammarParser.EOF);
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
	public declaration(): DeclarationContext {
		let _localctx: DeclarationContext = new DeclarationContext(this._ctx, this.state);
		this.enterRule(_localctx, 2, BlockGrammarParser.RULE_declaration);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 27;
			this.match(BlockGrammarParser.VAR);
			this.state = 28;
			this.match(BlockGrammarParser.IDENTIFIER);
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
	public expr(): ExprContext {
		let _localctx: ExprContext = new ExprContext(this._ctx, this.state);
		this.enterRule(_localctx, 4, BlockGrammarParser.RULE_expr);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 30;
			this.match(BlockGrammarParser.IDENTIFIER);
			this.state = 33;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === BlockGrammarParser.OP) {
				{
				this.state = 31;
				this.match(BlockGrammarParser.OP);
				this.state = 32;
				this.match(BlockGrammarParser.IDENTIFIER);
				}
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
	public assignment(): AssignmentContext {
		let _localctx: AssignmentContext = new AssignmentContext(this._ctx, this.state);
		this.enterRule(_localctx, 6, BlockGrammarParser.RULE_assignment);
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 35;
			this.match(BlockGrammarParser.IDENTIFIER);
			this.state = 36;
			this.match(BlockGrammarParser.T__1);
			this.state = 39;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case BlockGrammarParser.NUMBER:
				{
				this.state = 37;
				this.match(BlockGrammarParser.NUMBER);
				}
				break;
			case BlockGrammarParser.IDENTIFIER:
				{
				this.state = 38;
				this.expr();
				}
				break;
			default:
				throw new NoViableAltException(this);
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
	public if_statement(): If_statementContext {
		let _localctx: If_statementContext = new If_statementContext(this._ctx, this.state);
		this.enterRule(_localctx, 8, BlockGrammarParser.RULE_if_statement);
		let _la: number;
		try {
			this.enterOuterAlt(_localctx, 1);
			{
			this.state = 41;
			this.match(BlockGrammarParser.IF);
			this.state = 42;
			this.match(BlockGrammarParser.T__2);
			this.state = 43;
			this.expr();
			this.state = 44;
			this.match(BlockGrammarParser.T__3);
			this.state = 45;
			this.match(BlockGrammarParser.THEN);
			this.state = 46;
			this.match(BlockGrammarParser.T__4);
			this.state = 47;
			this.command();
			this.state = 48;
			this.match(BlockGrammarParser.T__5);
			this.state = 54;
			this._errHandler.sync(this);
			_la = this._input.LA(1);
			if (_la === BlockGrammarParser.ELSE) {
				{
				this.state = 49;
				this.match(BlockGrammarParser.ELSE);
				this.state = 50;
				this.match(BlockGrammarParser.T__4);
				this.state = 51;
				this.command();
				this.state = 52;
				this.match(BlockGrammarParser.T__5);
				}
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
	public command(): CommandContext {
		let _localctx: CommandContext = new CommandContext(this._ctx, this.state);
		this.enterRule(_localctx, 10, BlockGrammarParser.RULE_command);
		try {
			this.state = 60;
			this._errHandler.sync(this);
			switch (this._input.LA(1)) {
			case BlockGrammarParser.STOP:
				this.enterOuterAlt(_localctx, 1);
				{
				this.state = 56;
				this.match(BlockGrammarParser.STOP);
				}
				break;
			case BlockGrammarParser.CONTINUE:
				this.enterOuterAlt(_localctx, 2);
				{
				this.state = 57;
				this.match(BlockGrammarParser.CONTINUE);
				}
				break;
			case BlockGrammarParser.IF:
				this.enterOuterAlt(_localctx, 3);
				{
				this.state = 58;
				this.if_statement();
				}
				break;
			case BlockGrammarParser.IDENTIFIER:
				this.enterOuterAlt(_localctx, 4);
				{
				this.state = 59;
				this.assignment();
				}
				break;
			default:
				throw new NoViableAltException(this);
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
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x03\x13A\x04\x02" +
		"\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04\x07" +
		"\t\x07\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02\x03\x02" +
		"\x03\x02\x06\x02\x18\n\x02\r\x02\x0E\x02\x19\x03\x02\x03\x02\x03\x03\x03" +
		"\x03\x03\x03\x03\x04\x03\x04\x03\x04\x05\x04$\n\x04\x03\x05\x03\x05\x03" +
		"\x05\x03\x05\x05\x05*\n\x05\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03" +
		"\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x03\x06\x05\x069" +
		"\n\x06\x03\x07\x03\x07\x03\x07\x03\x07\x05\x07?\n\x07\x03\x07\x02\x02" +
		"\x02\b\x02\x02\x04\x02\x06\x02\b\x02\n\x02\f\x02\x02\x02\x02C\x02\x17" +
		"\x03\x02\x02\x02\x04\x1D\x03\x02\x02\x02\x06 \x03\x02\x02\x02\b%\x03\x02" +
		"\x02\x02\n+\x03\x02\x02\x02\f>\x03\x02\x02\x02\x0E\x0F\x05\x06\x04\x02" +
		"\x0F\x10\x07\x03\x02\x02\x10\x18\x03\x02\x02\x02\x11\x12\x05\x04\x03\x02" +
		"\x12\x13\x07\x03\x02\x02\x13\x18\x03\x02\x02\x02\x14\x15\x05\b\x05\x02" +
		"\x15\x16\x07\x03\x02\x02\x16\x18\x03\x02\x02\x02\x17\x0E\x03\x02\x02\x02" +
		"\x17\x11\x03\x02\x02\x02\x17\x14\x03\x02\x02\x02\x18\x19\x03\x02\x02\x02" +
		"\x19\x17\x03\x02\x02\x02\x19\x1A\x03\x02\x02\x02\x1A\x1B\x03\x02\x02\x02" +
		"\x1B\x1C\x07\x02\x02\x03\x1C\x03\x03\x02\x02\x02\x1D\x1E\x07\x10\x02\x02" +
		"\x1E\x1F\x07\t\x02\x02\x1F\x05\x03\x02\x02\x02 #\x07\t\x02\x02!\"\x07" +
		"\r\x02\x02\"$\x07\t\x02\x02#!\x03\x02\x02\x02#$\x03\x02\x02\x02$\x07\x03" +
		"\x02\x02\x02%&\x07\t\x02\x02&)\x07\x04\x02\x02\'*\x07\x11\x02\x02(*\x05" +
		"\x06\x04\x02)\'\x03\x02\x02\x02)(\x03\x02\x02\x02*\t\x03\x02\x02\x02+" +
		",\x07\n\x02\x02,-\x07\x05\x02\x02-.\x05\x06\x04\x02./\x07\x06\x02\x02" +
		"/0\x07\v\x02\x0201\x07\x07\x02\x0212\x05\f\x07\x0228\x07\b\x02\x0234\x07" +
		"\f\x02\x0245\x07\x07\x02\x0256\x05\f\x07\x0267\x07\b\x02\x0279\x03\x02" +
		"\x02\x0283\x03\x02\x02\x0289\x03\x02\x02\x029\v\x03\x02\x02\x02:?\x07" +
		"\x0E\x02\x02;?\x07\x0F\x02\x02<?\x05\n\x06\x02=?\x05\b\x05\x02>:\x03\x02" +
		"\x02\x02>;\x03\x02\x02\x02><\x03\x02\x02\x02>=\x03\x02\x02\x02?\r\x03" +
		"\x02\x02\x02\b\x17\x19#)8>";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!BlockGrammarParser.__ATN) {
			BlockGrammarParser.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(BlockGrammarParser._serializedATN));
		}

		return BlockGrammarParser.__ATN;
	}

}

export class FileContext extends ParserRuleContext {
	public EOF(): TerminalNode { return this.getToken(BlockGrammarParser.EOF, 0); }
	public expr(): ExprContext[];
	public expr(i: number): ExprContext;
	public expr(i?: number): ExprContext | ExprContext[] {
		if (i === undefined) {
			return this.getRuleContexts(ExprContext);
		} else {
			return this.getRuleContext(i, ExprContext);
		}
	}
	public declaration(): DeclarationContext[];
	public declaration(i: number): DeclarationContext;
	public declaration(i?: number): DeclarationContext | DeclarationContext[] {
		if (i === undefined) {
			return this.getRuleContexts(DeclarationContext);
		} else {
			return this.getRuleContext(i, DeclarationContext);
		}
	}
	public assignment(): AssignmentContext[];
	public assignment(i: number): AssignmentContext;
	public assignment(i?: number): AssignmentContext | AssignmentContext[] {
		if (i === undefined) {
			return this.getRuleContexts(AssignmentContext);
		} else {
			return this.getRuleContext(i, AssignmentContext);
		}
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_file; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterFile) {
			listener.enterFile(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitFile) {
			listener.exitFile(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitFile) {
			return visitor.visitFile(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class DeclarationContext extends ParserRuleContext {
	public VAR(): TerminalNode { return this.getToken(BlockGrammarParser.VAR, 0); }
	public IDENTIFIER(): TerminalNode { return this.getToken(BlockGrammarParser.IDENTIFIER, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_declaration; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterDeclaration) {
			listener.enterDeclaration(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitDeclaration) {
			listener.exitDeclaration(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitDeclaration) {
			return visitor.visitDeclaration(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class ExprContext extends ParserRuleContext {
	public IDENTIFIER(): TerminalNode[];
	public IDENTIFIER(i: number): TerminalNode;
	public IDENTIFIER(i?: number): TerminalNode | TerminalNode[] {
		if (i === undefined) {
			return this.getTokens(BlockGrammarParser.IDENTIFIER);
		} else {
			return this.getToken(BlockGrammarParser.IDENTIFIER, i);
		}
	}
	public OP(): TerminalNode | undefined { return this.tryGetToken(BlockGrammarParser.OP, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_expr; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterExpr) {
			listener.enterExpr(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitExpr) {
			listener.exitExpr(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitExpr) {
			return visitor.visitExpr(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class AssignmentContext extends ParserRuleContext {
	public IDENTIFIER(): TerminalNode { return this.getToken(BlockGrammarParser.IDENTIFIER, 0); }
	public NUMBER(): TerminalNode | undefined { return this.tryGetToken(BlockGrammarParser.NUMBER, 0); }
	public expr(): ExprContext | undefined {
		return this.tryGetRuleContext(0, ExprContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_assignment; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterAssignment) {
			listener.enterAssignment(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitAssignment) {
			listener.exitAssignment(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitAssignment) {
			return visitor.visitAssignment(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class If_statementContext extends ParserRuleContext {
	public IF(): TerminalNode { return this.getToken(BlockGrammarParser.IF, 0); }
	public expr(): ExprContext {
		return this.getRuleContext(0, ExprContext);
	}
	public THEN(): TerminalNode { return this.getToken(BlockGrammarParser.THEN, 0); }
	public command(): CommandContext[];
	public command(i: number): CommandContext;
	public command(i?: number): CommandContext | CommandContext[] {
		if (i === undefined) {
			return this.getRuleContexts(CommandContext);
		} else {
			return this.getRuleContext(i, CommandContext);
		}
	}
	public ELSE(): TerminalNode | undefined { return this.tryGetToken(BlockGrammarParser.ELSE, 0); }
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_if_statement; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterIf_statement) {
			listener.enterIf_statement(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitIf_statement) {
			listener.exitIf_statement(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitIf_statement) {
			return visitor.visitIf_statement(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


export class CommandContext extends ParserRuleContext {
	public STOP(): TerminalNode | undefined { return this.tryGetToken(BlockGrammarParser.STOP, 0); }
	public CONTINUE(): TerminalNode | undefined { return this.tryGetToken(BlockGrammarParser.CONTINUE, 0); }
	public if_statement(): If_statementContext | undefined {
		return this.tryGetRuleContext(0, If_statementContext);
	}
	public assignment(): AssignmentContext | undefined {
		return this.tryGetRuleContext(0, AssignmentContext);
	}
	constructor(parent: ParserRuleContext | undefined, invokingState: number) {
		super(parent, invokingState);
	}
	// @Override
	public get ruleIndex(): number { return BlockGrammarParser.RULE_command; }
	// @Override
	public enterRule(listener: BlockGrammarListener): void {
		if (listener.enterCommand) {
			listener.enterCommand(this);
		}
	}
	// @Override
	public exitRule(listener: BlockGrammarListener): void {
		if (listener.exitCommand) {
			listener.exitCommand(this);
		}
	}
	// @Override
	public accept<Result>(visitor: BlockGrammarVisitor<Result>): Result {
		if (visitor.visitCommand) {
			return visitor.visitCommand(this);
		} else {
			return visitor.visitChildren(this);
		}
	}
}


