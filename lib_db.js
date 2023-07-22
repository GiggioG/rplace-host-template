module.exports.initDB = function () {
    const fs = require("fs");
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            templates: {},
            topLeft: {
                x: -1000,
                y: -500
            },
            getCanvasIndex: (function (x, y) {
                let canvasIndex;
                if (y < 500) {
                    canvasIndex = 0;
                    y += 500;
                } else if (y >= 500) {
                    canvasIndex = 3;
                    y -= 500;
                }

                if (x < 500) {
                    x += 500;
                } else if (x >= 500 && x < 1500) {
                    x -= 500;
                    canvasIndex += 1;
                } else if (x >= 1500) {
                    x -= 1500;
                    canvasIndex += 2;
                }
                return { x, y, canvasIndex };
            }).toString()
        }));
    }
    global.db = require("./db.json");
}
module.exports.saveDB = function () {
    const fs = require("fs");
    fs.writeFileSync("./db.json", JSON.stringify(db));
}