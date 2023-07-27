[![Build Status](https://github.com/aegenet/ya-vigil-reporter/actions/workflows/ci.yml/badge.svg)](https://github.com/aegenet/ya-vigil-reporter/actions)
[![codecov](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graph/badge.svg?token=PLACEHOLDER)](https://codecov.io/gh/aegenet/ya-vigil-reporter)
<br />

# Yet Another Vigil Reporter

An alternative to [`node-vigil-reporter`](https://github.com/valeriansaliou/node-vigil-reporter).

  "Vigil is an open-source Status Page you can host on your infrastructure, used to monitor all your servers and apps, and visible to your users (on a domain of your choice, eg. status.example.com)." https://github.com/valeriansaliou/vigil


## ≠ Notable difference with `node-vigil-reporter`

- `ya-vigil-reporter` __does not start automatically. You must call the `start` method.
- An `end` (_callback way_) method exists, but I don't recommend using it; use `stop` (_Promise way_) instead.
- You can call the `report` method manually.
- CPU usage is calculated differently _(compatible with Windows OS)_.
- Use native `fetch` method.


## 📝 License

[The MIT License](LICENSE) - Copyright © 2023 [Alexandre Genet](https://github.com/aegenet).


## 💾 Installation

```shell
yarn add @aegenet/ya-vigil-reporter
# or
npm i @aegenet/ya-vigil-reporter
```

## 📝 Usage

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


# Coverage
[![codecov](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graph/badge.svg?token=PLACEHOLDER)](https://codecov.io/gh/aegenet/ya-vigil-reporter)

![Coverage sunburst](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graphs/sunburst.svg?token=PLACEHOLDER)

![Coverage tree](https://codecov.io/gh/aegenet/ya-vigil-reporter/branch/main/graphs/tree.svg?token=PLACEHOLDER)
