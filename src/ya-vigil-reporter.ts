import { assertVigilReporterOptions, YaVigilReportResult, type YaVigilReporterOptions } from './models/ya-vigil-reporter-options';
import { YaWorkload, type YaWorkloadResult } from './utils/ya-workload';
import type { YaVigilReportBody } from './models/ya-vigil-report-body';
import type { IYaVigilReporter } from './i-ya-vigil-reporter';
import { yaFetchWTimeout } from './utils/ya-fetch-w-timeout';

/**
 * Yet Another Vigil Reporter
 */
export class YaVigilReporter implements IYaVigilReporter {
  /** 15s */
  private static readonly _DEFAULT_TIMEOUT_MS: number = 15000;

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
    // The default delay is 15 seconds. If the interval is less than 15, the value will be intervalMs div by 2.
    this._timeoutMs = _options.interval < 15 ? this._intervalMs / 2 : YaVigilReporter._DEFAULT_TIMEOUT_MS;
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

  /** @inheritdoc */
  public async start(args?: { ensure?: boolean }): Promise<void> {
    await this.stop();

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

  /** @inheritdoc */
  public async stop(args?: { flush?: boolean }): Promise<void> {
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

  /** @inheritdoc */
  public async end(args?: { flush?: boolean; done?: (error?: Error) => void }): Promise<void> {
    args ||= {};
    await this.stop(args)
      .then(() => {
        args!.done?.();
      })
      .catch(error => {
        args!.done?.(error);
      });
  }

  /** @inheritdoc */
  public get isRunning(): boolean {
    return !!this._cron;
  }

  /** @inheritdoc */
  public async report(args?: { /** @default true */ reThrow?: boolean }): Promise<YaVigilReportResult> {
    this._options.logger?.info?.('ya-vigil-reporter.report');

    args ||= {};
    args.reThrow ??= true;
    let reportBody: YaVigilReportBody | undefined;
    let timeoutToken;
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

      await yaFetchWTimeout(
        this._baseURL,
        {
          method: 'POST',
          headers: this._reporterHeader,
          body: JSON.stringify(reportBody),
        },
        this._timeoutMs
      );

      return {
        error: undefined,
        bodySent: reportBody,
      };
    } catch (error) {
      if (timeoutToken) {
        clearTimeout(timeoutToken);
      }
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

  /** @inheritdoc */
  public async flush(args?: { /** @default true */ reThrow?: boolean; timeout?: number }): Promise<{
    error?: Error;
  }> {
    args ||= {};
    args.reThrow ??= true;

    let timeoutToken;
    try {
      this._options.logger?.info?.('ya-vigil-reporter.flush');

      await yaFetchWTimeout(
        this._baseURL + '/' + encodeURIComponent(this._options.replica_id),
        {
          method: 'DELETE',
          headers: {
            Authorization: this._reporterAuthz,
          },
        },
        args.timeout || YaVigilReporter._DEFAULT_TIMEOUT_MS
      );
      return {
        error: undefined,
      };
    } catch (error) {
      console.dir(error);
      if (timeoutToken) {
        clearTimeout(timeoutToken);
      }
      this._options.logger?.error('ya-vigil-reporter.flush', error);
      if (args?.reThrow) {
        console.log('reThrow');
        throw error;
      } else {
        return {
          error: error as Error,
        };
      }
    }
  }
}
