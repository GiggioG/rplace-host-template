module.exports.initDB = function () {
    const fs = require("fs");
    if (!fs.existsSync("./db.json")) {
        fs.writeFileSync("./db.json", JSON.stringify({
            templates: {},
            topLeft: {
                x: -1000,
                y: -500
            },
            getCanvasIndex: `
                = $ci 0
                = $rx $x
                = $ry $y


                if $y < 500 = $ci 0
                if $y < 500 += $ry 500

                if $y >= 500 = $ci 3
                if $y >= 500 -= $ry 500


                if $x < 500 += $rx 500

                if $x >= 500 if $x < 1500 -= $rx 500
                if $x >= 500 if $x < 1500 += $ci 1

                if $x >= 1500 -= $rx 1500
                if $x >= 1500 += $ci 2

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