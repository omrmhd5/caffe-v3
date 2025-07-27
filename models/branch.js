const mongoose = require("mongoose");
const Cashier = require("./cashier");
const User = require("./user");
const Item = require("./item");
const Store = require("./store");
const Sales = require("./sales");
const branchSchema = new mongoose.Schema({
  branchname: {
    type: String,
    required: true,
  },
  companyID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Company",
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  hiddenFromDate: {
    type: Date,
    default: null,
  },
  rentHistory: [
    {
      value: { type: Number, required: true },
      fromDate: { type: Date, required: true },
    },
  ],
  madaRatioHistory: [
    {
      value: { type: Number, required: true },
      fromDate: { type: Date, required: true },
    },
  ],
  // custodies: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "Custody",
  //   },
  // ],
  // custodyRequests: [
  //   {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: "CustodyRequest",
  //   },
  // ],
});

branchSchema.virtual("store", {
  ref: "Store",
  localField: "_id",
  foreignField: "branchID",
});

branchSchema.virtual("item", {
  ref: "Item",
  localField: "_id",
  foreignField: "branchID",
});

branchSchema.virtual("sales", {
  ref: "Sales",
  localField: "_id",
  foreignField: "branchID",
});

branchSchema.pre("remove", async function (next) {
  const cashiers = await Cashier.find({ branchID: this._id });
  cashiers.forEach(async (cashier) => {
    const user = await User.findOne({ _id: cashier.cashierID });
    await user.remove();
  });
  cashiers.forEach(async (cashier) => {
    await cashier.remove();
  });

  const items = await Item.find({ branchID: this._id });

  items.forEach(async (item) => {
    await item.remove();
  });

  const stores = await Store.find({ branchID: this._id });

  stores.forEach(async (store) => {
    await store.remove();
  });

  const sales = await Sales.find({ branchID: this._id });

  sales.forEach(async (sale) => {
    await sale.remove();
  });

  next();
});

const Branch = mongoose.model("Branch", branchSchema);

module.exports = Branch;
