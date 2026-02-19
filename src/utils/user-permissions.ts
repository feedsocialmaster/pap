/**
 * Utilidades para permisos de usuarios en el CMS
 * 
 * Implementa la lógica de permisos del lado del cliente para:
 * - Determinar qué botones de acción mostrar/habilitar
 * - Filtrar opciones de rol en formularios
 * - Mostrar tooltips explicativos
 */

// Constantes de roles
export const ROLE_SUPER_SU = 'SUPER_SU';
export const ROLE_ADMIN_CMS = 'ADMIN_CMS';
export const ROLE_VENDEDOR = 'VENDEDOR';

/**
 * Tipo para la información de permisos de acciones sobre un usuario
 */
export interface UserActionPermissions {
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  deleteDisabled: boolean;
  deleteTooltip?: string;
  editTooltip?: string;
  viewTooltip?: string;
  isSameAccount: boolean;
  isTargetSuperuser: boolean;
}

/**
 * Calcula los permisos de acciones sobre un usuario
 * Usado por la UI para determinar qué botones mostrar/habilitar
 * 
 * @param actorRole - Rol del usuario autenticado
 * @param actorId - ID del usuario autenticado
 * @param targetRole - Rol del usuario objetivo
 * @param targetId - ID del usuario objetivo
 * @returns Permisos calculados
 */
export function calculateUserActionPermissions(
  actorRole: string,
  actorId: string,
  targetRole: string,
  targetId: string
): UserActionPermissions {
  const isSameAccount = actorId === targetId;
  const isTargetSuperuser = targetRole === ROLE_SUPER_SU;
  const isActorSuperuser = actorRole === ROLE_SUPER_SU;
  const isActorAdmin = actorRole === ROLE_ADMIN_CMS;
  const isActorVendedor = actorRole === ROLE_VENDEDOR;
  const isTargetAdmin = targetRole === ROLE_ADMIN_CMS;

  let canView = true;
  let canEdit = true;
  let canDelete = true;
  let deleteTooltip: string | undefined;
  let editTooltip: string | undefined;
  let viewTooltip: string | undefined;

  // REGLA 1: SUPER_SU no puede actuar sobre su propia cuenta (excepto ver)
  if (isSameAccount && isActorSuperuser) {
    canView = true; // Puede ver su perfil
    canEdit = false;
    canDelete = false;
    editTooltip = 'No puede editar su propia cuenta desde el CMS';
    deleteTooltip = 'No puede eliminar su propia cuenta';
  }

  // REGLA 2: Nadie puede eliminar SUPER_SU (mostrar botón disabled con tooltip)
  if (isTargetSuperuser) {
    canDelete = false;
    deleteTooltip = 'No es posible eliminar cuentas con rol Superuser desde este panel';
  }

  // REGLA 3: ADMIN_CMS no puede ver/editar SUPER_SU
  if (isActorAdmin && isTargetSuperuser) {
    canView = false;
    canEdit = false;
    viewTooltip = 'No tiene permisos para ver usuarios Superuser';
    editTooltip = 'No tiene permisos para editar usuarios Superuser';
  }

  // REGLA 4: ADMIN_CMS no puede editar/eliminar otros ADMIN_CMS
  if (isActorAdmin && isTargetAdmin && !isSameAccount) {
    canEdit = false;
    canDelete = false;
    editTooltip = 'No tiene permisos para editar otros administradores';
    deleteTooltip = 'No tiene permisos para eliminar otros administradores';
  }

  // REGLA 5: VENDEDOR no puede editar ni eliminar
  if (isActorVendedor) {
    canEdit = false;
    canDelete = false;
    editTooltip = 'No tiene permisos para editar usuarios';
    deleteTooltip = 'No tiene permisos para eliminar usuarios';
  }

  return {
    canView,
    canEdit,
    canDelete,
    deleteDisabled: !canDelete,
    deleteTooltip,
    editTooltip,
    viewTooltip,
    isSameAccount,
    isTargetSuperuser,
  };
}

