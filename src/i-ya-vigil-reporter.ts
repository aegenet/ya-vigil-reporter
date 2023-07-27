import type { YaVigilReportResult } from './models/ya-vigil-reporter-options';

/**
 * Yet Another Vigil Reporter
 */
export interface IYaVigilReporter {
  /** Start the Vigil Reporter */
  start(args?: { ensure?: boolean }): Promise<void>;

  /** Stop the Vigil Reporter */
  stop(args?: { flush?: boolean }): Promise<void>;

  /** Stop the Vigil Reporter (legacy way) */
  end(args?: { flush?: boolean; done?: (error?: Error) => void }): Promise<void>;

  /** Cron is running ? */
  get isRunning(): boolean;

  /** Report the replica */
  report(args?: { /** @default true */ reThrow?: boolean }): Promise<YaVigilReportResult>;

  /** Flush the replica */
  flush(args?: { /** @default true */ reThrow?: boolean; timeout?: number }): Promise<{
    error?: Error;
  }>;
}
