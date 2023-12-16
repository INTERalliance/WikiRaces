// Statistics
const stats = require("./stats");
const avg = new stats.Average();

// Bunyan, for logging
const bunyan = require("bunyan");
const bunyanOpts = {
	name: "DynamicGeneration",
	streams: [
		{
			level: "debug",
			stream: process.stdout,
		},
		{
			level: "info",
			path: "/var/tmp/WikiRaces.json",
		},
	],
};
const log = bunyan.createLogger(bunyanOpts);

// fs, for caching files
const fs = require("fs");
const asyncfs = require("fs").promises;
const path = require("path");

// basic html and css
const { fillTemplate } = require("./template");

// wiki to fetch wikipedia pages
const wiki = require('wikipedia');

// This gets the raw html from wikipedia.
// I do not use an API because I want to preserve
// the look of the website.
async function getWiki(id) {
	try {
		// const response = await superagent.get(
		// 	`https://en.wikipedia.org/wiki/${id}?useskin=vector`
		// );
		const page = await wiki.page(id);
		const html = await page.html();
		log.info(`Downloaded ${id}`);
		return html;
	} catch (error) {
		log.warn(error);
		return undefined;
	}
}

function tryRemoveClass(page, name) {
	const regex = new RegExp(`<div.*class="${name}.*>([\s\S]*?)<\/div>`, "gm");
	return page.replace(regex, "");
}

function tryRemoveId(page, name) {
	const regex = new RegExp(`<div.*id="${name}.*>([\s\S]*?)<\/div>`, "gm");
	return page.replace(regex, "");
}

async function formatPage(page) {
	// I previously used a DOM emulator (jsdom) to remove elements,
	// and, in terms of performance, this wall of regex is significantly better.

	// remove html boilerplate:
	page = page.replace("<!DOCTYPE html>", "");
	page = page.replace("<body>", "");
	page = page.replace("</body>", "");
	page = page.replace(/<html.*>/, "");
	page = page.replace("</html>", "");
	// removes all script tags
	page = page.replace(
		/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
		""
	);
	// remove footer
	page = page.replace(/<footer[\s\S]*<\/footer>/gm, "");
	// remove citations
	page = page.replace(/<h2.*id="References.*h2>/gm, "");
	page = page.replace(/<li id="cite_note([\s\S]*?)<\/li>/gm, "");
	// remove navigation
	page = page.replace("<h2>Navigation menu</h2>", "");
	page = page.replace(
		/<div id="mw-navigation([\s\S]*?)<\/form>\n<\/div>/gm,
		""
	);
	// remove external links section
	page = page.replace(/<nav id="p-([\s\S]*?)<\/nav>/gm, "");
	page = page.replace(/<h2.*External links.*<\/h2>/gm, "");
	page = page.replace(/<table.*sistersitebox([\s\S]*?)<\/table>/gm, "");
	page = page.replace(/<div role.*sistersitebox.*$/gm, "");
	// replace external links with text
	page = page.replace(/<a .*external text.*<\/a>/g, "[external link]");
	// remove Jump To ___ links
	page = page.replace(/<a class.*Jump.*/g, "");
	// remove php scripts
	page = page.replace(/<link rel.*php\?.*/g, "");
	// remove all [edit] boxes without removing the end tags
	page = page.replace(/<span class="mw-editsection">.*(?=(<\/h.*>))/g, "");
	page = page.replace(/<div.*class="refbegin.*>([\s\S]*?)<\/div>/gm, "");
	page = page.replace(
		/<div role="navigation".*navbox auth.*>([\s\S]*?)<\/div>/gm,
		""
	);
	// remove divs by class
	page = tryRemoveClass(page, "reflist");
	page = tryRemoveClass(page, "printfooter");
	page = tryRemoveClass(page, "navbox authority-control");
	page = tryRemoveClass(page, "mw-indicator");
	// remove divs by id
	page = tryRemoveId(page, "catlinks");
	page = tryRemoveId(page, "p-search");

	return page;
}

async function generatePage(id) {
	// get raw html from wikipedia.
	let page = await getWiki(id);
	if (!page) {
		return "This page does not exist.";
	}
	// page = await formatPage(page);
	// page = await fillTemplate(page, id);
	return page;
}

// make folder if none exists
const cacheFolder = path.join(__dirname, "/cache");
try {
	if (!fs.existsSync(cacheFolder)) {
		fs.mkdirSync(cacheFolder);
	}
} catch (err) {
	log.error(err);
}

// save file to cache
async function saveFile(id, content, suffix = ".html") {
	try {
		fs.writeFile(`${cacheFolder}/${id}${suffix}`, content, (err) => {
			if (err) {
				log.error(err);
				return undefined;
			}
			log.info(`saved ${id} to cache.`);
		});
	} catch (err) {
		log.error(err);
	}
}

function isCached(id) {
	try {
		return fs.existsSync(`${cacheFolder}/${id}.html`);
	} catch (err) {
		return false;
	}
}

// get file from cache, or return undefined
async function getCached(id, suffix = ".html") {
	try {
		log.info(`read ${id} from cache.`);
		return asyncfs.readFile(`${cacheFolder}/${id}${suffix}`, "utf-8");
	} catch (err) {
		log.error("Error opening cached file: ", err);
		return undefined;
	}
}

// gets file from cache if it exists,
// otherwise it downloads the file from the internet.
async function getPage(id) {
	id = encodeURI(id);
	try {
		let page = "";
		if (isCached(id)) {
			avg.add(1);
			page = await getCached(id);
		}
		if (!page) {
			avg.add(0);
			page = await generatePage(id);
			saveFile(id, page);
		}
		log.info(`${Number(((await avg.average()) * 100).toFixed(4))}% cached`);
		return page;
	} catch (err) {
		log.error(`Error in page load ${err}`);
	}
}

module.exports = {
	getPage,
	getCached,
	getWiki,
	saveFile,
	getCached,
};
