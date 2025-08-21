// Configuración para VPS
const API_BASE_URL = '/api';

const apiRoutes = {
    // Sorteos
    sorteos: `${API_BASE_URL}/sorteos`,
    sorteoById: (id) => `${API_BASE_URL}/sorteos/${id}`,
    ultimoSorteo: `${API_BASE_URL}/sorteos/ultimo`,
    proximoSorteo: `${API_BASE_URL}/sorteos/proximo`,
    // Ganadores
    ganadores: `${API_BASE_URL}/ganadores`,
    premios: `${API_BASE_URL}/premios`,
    homeBanner: `${API_BASE_URL}/home-banner`,
    // Usuarios
    users: `${API_BASE_URL}/users`,
    userLogin: `${API_BASE_URL}/users/login`,

    // Tickets
    tickets: `${API_BASE_URL}/tickets`,
    ticketsByDni: (dni) => `${API_BASE_URL}/tickets/dni/${encodeURIComponent(dni)}`,
    ticketByCode: (codigo) => `${API_BASE_URL}/tickets/codigo/${encodeURIComponent(codigo)}`,

    // Pagos
    niubizPayment: `${API_BASE_URL}/niubiz/payment`,

    // Otros
    libroReclamaciones: `${API_BASE_URL}/libro-reclamaciones`,
};

export default apiRoutes;


