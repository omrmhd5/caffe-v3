const mongoose = require('mongoose');
const accountantManagerSchema = new mongoose.Schema({
    companyID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Company'
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

const AccountantManager = mongoose.model('AccountantManager', accountantManagerSchema)

module.exports = AccountantManager