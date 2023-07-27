import type { YaVigilReportBody } from './ya-vigil-report-body';
import type { YaVigilReporterLogger } from './ya-vigil-reporter-logger';

export interface YaVigilReporterOptions {
  /** `page_url` from Vigil `config.cfg` */
  url: string;
  /** `reporter_token` from Vigil `config.cfg` */
  token: string;
  /** Probe ID containing the parent Node for Replica */
  probe_id: string;
  /** Node ID containing Replica */
  node_id: string;
  /** Replica ID */
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

  /** OnTick */
  onTick?: (data: {
    error?: Error;
    /** body sent to Vigil */
    bodySent?: YaVigilReportBody;
  }) => void;
}

/** Assert Options */
export function assertVigilReporterOptions(options: YaVigilReporterOptions) {
  ['url', 'token', 'probe_id', 'node_id', 'replica_id', 'interval'].forEach(f => {
    if (!(f in options) || !(options as any)[f]) {
      throw new Error(`YaVigilReport "${f}" options cannot be null/undefined or empty`);
    }
  });
}
