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

/**
 * Takes HTML and processes it to be embedded in the template by
 * removing html and body tags.
 * @param {string} page - a raw HTML page returned from wikipedia
 * @returns {string}
 */
function processHTML(page) {
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

	return page;
}

/**
 * Queries the Wikipedia Page API for a given page ID.
 *
 * This currently uses the 
 * [Wikipedia npm library](https://github.com/dopecodez/Wikipedia)
 * which should call the 
 * [GET `/page/html/{title}` endpoint](https://en.wikipedia.org/api/rest_v1/#/Page%20content/get_page_html__title_).
 * @param {string} id 
 * @returns {Promise<string>}
 */
async function generatePage(id) {
	// get raw html from wikipedia.
	try {
		log.info(`Downloading ${id}`);
		let page = await wiki.page(id);
		if (!page) {
			return "This page does not exist.";
		}
		let html = await page.html();
		html = processHTML(html);
		page = fillTemplate(html, id, page.title);
		return page;
	} catch (error) {
		log.warn(error);
		return undefined;
	}
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

/**
 * save file to cache
 * @param {string} id - A [URI encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) Wikipedia Page ID or filename
 * @param {string | NodeJS.ArrayBufferView} content - the content to write to the file
 * @param {string?} suffix - any file extension for the file name / id. defaults to ".html"
 */
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

/**
 * checks if Wikipedia Page Id is cached locally. 'id' should not include the file extension, but should be URI encoded
 * @param {string} id - A [URI encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) Wikipedia Page ID 
 * @returns {boolean}
 */
function isCached(id) {
	try {
		return fs.existsSync(`${cacheFolder}/${id}.html`);
	} catch (err) {
		return false;
	}
}

/**
 * get file from cache, or return undefined 
 * @param {string} id - A [URI encoded](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent) Wikipedia Page ID
 * @param {string?} suffix - any file extension for the file name / id. defaults to ".html"
 * @returns {Promise<Buffer>}
 */
async function getCached(id, suffix = ".html") {
	try {
		log.info(`read ${id} from cache.`);
		return asyncfs.readFile(`${cacheFolder}/${id}${suffix}`, "utf-8");
	} catch (err) {
		log.error("Error opening cached file: ", err);
		return undefined;
	}
}

/**
 * Gets file from cache if it exists, otherwise it downloads the file from the internet.
 * @param {string} id - Wikipedia page id (NOT URI encoded)
 * @returns {string} the entire html of the Wikipedia page, processed for embedding
 */
async function getPage(id) {
	const encodedId = encodeURIComponent(id);
	try {
		let page = "";
		if (isCached(encodedId)) {
			avg.add(1);
			page = await getCached(encodedId);
		}
		if (!page) {
			avg.add(0);
			page = await generatePage(id);
			saveFile(encodedId, page);
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
	saveFile,
};
