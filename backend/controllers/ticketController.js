// controllers/ticketController.js

const tickets = [] // Puedes reemplazar esto luego con DB

exports.getTickets = (req, res) => {
    res.json(tickets)
}

exports.createTicket = (req, res) => {
    const { dni, nombres, telefono, departamento, comprobante } = req.body

    const nuevoTicket = {
        id: tickets.length + 1,
        dni,
        nombres,
        telefono,
        departamento,
        comprobante,
        fecha: new Date()
    }

    tickets.push(nuevoTicket)
    res.status(201).json(nuevoTicket)
}
