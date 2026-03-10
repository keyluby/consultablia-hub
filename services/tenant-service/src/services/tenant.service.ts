import { db } from '@consultablia/database';
import { CreateTenantInput } from '../schemas/auth.schema';

export async function createTenant(input: CreateTenantInput, creatorUserId: string): Promise<any> {
    const existingTenant = await db.tenant.findUnique({
        where: { rnc: input.rnc }
    });

    if (existingTenant) {
        throw new Error('El RNC ya está registrado con otra empresa.');
    }

    return await db.$transaction(async (tx) => {
        // 1. Create the tenant
        const newTenant = await tx.tenant.create({
            data: {
                rnc: input.rnc,
                razonSocial: input.razonSocial,
                tipoContribuyente: input.tipoContribuyente,
                emailFiscal: input.emailFiscal,
            }
        });

        // 2. Assign the creator as ADMIN of the new tenant
        await tx.usuarioTenant.create({
            data: {
                usuarioId: creatorUserId,
                tenantId: newTenant.id,
                rol: 'ADMIN' // Dueño / acceso total
            }
        });

        return newTenant;
    });
}

export async function getTenantsForUser(userId: string): Promise<any> {
    return await db.usuarioTenant.findMany({
        where: { usuarioId: userId, activo: true },
        include: { tenant: true }
    });
}
