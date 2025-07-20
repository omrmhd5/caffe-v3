const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Item",
  },
  price: {
    type: Number,
    required: true,
  },
  boughtquantity: {
    type: Number,
    required: true,
  },
  totalprice: {
    type: Number,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
  time: { type: Date, default: new Date(), required: true },
});

salesSchema.pre("save", async function (next) {
  const sales = this;
  sales.totalprice = sales.boughtquantity * sales.price;

  next();
});

const Sales = mongoose.model("Sales", salesSchema);

module.exports = Sales;
