export interface YaVigilReportBody {
  replica: string;
  interval: number;
  load: {
    cpu: number;
    ram: number;
  };
}
