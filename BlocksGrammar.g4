/* 
* Defines the rules for the language to use 
* .g4 file needs to be at base
* run script antlr4ts-blocksgrammar to generate files (Lexer, Parser, Listener, Visitor)
*/

grammar BlocksGrammar;

// options { contextSuperClass=BlocksGrammarContext; }

/*
 * Parser Rules
*/

program: expression* EOF;

expression:
	logicalExpr				# logicalExpression
	| mathExpr				# mathExpression
	| stringExpr			# stringExpression
	| variableExpr			# variableExpression
	| '(' expression ')'	# parenthesizedExpression
	| literalExpr			# literalExpression
	| NULL					# nullExpression
    ;

logicalExpr:
	STRING_LITERAL (LOGICAL_AND | LOGICAL_OR) STRING_LITERAL # logicalOperation
    ;

mathExpr: INT (OP) INT # mathOperation
    ;

stringExpr:
	STRING_LITERAL (INTERPOLATION stringInterpolation)* # interpolatedString
    ;

variableExpr: INTERPOLATION
    ; 

stringInterpolation: variableExpr
    ;

literalExpr:
	BOOLEAN
	| INT
	| NULL
	| IDENTIFIER
	| UNQUOTED_STRING
    ;

/*
 * Lexer Rules
*/

fragment CHAR: ~[ \t\r\n{}"';,]+ ;

INTERPOLATION: '{{' (IDENTIFIER ('.' IDENTIFIER)*) '}}' ;

STRING_LITERAL: '"' ('\\' . | ~('\\' | '"'))* '"' ;

UNQUOTED_STRING: CHAR+;

IDENTIFIER: [a-zA-Z_][a-zA-Z_0-9]* ;

IF: 'if';

THEN: 'then';

ELSE: 'else';

OP: '+' | '-' | '*' | '/';

STOP: 'stop';

CONTINUE: 'continue';

VAR: 'var';

BOOLEAN: 'true' | 'false';

NULL: 'null';

NOT: 'not';

EQ: '=';

COMMA: ',';

SEMI: ';';

LPAREN: '(';

RPAREN: ')';

LCURLY: '{';

RCURLY: '}';

LOGICAL_AND: '&&';

LOGICAL_OR: '||';

INT: [0-9]+;

WORD: [a-z]+;

WS: [\t\r\n ]+ -> skip;

NEWLINE: ('\r'? '\n' | '\r')+ -> skip;
