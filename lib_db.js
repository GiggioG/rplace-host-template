module.exports.initDB = function() {
    const fs = require("fs");
    if (!fs.existsSync("./db.json")) { fs.writeFileSync("./db.json", JSON.stringify({
        templates: {},
        topLeft: {
            x: -1000,
            y: -500
        }
    })); }
    global.db = require("./db.json");
}
module.exports.saveDB = function() {
    const fs = require("fs");
    fs.writeFileSync("./db.json", JSON.stringify(db));
}