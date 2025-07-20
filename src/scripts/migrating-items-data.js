require("../../db/mongoose");
const Item = require("../../models/item");
const Store = require("../../models/store");
const Sales = require("../../models/sales");
const storeService = require("../store/service");

const migrate = async () => {
  await Store.deleteMany({});
  await Sales.deleteMany({});

  const items = await Item.find({});
  for (item of items) {
    if (item.specialItems.length > 0) {
      item.isSpecial = true;
    } else {
      item.isSpecial = false;
    }
    await item.save();

    if (!item.isSpecial) {
      await storeService.addNewStore(item._id, item.branchID);
    }
  }

  console.log("Done migrating items data");
};

migrate();
