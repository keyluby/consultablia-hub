import { Worker } from 'bullmq';
interface EcfJobData {
    ecfId: string;
    tenantId: string;
}
export declare const ecfWorker: Worker<EcfJobData, any, string>;
export {};
