const ROLES = {
  CLIENTE: 1,
  ADMINISTRADOR: 2,
};

const ROLE_NAMES = {
  [ROLES.CLIENTE]: 'cliente',
  [ROLES.ADMINISTRADOR]: 'administrador',
};

function isAdmin(rolId) {
  return Number(rolId) === ROLES.ADMINISTRADOR;
}

module.exports = { ROLES, ROLE_NAMES, isAdmin };
