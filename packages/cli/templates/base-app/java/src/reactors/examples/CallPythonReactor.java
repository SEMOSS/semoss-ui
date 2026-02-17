package reactors.examples;

import java.util.ArrayList;
import java.util.List;

import prerna.ds.py.PyTranslator;
import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.ReactorKeysEnum;
import prerna.sablecc2.om.nounmeta.NounMetadata;

/**
 * Reactor implementation that bridges Java reactor execution with an external Python helper
 * function. This reactor expects a single numeric input and invokes a Python module function (
 * <code>nthFibonacci</code>) to compute the Nth Fibonacci number, returning the result.
 *
 * <p>Execution flow:
 *
 * <ul>
 *   <li>Validates and retrieves the required numeric input key ({@link
 *       ReactorKeysEnum#NUMERIC_VALUE}).
 *   <li>Loads the Python source file (<code>nthFibonacci.py</code>) into a runtime module via
 *       {@link PyTranslator}.
 *   <li>Invokes the Python function <code>nthFibonacci</code> with the provided argument list.
 *   <li>Wraps and returns the Python response inside a {@link NounMetadata} result for downstream
 *       pixel operations.
 * </ul>
 *
 * <p>This class extends {@link AbstractProjectReactor} and leverages its protected context members
 * (such as {@code insight}, {@code user}, and parameter retrieval utilities) to access project and
 * execution context seamlessly.
 *
 * @see {@link AbstractProjectReactor} for base reactor lifecycle and error handling.
 * @see {@link #doExecute()} for detailed per-execution business logic.
 */
public class CallPythonReactor extends AbstractReactor {

  // Note: Has access to protected variables defined in AbstractProjectReactor

  /**
   * Constructs a new {@link CallPythonReactor} configuring the required input keys for execution.
   * The reactor requires one numeric value key which represents the target index (N) for the
   * Fibonacci computation.
   *
   * <p>Key configuration details:
   *
   * <ul>
   *   <li>{@link ReactorKeysEnum#NUMERIC_VALUE} - Required (denoted by 1 in {@code keyRequired}).
   * </ul>
   *
   * @see {@link CallPythonReactor} for overall reactor purpose.
   */
  public CallPythonReactor() {

    // list of keys the reactor is expecting
    this.keysToGet = new String[] {ReactorKeysEnum.NUMERIC_VALUE.getKey()};

    // 1 for required keys, 0 for optional
    this.keyRequired = new int[] {1};
  }

  /**
   * Executes the Python-backed Fibonacci computation and returns the resulting number. This method
   * performs all per-invocation logic: extracting the input numeric key, loading the Python module
   * file, invoking the target function, and wrapping the response.
   *
   * <p>Processing steps:
   *
   * <ul>
   *   <li>Extract input N from {@link ReactorKeysEnum#NUMERIC_VALUE}.
   *   <li>Resolve project context ID (fallback to {@code insight.getProjectId()} when necessary).
   *   <li>Load <code>nthFibonacci.py</code> as a module using {@link PyTranslator}.
   *   <li>Invoke the Python function <code>nthFibonacci</code> with a single argument list holding
   *       N.
   *   <li>Wrap the returned Python object inside {@link NounMetadata} with type {@link
   *       PixelDataType#CONST_STRING}.
   * </ul>
   *
   * @return A {@link NounMetadata} representing the computed Fibonacci value as a constant string.
   * @see {@link AbstractProjectReactor#doExecute()} for overarching execution contract.
   */
  @Override
public NounMetadata execute() {
	
    // organize the keys from the pixel input
    organizeKeys();
	
    // grab the input numbe
	
    int inputNum = Integer.parseInt(this.keyValue.get(ReactorKeysEnum.NUMERIC_VALUE.getKey()));

    // define the file to grab the helper function from
    String sourceFile = "nthFibonacci.py";

    PyTranslator pt = this.insight.getPyTranslator();

    String projectId = this.insight.getContextProjectId();
    if (projectId == null) {
      projectId = this.insight.getProjectId();
    }

    String fibonacciModule = pt.loadPythonModuleFromFile(this.insight, sourceFile, projectId);

    String functionName = "nthFibonacci";

    // define the arguments to be passed to the function
    List<Object> argsList = new ArrayList<>();
    argsList.add(inputNum);

    Object pyResponse =
        pt.runFunctionFromLoadedModule(this.insight, fibonacciModule, functionName, argsList);

    return new NounMetadata(pyResponse, PixelDataType.CONST_STRING);
  }
}
