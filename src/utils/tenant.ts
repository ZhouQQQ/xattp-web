import overseaTenantData from '@/data/oversea_tenant_data.json';
export function getOverseaTenant(env,tenantId) {
   const tenant = overseaTenantData.find(item => item.env === env && item.tenantId === tenantId);
   return tenant ? tenant : null;
}