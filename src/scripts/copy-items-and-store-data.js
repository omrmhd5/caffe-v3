require("../../db/mongoose");
const Item = require("../../models/item");
const Branch = require("../../models/branch");
const itemService = require("../item/service");

const migrate = async () => {
  const branchID = "5f232ad0fd40342548d8fe58";
  const items = await Item.find({ branchID, isSpecial: false });
  const branch = await Branch.findOne({ _id: branchID });

  const branches = await Branch.find({ companyID: branch.companyID });

  for (let currentBranch of branches) {
    if (currentBranch._id == branchID) {
      continue;
    }

    for (let item of items) {
      await itemService.createItem(
        currentBranch._id,
        item.itemName,
        item.price,
        item.isSpecial,
        item.specialItems
      );
    }
  }

  console.log("Done migrating items data");
};

migrate();
