import { cpus } from 'node:os';
import { getHeapStatistics } from 'node:v8';

export type YaWorkloadMeasure = { idle: number; total: number };
export type YaWorkloadResult = {
  /** % CPU (ratio) */
  cpu: number;
  /** % Heap usage (ratio) */
  ram: number;
};

export class YaWorkload {
  private _lastMeasure: YaWorkloadMeasure;

  constructor() {
    this._lastMeasure = this._getCpuUsageInfo();
  }

  /** Get current cpu/ram (heap) usage (%) */
  public getCurrentUsage(): YaWorkloadResult {
    const current = this._getCpuUsageInfo();
    const heapStats = getHeapStatistics();
    const totalDiff = current.total - this._lastMeasure.total;
    const newWorkload = {
      cpu: totalDiff === 0 ? 0 : 1 - (current.idle - this._lastMeasure.idle) / totalDiff,
      ram: (heapStats.total_heap_size || 0.0) / (heapStats.heap_size_limit || 1.0),
    };
    this._lastMeasure = current;
    return newWorkload;
  }

  private _getCpuUsageInfo(): YaWorkloadMeasure {
    return cpus().reduce<YaWorkloadMeasure>(
      (acc, { times }) => {
        let total = 0;
        for (const time in times) {
          total += (times as any)[time] as number;
        }
        return {
          idle: acc.idle + times.idle,
          total: acc.total + total,
        };
      },
      { idle: 0, total: 0 }
    );
  }
}
