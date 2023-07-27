/** Fetch with Timeout */
export async function yaFetchWTimeout(input: RequestInfo | URL, init: RequestInit, timeout: number): Promise<Response> {
  let timeoutToken;
  try {
    const controller = new AbortController();
    timeoutToken = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    clearTimeout(timeoutToken);
    timeoutToken = undefined;
    if (resp && !resp.ok) {
      throw new Error(`${resp.statusText} (${resp.status}): ${await resp.text()}`);
    }
    return resp;
  } catch (error) {
    if (timeoutToken) {
      clearTimeout(timeoutToken);
    }
    throw error;
  }
}
