
/**
 * A simple HTML sanitizer that escapes special characters to prevent
 * the browser from interpreting input as executable HTML/script.
 * This should be applied to any user-provided string that will be stored or displayed.
 *
 * It works by leveraging the browser's own parser: assigning a string to
 * `textContent` treats it as plain text, then reading it back via `innerHTML`
 * provides an HTML-escaped version.
 *
 * For production environments, a more robust library like DOMPurify is recommended
 * for comprehensive XSS protection against more complex attack vectors.
 *
 * @param input The string to sanitize. Can be null or undefined.
 * @returns A sanitized string safe for rendering as text content, or an empty string if input is falsy.
 */
export const sanitize = (input: string | null | undefined): string => {
  if (typeof input !== 'string') {
    return '';
  }
  const temp = document.createElement('div');
  temp.textContent = input;
  return temp.innerHTML;
};
