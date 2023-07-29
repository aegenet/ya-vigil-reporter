export type YaFetchWTimeoutOptions = {
  timeout: number;
  formatErrorMessage?: (resp: Response) => Promise<string> | string;
};

/** Fetch with Timeout */
export async function yaFetchWTimeout(input: RequestInfo | URL, init: RequestInit, options: YaFetchWTimeoutOptions): Promise<Response> {
  let timeoutToken;
  try {
    const controller = new AbortController();
    timeoutToken = setTimeout(() => controller.abort(), options.timeout);
    const resp = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutToken);
    timeoutToken = undefined;
    if (resp && !resp.ok) {
      throw new Error(options.formatErrorMessage ? await options.formatErrorMessage(resp) : await _defaultFormatErrorMessage(resp));
    }
    return resp;
  } catch (error) {
    if (timeoutToken) {
      clearTimeout(timeoutToken);
    }
    throw error;
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
