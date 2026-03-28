const models = require("../../models");
const findAllModels = (req,res)=>{
     try {
       const modelNames = Object.keys(models)
      .filter((key) => !['sequelize', 'Sequelize'].includes(key))
      .map((name) => ({ name })); // 👈 convert to key-value object

    res.json({ success: true, data: modelNames });
     } catch (error) {
       console.error("Error fetching models:", error);
       res
         .status(500)
         .json({ success: false, message: "Internal server error" });
     }
}

const findModelFields = (req,res)=>{
    try {
      const { name } = req.params; // ✅ Fixed: use 'name' to match route parameter

      if (!name || !models[name]) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid model name" });
      }

      const model = models[name];
      const attributes = Object.keys(model.rawAttributes);

      res.json({
        success: true,
        model: name,
        fields: attributes,
      });
    } catch (error) {
      console.error("Error fetching model fields:", error);
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
}

module.exports = {findAllModels,findModelFields};