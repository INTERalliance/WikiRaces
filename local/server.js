// read.js
import { Archive} from "@openzim/libzim";
import { createServer } from "http"

const outFile = "./wiki.zim";
const archive = new Archive(outFile);

// Reading from a ZIM file.
async function read(Path) {
    console.log(`Archive opened: main entry path - ${archive.mainEntry.path}`);

    try {
        let entry = archive.getEntryByPath(Path);
        // catch redirects
        if (entry.isRedirect)
            entry = entry.redirectEntry
        // read and return data
        const item = entry.item;
        const blob = item.data;
        return blob.data;
    }
    catch {}
}

// Creating server 
const server = createServer(async (req, res) => {
    // Sending the response
    let path = req.url
    path = path.slice(1)
    let decodedPath;

    // Parse special characters.
    try {
        decodedPath = decodeURIComponent(path);
    } catch (e) {
        // Catches a malformed URI
        decodedPath = path
    }

    const data = await read(decodedPath)
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