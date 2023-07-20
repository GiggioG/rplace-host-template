require('dotenv').config();
const fs = require("fs");
const http = require("http");
const url = require("url");
const qs = require("querystring");
const crypto = require("crypto");
const { initDB, saveDB } = require("./lib_db.js");
const path = require('path');
const PORT = process.env.PORT || 8080;

initDB();
if (!fs.existsSync("./imgs")) { fs.mkdirSync("./imgs"); }

const getUUID = () => crypto.randomBytes(16).toString("hex");

function serveFile(res, file) {
    fs.createReadStream(file).pipe(res);
}

function codeError(res, code, details = null) {
    if (res.writableEnded) { return; }
    res.writeHead(code);
    let str;
    if (code == 200) { str = "OK."; }
    if (code == 201) { str = `Created ${details}.`; }
    if (code == 400) { str = "Bad request."; }
    if (code == 401) { str = "Unauthorised."; }
    if (code == 404) { str = "Not Found."; }
    res.end(`${code}: ${str}`);
}

http.createServer((req, res) => {
    let pathname = url.parse(req.url).pathname;
    if (pathname.endsWith("/")) { pathname = pathname.slice(0, -1); }
    let query = qs.parse(url.parse(req.url).query);

    if (req.method == "GET" && pathname == "/img") {
        if (query.imgname && db[query.imgname]) {
            return serveFile(res, `./imgs/${db[query.imgname].img}`);
        } else {
            return codeError(res, 404);
        }
    } else if (req.method == "GET" && pathname == "/index.json") {
        return serveFile(res, `./db.json`);
    }

    else if (req.method == "POST" && pathname == "/upload") {
        if (req.headers.auth && req.headers.auth == process.env.PWD) {
            if (req.headers['content-type'] == "image/png" && query.imgname && query.x && query.y
                && Number(query.x) != NaN && Number(query.y) != NaN && !db[query.imgname]) {
                const fileName = `${getUUID()}.png`;
                const filePath = "./imgs/" + fileName;
                db[query.imgname] = {
                    x: Number(query.x),
                    y: Number(query.y),
                    img: fileName
                };
                saveDB();
                req.pipe(fs.createWriteStream(filePath));
                req.on("end", () => {
                    return codeError(res, 201, query.imgname);
                });
            } else {
                return codeError(res, 400);
            }
        } else {
            return codeError(res, 401);
        }
    }

    else if (req.method == "DELETE" && pathname == "/remove") {
        if (req.headers.auth && req.headers.auth == process.env.PWD) {
            if (query.imgname && db[query.imgname]) {
                const filePath = "./imgs/" + db[query.imgname].img;
                fs.unlinkSync(filePath);
                delete db[query.imgname];
                saveDB();
                return codeError(res, 200);
            } else {
                return codeError(res, 400);
            }
        } else {
            return codeError(res, 401);
        }
    }

    else {
        return codeError(res, 404);
    }
}).listen(PORT);