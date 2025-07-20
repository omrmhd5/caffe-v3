require("../../db/mongoose");
const Store = require("../../models/store");
const Item = require("../../models/item");

const migrate = async () => {
  const stores = await Store.find();

  for (let store of stores) {
    store.shortage = store.currentquantity - store.realcurrentquantity;
    
    await store.save();
  }
  console.log("Done Migraing Store Data");
};

migrate();
