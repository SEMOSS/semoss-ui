/* Grammar .g4 file needs to be at base
* start npm install -g antlr4ts-cli 
* antlr4ts -visitor -o ./generated ./BlockGrammar.g4 will generate the Lexer, Parser, Listener, Visitor
* BlockGrammar defines the rules for the language to use
* BlockGrammarParser, BlockGrammarLexer
*/

grammar BlockGrammar;

file:          (expr ';' | declaration ';' | assignment ';')+ EOF;
declaration:   VAR IDENTIFIER;
expr:          IDENTIFIER (OP IDENTIFIER)?;
assignment:    IDENTIFIER '=' (NUMBER | expr);
if_statement:  IF '(' expr ')' THEN '{' command '}' (ELSE '{' command '}')?;
command:       STOP | CONTINUE | if_statement | assignment;
IDENTIFIER:    WORD (NUMBER | WORD)*;
IF:            'if';
THEN:          'then';
ELSE:          'else';
OP:            '+' | '-' | '*' | '/';
STOP:          'stop';
CONTINUE:      'continue';
VAR:           'var';

NUMBER:        [1–9]+;
WORD:          [a-z]+;
SPACES:        [\t\r\n ]+ -> skip;