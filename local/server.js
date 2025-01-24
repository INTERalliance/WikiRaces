// read.js
import { Archive, SuggestionSearcher, Searcher, Query } from "@openzim/libzim";
import {createServer} from "http"

async function read(Path) {
    const outFile = "./wiki.zim";
    const archive = new Archive(outFile);
    console.log(`Archive opened: main entry path - ${archive.mainEntry.path}`);

    try {
        const entry = archive.getEntryByPath(Path);
        const item = entry.item;
        const blob = item.data;
        return blob.data;
    }
    catch {

    }
};


// Creating server 
const server = createServer(async (req, res) => {
    // Sending the response
    let path = req.url
    path = path.slice(1)
    console.log(path)
    const data = await read(path)
    if (data != undefined) {
        res.write(data)

    }
    res.end();
})

// Server listening to port 3000
server.listen((3000), () => {
    console.log("Server is Running");
})