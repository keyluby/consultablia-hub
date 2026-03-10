import { ComprobanteFiscalElectronico } from '@consultablia/database';
import { CreateEcfInput } from '../schemas/ecf.schema';
export declare function emitirEcf(input: CreateEcfInput, tenantId: string): Promise<ComprobanteFiscalElectronico>;
export declare function getEcfStatus(ecfId: string, tenantId: string): Promise<{
    id: string;
    eNcf: string;
    estadoDgii: import("@consultablia/database").$Enums.EstadoEcfDgii;
    codigoErrorDgii: string | null;
    mensajeErrorDgii: string | null;
}>;
