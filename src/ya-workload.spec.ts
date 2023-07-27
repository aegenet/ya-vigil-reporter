import * as assert from 'node:assert';
import { YaWorkload } from './index';

async function delay(duration: number) {
  await new Promise(resolve => setTimeout(resolve, duration));
}

describe('ya-workload', () => {
  it('Delay', async () => {
    const workload = new YaWorkload();
    workload.getCurrentUsage();
    await delay(200);
    const result = workload.getCurrentUsage();
    assert.ok(result);
    assert.ok(result.cpu != null);
    assert.ok(result.ram != null);
    assert.ok(typeof result.cpu === 'number');
    assert.ok(typeof result.ram === 'number');
  });

  it('No Delay', async () => {
    const workload = new YaWorkload();
    const result = workload.getCurrentUsage();
    assert.ok(result);
    assert.ok(result.cpu != null);
    assert.ok(result.ram != null);
    assert.ok(typeof result.cpu === 'number');
    assert.ok(typeof result.ram === 'number');
  });

  it('Multiple call', async () => {
    const workload = new YaWorkload();
    workload.getCurrentUsage();
    workload.getCurrentUsage();
    const result = workload.getCurrentUsage();
    assert.ok(result);
    assert.ok(result.cpu != null);
    assert.ok(result.ram != null);
    assert.ok(typeof result.cpu === 'number');
    assert.ok(typeof result.ram === 'number');
  });
});
