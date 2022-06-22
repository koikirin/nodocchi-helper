const http = require("http");
const { getCurrentRank, stringify_ranks } = require("./src.js");
const mongo = require("mongodb");

let client = new mongo.MongoClient("mongodb://127.0.0.1:27017/tenhou")
client.connect()


function GetRequestParamValue(request, paras) {
    var url = request.url;
    var paraString = url.substring(url.indexOf("?") + 1, url.length).split("&");
    var paraObj = {}
    let i, j;
    for (i = 0; j = paraString[i]; i++) {
        paraObj[j.substring(0, j.indexOf("=")).toLowerCase()] = j.substring(j.indexOf("=") + 1, j.length);
    }
    var returnValue = paraObj[paras.toLowerCase()];
    if (typeof (returnValue) == "undefined") {
        return "";
    } else {
        return decodeURIComponent(returnValue);
    }
}

async function updateToDatabase(ranks) {
    await client.db().collection("ranks").updateOne({
        username: ranks.username,
    },
        {
            "$set": {
                query_time: Date.now(),
                ...ranks
            }
        }, options = {
            upsert: true
        })
}

const server = http.createServer((request, res) => {
    if (request.url.startsWith("/rank")) {
        const username = GetRequestParamValue(request, 'username');
        const p = getCurrentRank(username).then(ranks => {
            try {
                updateToDatabase(ranks)

                ranks.description = `${username} ${stringify_ranks(ranks)}`
                ranks.hdescription = `${stringify_ranks(ranks, true)}`
                console.log(ranks.description);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.write(JSON.stringify(ranks));
                res.end();
            } catch (e) {
                console.log(e)
                res.writeHead(500);
                res.end();
            }
        }).catch(e => {
            console.log(e);
            res.writeHead(502);
            res.end();
        })
    } else {
        res.writeHead(404);
        res.end();
    }
});

server.listen(7235, "127.0.0.1");

console.log("Server running at :7235");
