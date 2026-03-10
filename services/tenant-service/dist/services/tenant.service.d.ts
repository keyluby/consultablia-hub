import { CreateTenantInput } from '../schemas/auth.schema';
export declare function createTenant(input: CreateTenantInput, creatorUserId: string): Promise<any>;
export declare function getTenantsForUser(userId: string): Promise<any>;