/**
 * Determina qué roles puede ver/seleccionar un usuario en formularios
 * 
 * @param actorRole - Rol del usuario autenticado
 * @returns Array de roles permitidos para seleccionar
 */
export function getAllowedRolesForCreation(actorRole: string): string[] {
  const allRoles = ['CLIENTA', 'VENDEDOR', 'ADMIN_CMS', 'SUPER_SU'];
  
  // SUPER_SU puede asignar todos los roles
  if (actorRole === ROLE_SUPER_SU) {
    return allRoles;
  }
  
  // ADMIN_CMS puede asignar todos excepto SUPER_SU
  if (actorRole === ROLE_ADMIN_CMS) {
    return allRoles.filter(role => role !== ROLE_SUPER_SU);
  }
  
  // VENDEDOR no puede crear usuarios
  return [];
}

/**
 * Determina si un usuario puede acceder a la gestión de usuarios
 * 
 * @param actorRole - Rol del usuario autenticado
 * @returns true si puede acceder
 */
export function canAccessUserManagement(actorRole: string): boolean {
  // VENDEDOR no puede acceder a gestión de usuarios
  if (actorRole === ROLE_VENDEDOR) {
    return false;
  }
  
  return true;
}

/**
 * Mensajes de error amigables para códigos de error del backend
 */
export const USER_PERMISSION_ERROR_MESSAGES: Record<string, string> = {
  SUPERUSER_DELETE_FORBIDDEN: 'No es posible eliminar cuentas con rol Superuser desde este panel. Contacte al administrador del sistema.',
  SUPERUSER_SELF_EDIT_FORBIDDEN: 'Un Superuser no puede modificar su propia cuenta desde el CMS.',
  SUPERUSER_CREATE_FORBIDDEN: 'Solo un Superuser puede crear cuentas con rol Superuser.',
  SUPERUSER_ROLE_ASSIGN_FORBIDDEN: 'Solo un Superuser puede asignar el rol Superuser a otros usuarios.',
  VENDEDOR_CREATE_FORBIDDEN: 'Los usuarios con rol Vendedor no pueden crear usuarios.',
  VENDEDOR_EDIT_FORBIDDEN: 'Los usuarios con rol Vendedor no pueden editar usuarios.',
  VENDEDOR_DELETE_FORBIDDEN: 'Los usuarios con rol Vendedor no pueden eliminar usuarios.',
  ADMIN_EDIT_SUPERUSER_FORBIDDEN: 'Los administradores no pueden editar usuarios Superuser.',
  ADMIN_EDIT_ADMIN_FORBIDDEN: 'Los administradores no pueden editar otros administradores.',
  ADMIN_DELETE_ADMIN_FORBIDDEN: 'Los administradores no pueden eliminar otros administradores.',
  ADMIN_VIEW_SUPERUSER_FORBIDDEN: 'Los administradores no pueden ver usuarios Superuser.',
  SELF_DELETE_FORBIDDEN: 'No puede eliminar su propia cuenta.',
};

/**
 * Obtiene un mensaje de error amigable a partir de la respuesta del servidor
 * 
 * @param error - Error de axios o respuesta del servidor
 * @returns Mensaje de error amigable
 */
export function getUserPermissionErrorMessage(error: any): string {
  const codigo = error.response?.data?.codigo;
  if (codigo && USER_PERMISSION_ERROR_MESSAGES[codigo]) {
    return USER_PERMISSION_ERROR_MESSAGES[codigo];
  }
  
  const mensaje = error.response?.data?.mensaje;
  if (mensaje) {
    return mensaje;
  }
  
  const errorMsg = error.response?.data?.error;
  if (errorMsg) {
    return errorMsg;
  }
  
  return 'Operación no permitida: política de seguridad de cuentas.';
}
