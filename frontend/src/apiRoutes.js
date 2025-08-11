// Configuración para VPS
const API_BASE_URL = 'http://77.237.239.180:3000/api';



const apiRoutes = {
    // Sorteos
    sorteos: `${API_BASE_URL}/sorteos`,
    sorteoById: (id) => `${API_BASE_URL}/sorteos/${id}`,
    ultimoSorteo: `${API_BASE_URL}/sorteos/ultimo`,
    proximoSorteo: `${API_BASE_URL}/sorteos/proximo`,
    // Ganadores
    ganadores: `${API_BASE_URL}/ganadores`,
    premios: `${API_BASE_URL}/premios`,
    // Otros
    users: `${API_BASE_URL}/users`,
    tickets: `${API_BASE_URL}/tickets`,
};

export default apiRoutes;


