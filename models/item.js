const mongoose = require("mongoose");
const Sales = require("./sales.js");
const Store = require("./store.js");

const specialItemsSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
  },
  qty: {
    type: Number,
  },
});

const itemSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Item",
  },
  itemName: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
  isSpecial: {
    type: Boolean,
  },
  isHidden: {
    type: Boolean,
    default: false,
  },
  specialItems: [specialItemsSchema],
});

itemSchema.virtual("store", {
  ref: "Store",
  localField: "_id",
  foreignField: "itemID",
});

itemSchema.virtual("sales", {
  ref: "Sales",
  localField: "_id",
  foreignField: "itemID",
});

itemSchema.pre("remove", async function (next) {
  const sales = await Sales.find({ itemID: this._id });
  sales.forEach(async (Sale) => {
    await Sale.remove();
  });

  const Stores = await Store.find({ itemID: this._id });
  Stores.forEach(async (Store) => {
    await Store.remove();
  });

  next();
});

const Item = mongoose.model("Item", itemSchema);

module.exports = Item;
