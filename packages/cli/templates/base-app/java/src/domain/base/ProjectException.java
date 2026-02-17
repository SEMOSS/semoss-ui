package domain.base;

import java.util.HashMap;
import java.util.Map;

/**
 * Custom runtime exception class that encapsulates error information using {@link ErrorCode} enums.
 * This exception provides standardized error handling throughout the project with structured error
 * codes and messages.
 *
 * <p>This class extends {@link RuntimeException} and includes functionality to convert exception
 * information into a map format for consistent error reporting and serialization.
 *
 * @see {@link ErrorCode} for available error codes and their meanings
 */
public class ProjectException extends RuntimeException {

  /** Serial version UID for serialization compatibility. */
  private static final long serialVersionUID = -3929475919873279157L;

  /** The error code associated with this exception, providing structured error information. */
  private ErrorCode code;

  /**
   * Constructs a ProjectException with the specified error code. The exception message is set to
   * the default message from the error code.
   *
   * @param code The error code that defines the type of error
   * @see {@link ErrorCode#getDefaultMessage()} for the default message used
   */
  public ProjectException(ErrorCode code) {
    super(code.getDefaultMessage());
    this.code = code;
  }

  /**
   * Constructs a ProjectException with the specified error code and custom message.
   *
   * @param code The error code that defines the type of error
   * @param message The custom error message to use instead of the default message
   */
  public ProjectException(ErrorCode code, String message) {
    super(message);
    this.code = code;
  }

  /**
   * Constructs a ProjectException with the specified error code and underlying cause. The exception
   * message is set to the default message from the error code.
   *
   * @param code The error code that defines the type of error
   * @param cause The underlying throwable that caused this exception
   * @see {@link ErrorCode#getDefaultMessage()} for the default message used
   */
  public ProjectException(ErrorCode code, Throwable cause) {
    super(code.getDefaultMessage(), cause);
    this.code = code;
  }

  /**
   * Constructs a ProjectException with the specified error code, custom message, and underlying
   * cause.
   *
   * @param code The error code that defines the type of error
   * @param message The custom error message to use instead of the default message
   * @param cause The underlying throwable that caused this exception
   */
  public ProjectException(ErrorCode code, String message, Throwable cause) {
    super(message, cause);
    this.code = code;
  }

  /**
   * Converts this exception into a map representation containing the error code and message. This
   * method is useful for serialization and structured error reporting.
   *
   * <p>The returned map contains two keys:
   *
   * <ul>
   *   <li>"code" - The HTTP status code from the {@link ErrorCode}
   *   <li>"message" - The exception message
   * </ul>
   *
   * @return A map containing the error code and message information
   */
  public Map<String, Object> getAsMap() {
    Map<String, Object> result = new HashMap<>();
    result.put("code", code.getCode());
    result.put("message", getMessage());
    return result;
  }
}
