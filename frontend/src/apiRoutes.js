const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://77.237.239.180:3000/api';

const apiRoutes = {
    base: API_BASE_URL,

    ganadores: `${API_BASE_URL}/ganadores`,
    registrarGanador: `${API_BASE_URL}/ganadores/registrar`,

    tickets: `${API_BASE_URL}/tickets`,
    registrarTicket: `${API_BASE_URL}/tickets/registrar`,

    // puedes seguir agregando así...
    premios: `${API_BASE_URL}/premios`,
    usuarios: `${API_BASE_URL}/usuarios`,
};

export default apiRoutes;
