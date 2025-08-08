exports.getUsers = (req, res) => {
    res.json([{ id: 1, name: 'Jesus' }])
}

exports.createUser = (req, res) => {
    const { name } = req.body
    res.status(201).json({ id: 2, name })
}
