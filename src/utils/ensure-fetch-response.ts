/** Ensure & format response */
export async function ensureFetchResponse(
  resp: Response,
  options: {
    formatErrorMessage?: (resp: Response) => Promise<string> | string;
  }
): Promise<void> {
  if (resp && !resp.ok) {
    throw new Error(options.formatErrorMessage ? await options.formatErrorMessage(resp) : await _defaultFormatErrorMessage(resp));
  }
}

async function _defaultFormatErrorMessage(resp: Response): Promise<string> {
  let errorMessage = `${resp.statusText} (${resp.status})`;
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType || contentType.indexOf('text/html') === -1) {
    const detail = await resp.text().catch(() => '');
    errorMessage += `: ${detail}`;
  }
  return errorMessage;
}
