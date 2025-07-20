const Partner = require("../../models/partner");

exports.getByDate = (date) => {
  return Partner.findOne({
    date,
  });
};

exports.update = async (date, partnersCount) => {
  await Partner.findOneAndUpdate(
    {
      date,
    },
    {
      date,
      partnersCount,
    },
    {
      upsert: true,
    }
  );
};
