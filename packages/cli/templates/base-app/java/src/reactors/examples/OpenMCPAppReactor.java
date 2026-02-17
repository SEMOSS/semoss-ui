package reactors.examples;

import prerna.reactor.AbstractReactor;
import prerna.sablecc2.om.PixelDataType;
import prerna.sablecc2.om.nounmeta.NounMetadata;

/**
 * Dummy reactor that allows Playground to open the MCP App interface.
 *
 */
public class OpenMCPAppReactor extends AbstractReactor {

  /** Constructs a OpenMCPAppReactor. This constructor does not expect any input parameters. */
  public OpenMCPAppReactor() {
    // list of keys the reactor is expecting
    this.keysToGet = new String[] {};

    // 1 for required keys, 0 for optional
    this.keyRequired = new int[] {};
  }

  /**
   * Executes the main logic of the OpenMCPAppReactor to return a default message. This method
   * currently serves as a placeholder and returns a constant string indicating that the
   * auto-execute response has not yet been implemented.
   *
   * @return A {@link NounMetadata} containing the greeting message as a constant string
   */
  @Override
  public NounMetadata execute() {
    return new NounMetadata(
        "This MCP tool's auto-execute response has not yet been implemented.",
        PixelDataType.CONST_STRING);
  }

  @Override
  public String getReactorDescription() {
    return "This tool allows the user to interact with the SEMOSS Template application.";
  }
}
