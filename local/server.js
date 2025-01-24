// read.js
import { Archive, SuggestionSearcher, Searcher, Query } from "@openzim/libzim";
import {createServer} from "http"

const outFile = "./wiki.zim";
const archive = new Archive(outFile);

// Reading from a ZIM file.
async function read(Path) {
    console.log(`Archive opened: main entry path - ${archive.mainEntry.path}`);

    try {
        let entry = archive.getEntryByPath(Path);
        if (entry.isRedirect)
            entry = entry.redirectEntry
        const item = entry.item;
        const blob = item.data;
        return blob.data;
    }
    catch {

    }
}

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
    else {
		res.write("This page could not be found. You can use the timeline at the bottom of the page to go back.") 
    }
    res.end();
})

// Server listening to port 3000
server.listen((3000), () => {
    console.log("Server is Running");
})