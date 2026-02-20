import { IfNode } from "./if-node";
import { OperatorNode } from "./operator-node";
import { ResultNode } from "./result-node";
import { StartEndNode } from "./start-end-node";
import { ValueNode } from "./value-node";

export { OperatorNode, ValueNode, ResultNode, StartEndNode, IfNode };

export const nodeTypes = {
	operator: OperatorNode,
	value: ValueNode,
	result: ResultNode,
	startEnd: StartEndNode,
	if: IfNode,
};
