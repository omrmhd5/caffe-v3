const mongoose = require("mongoose");
const Branch = require("./branch");
const Manager = require("./manager");
const Cashier = require("./cashier");
const User = require("./user");
const Item = require("./item");
const Store = require("./store");
const Sales = require("./sales");

const companySchema = new mongoose.Schema(
  {
    companyname: {
      type: String,
      required: true,
      unique: true,
    },
    companyImage: {
      type: String,
    },
    phoneNumber: {
      type: String,
    },
    email: {
      type: String,
    },
    location: {
      type: String,
    },
    notes: {
      type: String,
    },
    hidden: {
      type: Boolean,
      default: false,
    },
    hiddenFromDate: {
      type: Date,
      default: null,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

companySchema.virtual("branches", {
  ref: "Branch",
  localField: "_id",
  foreignField: "companyID",
});

companySchema.pre("remove", async function (next) {
  const branches = await Branch.find({ companyID: this._id });
  branches.forEach(async (branch) => {
    const cashiers = await Cashier.find({ branchID: branch._id });
    cashiers.forEach(async (cashier) => {
      const user = await User.findOne({ _id: cashier.cashierID });
      await user.remove();
      await cashier.remove();
    });

    const items = await Item.find({ branchID: branch._id });

    items.forEach(async (item) => {
      await item.remove();
    });

    const stores = await Store.find({ branchID: branch._id });

    stores.forEach(async (store) => {
      await store.remove();
    });

    const sales = await Sales.find({ branchID: branch._id });

    sales.forEach(async (sale) => {
      await sale.remove();
    });
  });

  branches.forEach(async (branch) => {
    await branch.remove();
  });

  next();
});

const Company = mongoose.model("Company", companySchema);

module.exports = Company;
