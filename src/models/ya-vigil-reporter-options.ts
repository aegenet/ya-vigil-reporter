import type { YaVigilReportBody } from './ya-vigil-report-body';
import type { YaVigilReporterLogger } from './ya-vigil-reporter-logger';

export interface YaVigilReporterOptions {
  /** `page_url` from Vigil `config.cfg` */
  url: string;

  /** `reporter_token` from Vigil `config.cfg` */
  token: string;

  /** The parent node of the reporting replica */
  node_id: string;

  /** The parent probe of the node */
  probe_id: string;

  /** The replica unique identifier (eg. the server LAN IP) */
  replica_id: string;

  /**
   * Reporting interval in seconds
   *
   * @default 30
   *
   */
  interval?: number;

  /**
   * Overwrite logger
   *
   * Set to `null` (and not `undefined`) to disabled the logger
   *
   * @default console
   */
  logger?: YaVigilReporterLogger | undefined | null;

  /** (legacy) Alias of `logger` options */
  console?: YaVigilReporterLogger | undefined | null;

  /** On Tick */
  onTick?: (data: YaVigilReportResult) => void;

  /** On Report Error */
  onReportError?: (error: unknown) => void;

  /** On Fetch Error */
  onFlushError?: (error: unknown) => void;

  /** Format the fetch error message */
  formatFetchError?: (resp: Response) => Promise<string> | string;

  /**
   * fetch function
   *
   * @default globalThis.fetch
   */
  fetch?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export interface YaVigilReportResult {
  error?: Error;
  /** body sent to Vigil */
  bodySent?: YaVigilReportBody;
}

/** Assert Options */
export function assertVigilReporterOptions(options: YaVigilReporterOptions) {
  ['url', 'token', 'probe_id', 'node_id', 'replica_id', 'interval'].forEach(f => {
    if (!(f in options) || !(options as any)[f]) {
      throw new Error(`YaVigilReport "${f}" options cannot be null/undefined or empty`);
    }
  });
}
