module.exports.initDB = function () {
    const fs = require("fs");
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            templates: {},
            topLeft: {
                x: -1500,
                y: -1000
            },
            getCanvasIndex: `
                = $ci 0
                = $rx $x
                = $ry $y


                if $y < 1000 = $ci 0

                if $y >= 1000 = $ci 3
                if $y >= 1000 -= $ry 1000


                if $x >= 1000 if $x < 2000 -= $rx 1000
                if $x >= 5000 if $x < 2000 += $ci 1

                if $x >= 2000 -= $rx 2000
                if $x >= 2000 += $ci 2

                return $rx x
                return $ry y
                return $ci canvasIndex
            `
        }));
    }
    global.db = require("./db.json");
}
module.exports.saveDB = function () {
    const fs = require("fs");
    fs.writeFileSync("./db.json", JSON.stringify(db));
}