package domain.base;

/**
 * Enumeration that defines standard HTTP error codes and their corresponding default messages used
 * throughout the project for consistent error handling and reporting.
 *
 * <p>This enum provides a centralized way to manage error codes and their associated messages,
 * ensuring consistency across the application when handling various error conditions.
 *
 * @see {@link ProjectException} for usage of these error codes in exception handling
 */
public enum ErrorCode {

  /**
   * Represents a bad request error with HTTP status code 400. Used when the client sends an invalid
   * or malformed request.
   */
  BAD_REQUEST(400, "Invalid request"),

  /**
   * Represents a forbidden error with HTTP status code 403. Used when the user lacks authorization
   * to perform the requested operation.
   */
  FORBIDDEN(403, "User is unauthorized to perform this operation"),

  /**
   * Represents a not found error with HTTP status code 404. Used when the requested resource cannot
   * be located.
   */
  NOT_FOUND(404, "Resource not found"),

  /**
   * Represents a conflict error with HTTP status code 409. Used when there is a conflict with the
   * current state of the resource.
   */
  CONFLICT(409, "Conflicting resource update found"),

  /**
   * Represents an internal server error with HTTP status code 500. Used as a general catch-all for
   * unexpected server-side errors.
   */
  INTERNAL_SERVER_ERROR(500, "Error during operation");

  /** The HTTP status code associated with this error. */
  private final int code;

  /** The default error message associated with this error code. */
  private final String defaultMessage;

  /**
   * Constructs an ErrorCode with the specified HTTP status code and default message.
   *
   * @param code The HTTP status code for this error
   * @param defaultMessage The default error message for this error code
   */
  private ErrorCode(int code, String defaultMessage) {
    this.code = code;
    this.defaultMessage = defaultMessage;
  }

  /**
   * Returns the HTTP status code associated with this error code.
   *
   * @return The HTTP status code as an integer
   */
  public int getCode() {
    return code;
  }

  /**
   * Returns the default error message associated with this error code.
   *
   * @return The default error message as a string
   */
  public String getDefaultMessage() {
    return defaultMessage;
  }

  /**
   * Finds and returns the ErrorCode enum constant that matches the specified HTTP status code. If
   * no matching error code is found, returns {@link #INTERNAL_SERVER_ERROR} as the default.
   *
   * @param code The HTTP status code to search for
   * @return The matching ErrorCode enum constant, or INTERNAL_SERVER_ERROR if no match is found
   */
  public static ErrorCode fromCode(int code) {
    for (ErrorCode ec : ErrorCode.values()) {
      if (ec.getCode() == code) {
        return ec;
      }
    }
    return INTERNAL_SERVER_ERROR; // Default if no match found
  }
}
