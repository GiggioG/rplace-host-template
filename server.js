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
    res.writeHead(200, {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
    });
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
        if (query.imgname && db.templates[query.imgname]) {
            return serveFile(res, `./imgs/${db.templates[query.imgname].img}`);
        } else {
            return codeError(res, 404);
        }
    } else if (req.method == "GET" && pathname == "/thumb") {
        if (query.imgname && db.templates[query.imgname] && db.templates[query.imgname].thumb != null) {
            return serveFile(res, `./imgs/${db.templates[query.imgname].thumb}`);
        } else {
            return codeError(res, 404);
        }
    } else if (req.method == "GET" && pathname == "/index.json") {
        return serveFile(res, `./db.json`);
    } else if (req.method == "GET" && (pathname == "/index.html" || pathname == "")) {
        return serveFile(res, `./index.html`);
    }

    else if (req.method == "POST" && pathname == "/upload") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (req.headers['content-type'] == "image/png" && query.imgname && query.x && query.y && query.priority
                && Number(query.x) != NaN && Number(query.y) != NaN && Number(query.priority) != NaN
                && !db.templates[query.imgname]) {
                const fileName = `${getUUID()}.png`;
                const filePath = "./imgs/" + fileName;
                db.templates[query.imgname] = {
                    x: Number(query.x),
                    y: Number(query.y),
                    img: fileName,
                    thumb: null,
                    priority: Number(query.priority)
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
    }else if (req.method == "POST" && pathname == "/changeHTML") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (req.headers['content-type'] == "text/html") {
                req.pipe(fs.createWriteStream("./index.html"));
                req.on("end", () => {
                    return codeError(res, 201);
                });
            } else {
                return codeError(res, 400);
            }
        } else {
            return codeError(res, 401);
        }
    }

    else if (req.method == "PATCH" && pathname == "/changeThumb") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (req.headers['content-type'] == "image/png" && query.imgname && db.templates[query.imgname]) {
                const newFileName = `${getUUID()}.png`;

                const newFilePath = "./imgs/" + newFileName;
                req.pipe(fs.createWriteStream(newFilePath));

                if (db.templates[query.imgname].thumb != null) {
                    const oldFilePath = "./imgs/" + db.templates[query.imgname].thumb;
                    fs.unlinkSync(oldFilePath);
                }

                db.templates[query.imgname].thumb = newFileName;
                saveDB();

                req.on("end", () => {
                    return codeError(res, 200);
                });
            } else {
                return codeError(res, 400);
            }
        } else {
            return codeError(res, 401);
        }
    } else if (req.method == "PATCH" && pathname == "/move") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (query.imgname && query.x && query.y
                && Number(query.x) != NaN && Number(query.y) != NaN && db.templates[query.imgname]) {
                db.templates[query.imgname].x = Number(query.x);
                db.templates[query.imgname].y = Number(query.y);
                saveDB();
                return codeError(res, 200);
            }
        } else {
            return codeError(res, 401);
        }
    } else if (req.method == "PATCH" && pathname == "/edit") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (req.headers['content-type'] == "image/png" && query.imgname && db.templates[query.imgname]) {
                const newFileName = `${getUUID()}.png`;

                const newFilePath = "./imgs/" + newFileName;
                req.pipe(fs.createWriteStream(newFilePath));

                const oldFilePath = "./imgs/" + db.templates[query.imgname].img;
                fs.unlinkSync(oldFilePath);

                db.templates[query.imgname].img = newFileName;
                saveDB();

                req.on("end", () => {
                    return codeError(res, 200);
                });
            } else {
                return codeError(res, 400);
            }
        } else {
            return codeError(res, 401);
        }
    } else if (req.method == "PATCH" && pathname == "/priority") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (query.imgname && query.priority && Number(query.priority) != NaN && db.templates[query.imgname]) {
                db.templates[query.imgname].priority = Number(query.priority);
                saveDB();
                return codeError(res, 200);
            }
        } else {
            return codeError(res, 401);
        }
    }

    else if (req.method == "DELETE" && pathname == "/remove") {
        if (req.headers.auth && req.headers.auth == process.env.PASSWORD) {
            if (query.imgname && db.templates[query.imgname]) {
                const filePath = "./imgs/" + db.templates[query.imgname].img;
                fs.unlinkSync(filePath);
                delete db.templates[query.imgname];
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