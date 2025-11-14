const branchService = require("../branch/service");

exports.getAll = async (req, res) => {
  let branchID = null;
  let branch = null;
  let branches = await branchService.getAllBranches(req.user.companyID);

  if (req.user.branchedRole) {
    branchID = req.user.branchID;
    branch = await branchService.getBranchById(branchID);
  } else {
    branchID = req.query.branchID;
    if (branchID) {
      branch = await branchService.getBranchById(branchID);
    }
    branches = branches.map((branchItem) => {
      if (branchItem._id == branchID) {
        branchItem.selected = "selected";
      }
      return branchItem;
    });
  }

  // Empty data array for now - just UI
  const data = [];

  res.render("transfers/transfersReport.hbs", {
    branches,
    branch,
    branchID,
    branchedRole: req.user.branchedRole,
    data,
    expreq: req,
  });
};
