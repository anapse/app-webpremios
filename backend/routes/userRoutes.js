const express = require('express')
const router = express.Router()
const userController = require('../controllers/userController')

router.get('/', userController.getUsers)
router.post('/', userController.createUser)
router.post('/login', userController.loginUser)

module.exports = router
