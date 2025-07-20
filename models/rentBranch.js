const mongoose = require('mongoose');
const rentSchema = new mongoose.Schema({
    rentDate: {
        type: String
        },
    branchID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Branch'
    }
})


const Rent = mongoose.model('Rent', rentSchema)

module.exports = Rent