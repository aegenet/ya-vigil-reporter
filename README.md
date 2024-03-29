[![npm version](https://img.shields.io/npm/v/@aegenet/ya-vigil-reporter.svg)](https://www.npmjs.com/package/@aegenet/ya-vigil-reporter)
[![Build Status](https://github.com/aegenet/ya-vigil-reporter/actions/workflows/ci.yml/badge.svg)](https://github.com/aegenet/ya-vigil-reporter/actions)
[![codecov](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graph/badge.svg?token=NRN5ODOY91)](https://codecov.io/gh/aegenet/ya-vigil-reporter)
<br />

# Yet Another Vigil Reporter

An alternative to [`node-vigil-reporter`](https://github.com/valeriansaliou/node-vigil-reporter).

>  _"Vigil is an open-source Status Page you can host on your infrastructure, used to monitor all your servers and apps, and visible to your users (on a domain of your >  choice, eg. status.example.com)."_ https://github.com/valeriansaliou/vigil


## ≠ Notable differences with `node-vigil-reporter`

- `ya-vigil-reporter` does not start automatically. You must call the `start` method.
- An `end` (_callback way_) method exists, but I don't recommend using it; use `stop` (_Promise way_) instead.
- You can call the `report` method manually.
- CPU usage is calculated differently _(compatible with Windows OS)_.
- Use native `fetch` method.


## 💾 Installation

```shell
yarn add @aegenet/ya-vigil-reporter@~1
# or
npm i @aegenet/ya-vigil-reporter@~1
```

## 📝 Usage

### Classic

```typescript
import { YaVigilReporter } from '@aegenet/ya-vigil-reporter';

const vigilReporter = new YaVigilReporter({
  url: "https://status.example.com",
  token: "...",
  probe_id: "api",
  node_id: "my-backend", 
  replica_id: "the-one",
  interval: 30,
  // logger: console,
});

await vigilReporter.start();

/* ... */
// stop the reporter
await vigilReporter.stop();

// or specify the flush options to teardown the replica
await vigilReporter.stop({ flush: true });
```


### 📝 Custom fetch

```typescript
import { YaVigilReporter } from '@aegenet/ya-vigil-reporter';
import { bFetch, type bFetchOptions } from '@aegenet/belt-fetch';

// Async DNS & cache 1mn
const bFetchOpts: bFetchOptions = {
  dnsCacheTTL: 60000,
};

const vigilReporter = new YaVigilReporter({
  url: "https://status.example.com",
  token: "...",
  probe_id: "api",
  node_id: "my-backend", 
  replica_id: "the-one",
  interval: 30,
  // logger: console,
  fetch(input, init) {
    return bFetch(input, init, bFetchOpts);
  },
});

await vigilReporter.start();

/* ... */
// stop the reporter
await vigilReporter.stop();

// or specify the flush options to teardown the replica
await vigilReporter.stop({ flush: true });
```

## 🖹 API

```typescript
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
```

```typescript
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
```

## Vigil HTTP API Specifications

- [Vigil Reporter HTTP API](https://github.com/valeriansaliou/vigil/blob/master/PROTOCOL.md#vigil-reporter-http-api) protocol specifications.
- [Vigil Manager HTTP API](https://github.com/valeriansaliou/vigil/blob/master/PROTOCOL.md#vigil-manager-http-api) protocol specifications.

# Coverage
[![codecov](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graph/badge.svg?token=NRN5ODOY91)](https://codecov.io/gh/aegenet/ya-vigil-reporter)

![Coverage sunburst](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graphs/sunburst.svg?token=NRN5ODOY91)

![Coverage tree](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graphs/tree.svg?token=NRN5ODOY91)


## 📝 License

[The MIT License](LICENSE) - Copyright © 2023 [Alexandre Genet](https://github.com/aegenet).