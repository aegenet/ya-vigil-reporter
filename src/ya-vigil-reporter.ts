import { assertVigilReporterOptions, type YaVigilReporterOptions } from './ya-vigil-reporter-options';
import { YaWorkload, type YaWorkloadResult } from './ya-workload';
import { YaVigilReportBody } from './ya-vigil-report-body';

/**
 * Yet Another Vigil Reporter
 */
export class YaVigilReporter {
  private readonly _workload: YaWorkload = new YaWorkload();
  private readonly _baseURL: string;
  private readonly _reporterAuthz: string;
  private _reporterHeader: { Authorization: string; 'Content-Type': string };
  private _currentCpuUsage?: YaWorkloadResult;
  private _intervalMs: number;
  private _timeoutMs: number;
  private _cron?: NodeJS.Timer;

  constructor(private readonly _options: YaVigilReporterOptions) {
    // legacy
    if (!_options.console && !_options.logger) {
      _options.logger = _options.console;
    }
    _options.logger ??= console;
    _options.interval ||= 30;

    assertVigilReporterOptions(this._options);

    this._intervalMs = _options.interval * 1000;
    // The default delay is 8 seconds. If the interval is less than 8, the value will be intervalMs div by 2.
    this._timeoutMs = _options.interval < 8 ? this._intervalMs / 2 : 8000;
    const { url, probe_id, node_id, token } = _options;

    let baseURL = url;
    if (!baseURL.endsWith('/')) {
      baseURL += '/';
    }
    baseURL += `reporter/${encodeURIComponent(probe_id)}/${encodeURIComponent(node_id)}`;
    this._baseURL = baseURL;
    this._reporterAuthz = `Basic ${Buffer.from(':' + token).toString('base64')}`;
    this._reporterHeader = {
      Authorization: this._reporterAuthz,
      'Content-Type': 'application/json; charset=utf-8',
    };
  }

  /** Start the Vigil */
  public async start(args?: { ensure?: boolean }) {
    this.end();

    this._options.logger?.info?.('ya-vigil-reporter.start');
    const ensureConfig = args?.ensure ?? false;

    if (ensureConfig) {
      // Ensure that a report can be made, otherwise an exception is thrown.
      await this.report();
    }

    // first measure
    this._workload.getCurrentUsage();

    this._cron = setInterval(async () => {
      this._currentCpuUsage = this._workload.getCurrentUsage();
      if (this._options.onTick) {
        this._options.onTick(await this.report({ reThrow: false }));
      } else {
        await this.report({ reThrow: false });
      }
    }, this._intervalMs);
  }

  /** Stop the Vigil */
  public async stop(args?: { flush?: boolean }) {
    if (this._cron) {
      this._options.logger?.info?.('ya-vigil-reporter.stop');
      clearInterval(this._cron);
      this._cron = undefined;
    }
    if (args?.flush) {
      await this.flush();
    }
    this._currentCpuUsage = undefined;
  }

  /** Stop the Vigil (legacy way, bad way) */
  public end(args?: { flush?: boolean; done?: (error?: Error) => void }): void {
    args ||= {};
    this.stop(args)
      .then(() => {
        args!.done?.();
      })
      .catch(error => {
        args!.done?.(error);
      });
  }

  /** Cron is running ? */
  public get isRunning(): boolean {
    return !!this._cron;
  }

  /** Manual reporting */
  public async report(args?: { /** @default true */ reThrow?: boolean }): Promise<{
    /** if reThrow is false */
    error?: Error;
    /** body sent to Vigil */
    bodySent?: YaVigilReportBody;
  }> {
    this._options.logger?.info?.('ya-vigil-reporter.report');

    args ||= {};
    args.reThrow ??= true;
    let reportBody: YaVigilReportBody | undefined;

    try {
      if (!this._currentCpuUsage) {
        // init
        this._workload.getCurrentUsage();
      }

      reportBody = {
        replica: this._options.replica_id,
        interval: this._options.interval!,
        load: this._currentCpuUsage || this._workload.getCurrentUsage(),
      };

      const controller = new AbortController();
      const timeoutToken = setTimeout(() => controller.abort(), this._timeoutMs);

      const resp = await fetch(this._baseURL, {
        method: 'POST',
        headers: this._reporterHeader,
        signal: controller.signal,
        body: JSON.stringify(reportBody),
      });
      clearTimeout(timeoutToken);
      await this._handleResponse(resp);

      return {
        error: undefined,
        bodySent: reportBody,
      };
    } catch (error) {
      this._options.logger?.error('ya-vigil-reporter.report', error);
      if (args?.reThrow) {
        throw error;
      } else {
        return {
          error: error as Error,
          bodySent: reportBody,
        };
      }
    }
  }

  /** Flush the replica */
  public async flush(options?: { /** @default true */ reThrow?: boolean }): Promise<{
    error?: Error;
  }> {
    options ||= {};
    options.reThrow ??= true;
    try {
      this._options.logger?.info?.('ya-vigil-reporter.flush');
      await this._handleResponse(
        await fetch(this._baseURL + '/' + encodeURIComponent(this._options.replica_id), {
          method: 'DELETE',
          headers: {
            Authorization: this._reporterAuthz,
          },
        })
      );
      return {
        error: undefined,
      };
    } catch (error) {
      this._options.logger?.error('ya-vigil-reporter.flush', error);
      if (options?.reThrow) {
        throw error;
      } else {
        return {
          error: error as Error,
        };
      }
    }
  }

  private async _handleResponse(resp: Response): Promise<void> {
    if (resp) {
      if (!resp.ok) {
        const respText = await resp.text();
        throw new Error(`${resp.statusText} (${resp.status}): ${respText}`);
      }
    }
  }
}
