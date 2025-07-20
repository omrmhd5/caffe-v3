const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema({
  itemID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Item",
  },
  boughtquantity: {
    type: Number,
    required: true,
  },
  soldquantity: {
    type: Number,
    required: true,
  },
  currentquantity: {
    type: Number,
    required: true,
  },
  realcurrentquantity: {
    type: Number,
    default: 0,
  },
  shortage: {
    type: Number,
    default: 0,
  },
  branchID: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Branch",
  },
});

storeSchema.pre("save", async function (next) {
  const store = this;
  if (store.isModified("boughtquantity") || store.isModified("soldquantity")) {
    store.currentquantity = store.boughtquantity - store.soldquantity;
  }
  next();
});

const Store = mongoose.model("Store", storeSchema);

module.exports = Store;
