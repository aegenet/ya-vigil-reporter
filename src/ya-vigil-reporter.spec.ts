import * as assert from 'node:assert';
import { type YaVigilReportResult, YaVigilReporter, type IYaVigilReporter } from './index';
import { type FastifyInstance } from 'fastify';
import { createFakeVigilServer } from './tests/create-fake-vigil-server.spec';
import { delay } from './utils/ya-workload.spec';

describe('ya-vigil-reporter', () => {
  let server: FastifyInstance;
  let url: string;

  before(async () => {
    server = createFakeVigilServer();
    await server.listen();
    const addressInfo = server.server.address();
    assert.ok(addressInfo);
    if (typeof addressInfo === 'string') {
      url = `http://${addressInfo}/`;
    } else {
      url = `http://${addressInfo.address.startsWith('::') ? 'localhost' : addressInfo.address}:${addressInfo.port}/`;
    }

    server.log.info(`Server listening on ${url}`);
  });

  after(async () => {
    server.server.closeAllConnections();
    await server.close();
  });

  describe('common', () => {
    it('Invalid options', async () => {
      try {
        new YaVigilReporter({
          url,
          token: '...',
          probe_id: 'api',
          node_id: '',
          replica_id: '',
          interval: 30,
        });
        throw new Error('Must fail');
      } catch (error) {
        assert.strictEqual((error as Error).message, 'YaVigilReport "node_id" options cannot be null/undefined or empty');
      }
    });

    it('Ok', async () => {
      new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
    });

    it('Custom Logger', async () => {
      new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
        logger: server.log,
      });
    });
  });

  describe('cron', () => {
    it('Classic', async () => {
      const vigilReporter: IYaVigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        // interval: 30,
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await vigilReporter.stop();
      assert.ok(!vigilReporter.isRunning);
    });

    it('Stop & flush', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await vigilReporter.stop({
        flush: true,
      });
    });

    it('End old way', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await vigilReporter.end({
        done: err => {
          assert.ok(!err);
          assert.ok(!vigilReporter.isRunning);
        },
      });
      await vigilReporter.end();
    });

    it('End old way, flush fail', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'invalid',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await vigilReporter.end({
        done: err => {
          assert.ok(err);
          assert.ok(!vigilReporter.isRunning);
        },
        flush: true,
      });
    });

    it('Delay', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 1,
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await delay(3000);
      await vigilReporter.stop();
      assert.ok(!vigilReporter.isRunning);
    });

    it('Invalid node_id - shallow', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'invalid',
        replica_id: 'the-one',
        interval: 1,
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await delay(3000);
      await vigilReporter.stop();
      assert.ok(!vigilReporter.isRunning);
    });

    it('Invalid node_id - throw on error', async () => {
      try {
        const vigilReporter = new YaVigilReporter({
          url,
          token: '...',
          probe_id: 'api',
          node_id: 'invalid',
          replica_id: 'the-one',
          interval: 1,
        });
        await vigilReporter.start({
          // Throw an error if the config is not valid
          ensure: true,
        });
        throw new Error('Must fail');
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Bad Request (400): Invalid node_id!');
      }
    });

    it('onTick', async () => {
      const reports: YaVigilReportResult[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 1,
        onTick(data) {
          reports.push(data);
        },
        // console: console
      });
      await vigilReporter.start();
      assert.ok(vigilReporter.isRunning);
      await delay(3000);
      assert.strictEqual(reports.length, 2);
      await vigilReporter.stop();
      assert.ok(!vigilReporter.isRunning);
    });
  });

  describe('report', () => {
    it('Classic', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
      const result = await vigilReporter.report();
      assert.ok(!result.error);
      assert.ok(result.bodySent);
      assert.strictEqual(result.bodySent.replica, 'the-one');
      assert.strictEqual(result.bodySent.interval, 30);
      assert.ok(result.bodySent.load);
      assert.ok(result.bodySent.load.cpu != null);
      assert.ok(result.bodySent.load.ram != null);
      assert.ok(typeof result.bodySent.load.cpu === 'number');
      assert.ok(typeof result.bodySent.load.ram === 'number');
    });

    it('Custom logger', async () => {
      const errors: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
        logger: {
          error(message, ...optionalParams) {
            errors.push(message);
          },
        },
      });
      const result = await vigilReporter.report();
      assert.ok(!result.error);
      assert.ok(result.bodySent);
      assert.strictEqual(result.bodySent.replica, 'the-one');
      assert.strictEqual(result.bodySent.interval, 30);
      assert.ok(result.bodySent.load);
      assert.ok(result.bodySent.load.cpu != null);
      assert.ok(result.bodySent.load.ram != null);
      assert.ok(typeof result.bodySent.load.cpu === 'number');
      assert.ok(typeof result.bodySent.load.ram === 'number');
      assert.strictEqual(errors.length, 0);
    });

    it('No log at all', async () => {
      const errors: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'invalid',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
        logger: null,
      });
      const result = await vigilReporter.report({ reThrow: false });
      assert.ok(result.error);
      assert.strictEqual(errors.length, 0);
    });

    it('Invalid node_id', async () => {
      const errors: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'invalid',
        replica_id: 'the-one',
        interval: 30,
        // console: console
        logger: {
          error(message) {
            errors.push(message);
          },
        },
      });

      try {
        await vigilReporter.report();
        throw new Error('Must fail!');
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Bad Request (400): Invalid node_id!');
        assert.strictEqual(errors.length, 1);
      }

      const result = await vigilReporter.report({ reThrow: false });
      assert.ok(result.error);
      assert.strictEqual(errors.length, 2);
    });

    it('Report Timeout!', async () => {
      const errors: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'timeout',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 5,
        // console: console
        logger: {
          error(message) {
            errors.push(message);
          },
        },
      });

      try {
        await vigilReporter.report();
        throw new Error('Must fail!');
      } catch (error) {
        assert.ok((error as Error).message === 'This operation was aborted' || (error as Error).message === 'The operation was aborted.');
        assert.strictEqual(errors.length, 1);
      }

      const result = await vigilReporter.report({ reThrow: false });
      assert.ok(result.error);
      assert.strictEqual(errors.length, 2);
    });
  });

  describe('flush', () => {
    it('Classic', async () => {
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 30,
        // console: console
      });
      const result = await vigilReporter.flush();
      assert.ok(!result.error);
    });

    it('Invalid node_id', async () => {
      const errors: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'api',
        node_id: 'invalid',
        replica_id: 'the-one',
        interval: 30,
        // console: console
        logger: {
          error(message) {
            errors.push(message);
          },
        },
      });

      try {
        await vigilReporter.flush();
        throw new Error('Must fail!');
      } catch (error) {
        assert.strictEqual((error as Error).message, 'Bad Request (400): Invalid node_id!');
        assert.strictEqual(errors.length, 1);
      }

      const result = await vigilReporter.flush({ reThrow: false });
      assert.ok(result.error);
      assert.strictEqual(errors.length, 2);
    });

    it('Flush Timeout!', async () => {
      const errors: string[] = [];
      const infos: string[] = [];
      const vigilReporter = new YaVigilReporter({
        url,
        token: '...',
        probe_id: 'timeout',
        node_id: 'my-backend',
        replica_id: 'the-one',
        interval: 5,
        // console: console
        logger: {
          error(message) {
            errors.push(message);
          },
          info(message) {
            infos.push(message);
          },
        },
      });

      try {
        await vigilReporter.flush({
          timeout: 1000,
        });
        throw new Error('Must fail!');
      } catch (error) {
        assert.ok((error as Error).message === 'This operation was aborted' || (error as Error).message === 'The operation was aborted.');
        assert.strictEqual(errors.length, 1);
        assert.strictEqual(infos.length, 1);
      }
      await vigilReporter.flush({ reThrow: false, timeout: 1000 });
      const result = await vigilReporter.flush({ reThrow: false, timeout: 1000 });
      assert.ok(result.error);
      assert.strictEqual(errors.length, 3);
      assert.strictEqual(infos.length, 3);
    });
  });
});
