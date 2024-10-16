// Generated from ./BlockGrammar.g4 by ANTLR 4.9.0-SNAPSHOT


import { ATN } from "antlr4ts/atn/ATN";
import { ATNDeserializer } from "antlr4ts/atn/ATNDeserializer";
import { CharStream } from "antlr4ts/CharStream";
import { Lexer } from "antlr4ts/Lexer";
import { LexerATNSimulator } from "antlr4ts/atn/LexerATNSimulator";
import { NotNull } from "antlr4ts/Decorators";
import { Override } from "antlr4ts/Decorators";
import { RuleContext } from "antlr4ts/RuleContext";
import { Vocabulary } from "antlr4ts/Vocabulary";
import { VocabularyImpl } from "antlr4ts/VocabularyImpl";

import * as Utils from "antlr4ts/misc/Utils";


export class BlockGrammarLexer extends Lexer {
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

	// tslint:disable:no-trailing-whitespace
	public static readonly channelNames: string[] = [
		"DEFAULT_TOKEN_CHANNEL", "HIDDEN",
	];

	// tslint:disable:no-trailing-whitespace
	public static readonly modeNames: string[] = [
		"DEFAULT_MODE",
	];

	public static readonly ruleNames: string[] = [
		"T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "IDENTIFIER", "IF", "THEN", 
		"ELSE", "OP", "STOP", "CONTINUE", "VAR", "NUMBER", "WORD", "SPACES",
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
	public static readonly VOCABULARY: Vocabulary = new VocabularyImpl(BlockGrammarLexer._LITERAL_NAMES, BlockGrammarLexer._SYMBOLIC_NAMES, []);

	// @Override
	// @NotNull
	public get vocabulary(): Vocabulary {
		return BlockGrammarLexer.VOCABULARY;
	}
	// tslint:enable:no-trailing-whitespace


	constructor(input: CharStream) {
		super(input);
		this._interp = new LexerATNSimulator(BlockGrammarLexer._ATN, this);
	}

	// @Override
	public get grammarFileName(): string { return "BlockGrammar.g4"; }

	// @Override
	public get ruleNames(): string[] { return BlockGrammarLexer.ruleNames; }

	// @Override
	public get serializedATN(): string { return BlockGrammarLexer._serializedATN; }

	// @Override
	public get channelNames(): string[] { return BlockGrammarLexer.channelNames; }

	// @Override
	public get modeNames(): string[] { return BlockGrammarLexer.modeNames; }

	public static readonly _serializedATN: string =
		"\x03\uC91D\uCABA\u058D\uAFBA\u4F53\u0607\uEA8B\uC241\x02\x13k\b\x01\x04" +
		"\x02\t\x02\x04\x03\t\x03\x04\x04\t\x04\x04\x05\t\x05\x04\x06\t\x06\x04" +
		"\x07\t\x07\x04\b\t\b\x04\t\t\t\x04\n\t\n\x04\v\t\v\x04\f\t\f\x04\r\t\r" +
		"\x04\x0E\t\x0E\x04\x0F\t\x0F\x04\x10\t\x10\x04\x11\t\x11\x04\x12\t\x12" +
		"\x03\x02\x03\x02\x03\x03\x03\x03\x03\x04\x03\x04\x03\x05\x03\x05\x03\x06" +
		"\x03\x06\x03\x07\x03\x07\x03\b\x03\b\x03\b\x07\b5\n\b\f\b\x0E\b8\v\b\x03" +
		"\t\x03\t\x03\t\x03\n\x03\n\x03\n\x03\n\x03\n\x03\v\x03\v\x03\v\x03\v\x03" +
		"\v\x03\f\x03\f\x03\r\x03\r\x03\r\x03\r\x03\r\x03\x0E\x03\x0E\x03\x0E\x03" +
		"\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0E\x03\x0F\x03\x0F\x03\x0F\x03" +
		"\x0F\x03\x10\x06\x10\\\n\x10\r\x10\x0E\x10]\x03\x11\x06\x11a\n\x11\r\x11" +
		"\x0E\x11b\x03\x12\x06\x12f\n\x12\r\x12\x0E\x12g\x03\x12\x03\x12\x02\x02" +
		"\x02\x13\x03\x02\x03\x05\x02\x04\x07\x02\x05\t\x02\x06\v\x02\x07\r\x02" +
		"\b\x0F\x02\t\x11\x02\n\x13\x02\v\x15\x02\f\x17\x02\r\x19\x02\x0E\x1B\x02" +
		"\x0F\x1D\x02\x10\x1F\x02\x11!\x02\x12#\x02\x13\x03\x02\x06\x05\x02,-/" +
		"/11\x05\x0233;;\u2015\u2015\x03\x02c|\x05\x02\v\f\x0F\x0F\"\"\x02o\x02" +
		"\x03\x03\x02\x02\x02\x02\x05\x03\x02\x02\x02\x02\x07\x03\x02\x02\x02\x02" +
		"\t\x03\x02\x02\x02\x02\v\x03\x02\x02\x02\x02\r\x03\x02\x02\x02\x02\x0F" +
		"\x03\x02\x02\x02\x02\x11\x03\x02\x02\x02\x02\x13\x03\x02\x02\x02\x02\x15" +
		"\x03\x02\x02\x02\x02\x17\x03\x02\x02\x02\x02\x19\x03\x02\x02\x02\x02\x1B" +
		"\x03\x02\x02\x02\x02\x1D\x03\x02\x02\x02\x02\x1F\x03\x02\x02\x02\x02!" +
		"\x03\x02\x02\x02\x02#\x03\x02\x02\x02\x03%\x03\x02\x02\x02\x05\'\x03\x02" +
		"\x02\x02\x07)\x03\x02\x02\x02\t+\x03\x02\x02\x02\v-\x03\x02\x02\x02\r" +
		"/\x03\x02\x02\x02\x0F1\x03\x02\x02\x02\x119\x03\x02\x02\x02\x13<\x03\x02" +
		"\x02\x02\x15A\x03\x02\x02\x02\x17F\x03\x02\x02\x02\x19H\x03\x02\x02\x02" +
		"\x1BM\x03\x02\x02\x02\x1DV\x03\x02\x02\x02\x1F[\x03\x02\x02\x02!`\x03" +
		"\x02\x02\x02#e\x03\x02\x02\x02%&\x07=\x02\x02&\x04\x03\x02\x02\x02\'(" +
		"\x07?\x02\x02(\x06\x03\x02\x02\x02)*\x07*\x02\x02*\b\x03\x02\x02\x02+" +
		",\x07+\x02\x02,\n\x03\x02\x02\x02-.\x07}\x02\x02.\f\x03\x02\x02\x02/0" +
		"\x07\x7F\x02\x020\x0E\x03\x02\x02\x0216\x05!\x11\x0225\x05\x1F\x10\x02" +
		"35\x05!\x11\x0242\x03\x02\x02\x0243\x03\x02\x02\x0258\x03\x02\x02\x02" +
		"64\x03\x02\x02\x0267\x03\x02\x02\x027\x10\x03\x02\x02\x0286\x03\x02\x02" +
		"\x029:\x07k\x02\x02:;\x07h\x02\x02;\x12\x03\x02\x02\x02<=\x07v\x02\x02" +
		"=>\x07j\x02\x02>?\x07g\x02\x02?@\x07p\x02\x02@\x14\x03\x02\x02\x02AB\x07" +
		"g\x02\x02BC\x07n\x02\x02CD\x07u\x02\x02DE\x07g\x02\x02E\x16\x03\x02\x02" +
		"\x02FG\t\x02\x02\x02G\x18\x03\x02\x02\x02HI\x07u\x02\x02IJ\x07v\x02\x02" +
		"JK\x07q\x02\x02KL\x07r\x02\x02L\x1A\x03\x02\x02\x02MN\x07e\x02\x02NO\x07" +
		"q\x02\x02OP\x07p\x02\x02PQ\x07v\x02\x02QR\x07k\x02\x02RS\x07p\x02\x02" +
		"ST\x07w\x02\x02TU\x07g\x02\x02U\x1C\x03\x02\x02\x02VW\x07x\x02\x02WX\x07" +
		"c\x02\x02XY\x07t\x02\x02Y\x1E\x03\x02\x02\x02Z\\\t\x03\x02\x02[Z\x03\x02" +
		"\x02\x02\\]\x03\x02\x02\x02][\x03\x02\x02\x02]^\x03\x02\x02\x02^ \x03" +
		"\x02\x02\x02_a\t\x04\x02\x02`_\x03\x02\x02\x02ab\x03\x02\x02\x02b`\x03" +
		"\x02\x02\x02bc\x03\x02\x02\x02c\"\x03\x02\x02\x02df\t\x05\x02\x02ed\x03" +
		"\x02\x02\x02fg\x03\x02\x02\x02ge\x03\x02\x02\x02gh\x03\x02\x02\x02hi\x03" +
		"\x02\x02\x02ij\b\x12\x02\x02j$\x03\x02\x02\x02\b\x0246]bg\x03\b\x02\x02";
	public static __ATN: ATN;
	public static get _ATN(): ATN {
		if (!BlockGrammarLexer.__ATN) {
			BlockGrammarLexer.__ATN = new ATNDeserializer().deserialize(Utils.toCharArray(BlockGrammarLexer._serializedATN));
		}

		return BlockGrammarLexer.__ATN;
	}

}

