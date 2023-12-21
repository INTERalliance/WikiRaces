/*
 * This file renders the information from the leaderboard api.
 */

function generateURL(path) {
	return `${window.location.protocol}//${window.location.host}${path}`;
}

async function getTextFrom(url) {
	var resp;
	var xmlHttp;
	resp = "";
	xmlHttp = new XMLHttpRequest();
	if (xmlHttp != null) {
		xmlHttp.open("GET", url, false);
		xmlHttp.send(null);
		resp = xmlHttp.responseText;
	}
	return resp;
}

async function getLevelNames() {
	const levelsURL = generateURL("/wiki-races/levels.json");
	const resp = await getTextFrom(levelsURL);
	return Object.keys(JSON.parse(resp));
}

/* NOTE: This function runs on document load */
async function getLeaderboardData() {
	const levelsURL = generateURL("/wiki-races/api/leaderboard");
	const resp = await getTextFrom(levelsURL);
	return JSON.parse(resp);
}

async function getLeaderboardOverviewData() {
	const levelsURL = generateURL("/wiki-races/api/leaderboard-overview");
	const resp = await getTextFrom(levelsURL);
	return JSON.parse(resp);
}

async function sortSubmissions(submissions) {
	if (submissions.length <= 0) return undefined;
	return submissions.sort((a, b) => {
		return a.totalTime - b.totalTime;
	});
}

function createTableHeading(levelNames) {
	let element = document.createElement("tr");
	let numbers = document.createElement("th");
	numbers.textContent = "#";
	numbers.className = "align-left";
	let links = document.createElement("th");
	links.textContent = "User";
	links.className = "align-left";

	let time = document.createElement("th");
	time.textContent = "Total";
	time.className = "align-left";

	element.appendChild(numbers);
	element.appendChild(links);
	element.appendChild(time);

	for (levelName of levelNames) {
		let level = document.createElement("th");
		level.textContent = `${levelName}`;
		level.className = "align-left";
		element.appendChild(level);
	}

	return element;
}

function createCell(content) {
	let cell = document.createElement("td");
	cell.innerHTML = content;
	return cell;
}

function createSpan(content) {
	const date = new Date(Number(content));
	const ms = createSpan(date.getMilliseconds());

	let span = document.createElement("span")
	span.textContent = ms.toString();
	return span;
}

// format millisecond time
function formatMS(milliseconds) {
	const date = new Date(Number(milliseconds));
	const m = date.getMinutes();
	const s = date.getSeconds();
	const ms = date.getMilliseconds();
	return `${m}:${s}<span>.${ms}</span>`;
}
function createNameLink(name, userId) {
	let cell = document.createElement("td");
	let link = document.createElement("a");
	link.href = generateURL(`/wiki-races/leaderboard/${userId}`);
	link.textContent = name.toString();
	cell.appendChild(link);
	return cell;
}

let number = 0;
function createTableLine(submission) {
	let element = document.createElement("tr");
	number++;
	element.appendChild(createCell(number));
	element.appendChild(createNameLink(submission.name, submission.userId));
	element.appendChild(createCell(formatMS(submission.totalTime)));

	for (levelTime of Object.values(submission.times)) {
		element.appendChild(createCell(formatMS(levelTime)));
	}
	return element;
}

function getCookie(cookieName) {
	let name = cookieName + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let cookies = decodedCookie.split(";");
	for (let i = 0; i < cookies.length; i++) {
		let c = cookies[i];
		while (c.charAt(0) == " ") {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}

async function getLeaderboardPosition(userId, submissions) {
	const submissionNames = Object.keys(submissions);

	for (var i = 0; i < submissionNames.length; i++) {
		const leaderboardId = submissions[submissionNames[i]]["userId"];

		if (userId === leaderboardId) {
			return i;
		}
	}
	return -1; // Nothing was found
}

const endings = {
	1: "st",
	2: "nd",
	3: "rd",
};
function getEnding(number) {
	const irregulars = Object.keys(endings);
	const numString = number.toString();
	const lastDigit = String(numString[numString.length - 1]);
	if (number > 15) {
		if (irregulars.includes(lastDigit)) {
			return endings[lastDigit];
		} else {
			return "th";
		}
	} else if (number > 3) {
		return "th";
	} else {
		return endings[number];
	}
}

async function getPlaceString(place, allUsers) {
	const numberOfUsers = Object.keys(allUsers).length;
	if (place === -1) {
		return `You are not logged in.`;
	} else {
		place++;
		return `You are in ${place}${getEnding(
			place
		)} place! (out of ${numberOfUsers})`;
	}
}

async function getLeaderboardOverviewString() {
	let data = await getLeaderboardOverviewData();

	let totalAll = formatMS(data.averages);
	let totalFinished = formatMS(data.averagesExcludingDNF);
	
	return `
		The average total time across finished levels was ${totalFinished},
		and ${totalAll} across all levels.
	`;
}

/* This is run at script load: */
(async () => {
	// Load info for leaderboard table
	const levelNames = await getLevelNames();
	const data = await getLeaderboardData();
	const sorted = await sortSubmissions([...data]);
	// Replace level name with capitalized, properly spaced name.
	let newLevelNames = [];
	levelNames.forEach(function(level) {
		level = level.slice(5)
		level = `Level ` + level
		newLevelNames.push(level);
	})
	// Load names into ceremony graphic
	document.querySelector("#first-name p").innerHTML = sorted[0].name;
	document.querySelector("#second-name p").innerHTML = sorted[1].name;
	document.querySelector("#third-name p").innerHTML = sorted[2].name;
	// Generate leaderboard table
	let levelsDiv = document.getElementById("levels-table");
	let table = document.createElement("table");
	table.append(createTableHeading(newLevelNames));

	for (submission of sorted) {
		table.append(createTableLine(submission));
	}

	levelsDiv.append(table);

	// Display user position. Disabled for 2024 redesign.
	/*const posText = document.getElementById("leaderboard-position");
	const userId = getCookie("userId");
	const position = await getLeaderboardPosition(userId, sorted);
	posText.textContent = await getPlaceString(position, sorted);
	posText.innerHTML += '<br>';
	posText.innerHTML += await getLeaderboardOverviewString();*/
})();
