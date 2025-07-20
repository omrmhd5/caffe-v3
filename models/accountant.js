const mongoose = require('mongoose');

const accountantSchema = new mongoose.Schema({
    companyID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Company'
    },
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

const Accountant = mongoose.model('Accountant', accountantSchema)

module.exports = Accountant