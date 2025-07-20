const mongoose = require('mongoose');
const User = require('../models/user')
const cashierSchema = new mongoose.Schema({
    cashierID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    branchID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Branch'
    }
})


const Cashier = mongoose.model('Cashier', cashierSchema)

module.exports = Cashier