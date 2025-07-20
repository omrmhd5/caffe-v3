const mongoose = require('mongoose');

const invoicerSchema = new mongoose.Schema({
    branchID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch'
    },
    managerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    suspended: {
        type:Boolean,
        default: false
    }
})

const Invoicer = mongoose.model('Invoicer', invoicerSchema)

module.exports = Invoicer