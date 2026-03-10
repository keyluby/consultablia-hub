"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTenant = createTenant;
exports.getTenantsForUser = getTenantsForUser;
const database_1 = require("@consultablia/database");
async function createTenant(input, creatorUserId) {
    const existingTenant = await database_1.db.tenant.findUnique({
        where: { rnc: input.rnc }
    });
    if (existingTenant) {
        throw new Error('El RNC ya está registrado con otra empresa.');
    }
    return await database_1.db.$transaction(async (tx) => {
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
async function getTenantsForUser(userId) {
    return await database_1.db.usuarioTenant.findMany({
        where: { usuarioId: userId, activo: true },
        include: { tenant: true }
    });
}
//# sourceMappingURL=tenant.service.js.map