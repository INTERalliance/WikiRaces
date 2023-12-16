// My code to interact with mongodb.
// `db` is not the same as mongodb's `db`
const { Database } = require("./database");
const db = new Database();

// saveFile and getCached, to cache generated leaderboards
// because I expect leaderboards to be refreshed often.
const { saveFile, getCached } = require("./dynamic");

// bunyan, for logging
const bunyan = require("bunyan");
const bunyanOpts = {
	name: "Leaderboard",
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

// fs and path, to read levels.json
const fs = require("fs").promises;
const path = require("path");

const levelsFile = path.join(__dirname, "/game_static/levels.json");

async function getLevelData() {
	const file = await fs.readFile(`${levelsFile}`, "utf-8");
	return JSON.parse(file);
}

async function getLevelNames() {
	return Object.keys(await getLevelData());
}

// gets difference in milliseconds
async function getDateDeltas(open, close) {
	const date = new Date(Date.parse(close) - Date.parse(open));
	return date.getTime();
}

// return level time in milliseconds
async function parseTime(obj) {
	submission = await obj;
	if (submission.levelOpen && submission.submitTime) {
		return await getDateDeltas(submission.levelOpen, submission.submitTime);
	}
	return undefined;
}

async function fillInMissing(total, times) {
	const levels = await getLevelData();
	const levelNames = Object.keys(await levels);

	for (levelName of levelNames) {
		if (!times[levelName]) {
			const level = levels[levelName];
			const time = await getDateDeltas(level.startTime, level.endTime);
			times[levelName] = time;
			total += Number(time);
		}
	}
	return [total, times];
}

/*
 * I break getting user times into two steps:
 *   - get all the times of the submitted levels
 *   - add all the times of the non-submitted levels
 *
 * This saves having to loop over the submissions to find
 * a particular object, and means we can get the times by
 * looping over both the submissions and the levelnames once.
 */
async function getUserTimes(userId, fillInAll = true) {
	const submissions = await db.getCollection(
		{ userId: userId },
		"submissions"
	);
	times = {};
	totalTime = 0;

	for (submission of submissions) {
		time = await parseTime(submission);

		// Do nothing with submissions that have no links
		if (submission.totalLinks === 0) continue;

		// If there are multiple submissions for one level, choose the shortest one
		if (times[submission.levelName] !== undefined) {
			if (times[submission.levelName] > time) {
				totalTime -= Number(times[submission.levelName]);
				times[submission.levelName] = time;
				totalTime += Number(time);
			}
		} else if (submission.totalLinks !== 0) {
			times[submission.levelName] = time;
			totalTime += Number(time);
		}
	}

	if (fillInAll) {
		[totalTime, times] = await fillInMissing(totalTime, times);
	}

	// Quick patch to make sure levels are ordered correctly:
	let sortedTimes = {};
	const names = await getLevelNames();
	for (levelName of names) {
		sortedTimes[levelName] = times[levelName];
	}

	return [totalTime, sortedTimes];
}

async function getUserIds() {
	const users = await db.getUsers();
	let userIds = [];
	for (user of users) {
		userIds.push(user.userId);
	}
	return userIds;
}

async function generateLeaderboard() {
	log.info("generated leaderboard");
	const userIds = await getUserIds();

	let leaderboard = [];

	for (let id of userIds) {
		const user = await db.getUserById(id);
		const [totalTime, times] = await getUserTimes(id);
		leaderboard.push({
			userId: id,
			name: user.name,
			totalTime: totalTime,
			times: times,
		});
	}

	return leaderboard;
}

var lastGenerated = new Date();
const seconds = 3;
const cacheName = "leaderboard";
async function getLeaderboard() {
	// Only generate leaderboard every `seconds` seconds.
	if (new Date().getTime() > lastGenerated.getTime() + seconds * 1000) {
		lastGenerated = new Date();

		const leaderboard = await generateLeaderboard();
		saveFile(cacheName, JSON.stringify(leaderboard), ".json");

		return leaderboard;
	} else {
		return getCached(cacheName, ".json");
	}
}

async function getLevelsByUser(userId) {
	let submissions = await db.getSubmissions({ userId: userId });
	for (submission of submissions) {
		delete submission._id;
	}
	const user = await db.getUserById(userId);
	return { name: user.name, submissions: submissions };
}

async function getLevelsLeaderboard() {
	const levelNames = await getLevelNames();
	let submissions = new Set();
	for (levelName of levelNames) {
		let arr = await db.getSubmissions({ levelName: levelName });
		for (submission of arr) {
			delete submission._id;
		}
		submissions[levelName] = arr;
	}
	return JSON.stringify(submissions);
}

async function averageTimes(fillAll) {
	const userIds = await getUserIds();

	let leaderboard = [];

	try {
		for (let id of userIds) {
			const user = await db.getUserById(id);
			const [totalTime, times] = await getUserTimes(id, fillAll);
			let goodTimes = Object.values(times).filter(time => time != null);
			leaderboard = leaderboard.concat(goodTimes);
		}
	} catch (err) {
		log.error(err)
	}

	if (leaderboard.length == 1) {
		return leaderboard[0].toString();
	}

	let average = leaderboard.reduce((acc, ele) => acc + ele, 0) / leaderboard.length;
	if (average) {
		return average.toString();
	} else {
		return "None";
	}
}

async function generateLeaderboardOverview() {
	log.info("generated leaderboard");

	let averages, averagesExcludingDNF;
	averages = averagesExcludingDNF = 0;

	try {
		averages = await averageTimes(true);
		averagesExcludingDNF = await averageTimes(false);
		log.info("line 219", { averages, averagesExcludingDNF });
	} catch (err) {
		log.error(err);
	}

	return {
		averages,
		averagesExcludingDNF,
	};
}

async function getLeaderboardOverview() {
	return await generateLeaderboardOverview();
	// Only generate leaderboard every `seconds` seconds. 
	// (uncomment this if we have *lots* of people hitting the leaderboard at once)
	// if (new Date().getTime() > lastGenerated.getTime() + seconds * 1000) {
	// lastGenerated = new Date();
	// const leaderboard = await generateLeaderboardOverview();
	// try {
	// 	saveFile("leaderboard-overview", JSON.stringify(leaderboard), ".json");
	// } catch (err) {
	// 	log.error(err)
	// }
	// return leaderboard;
	// } else {
	// return getCached("leaderboard-overview", ".json");
	// }
}

// Only getLeaderboard() and getLevelsByUser() are actually used.
// The rest are exported for testing.
module.exports = {
	getLeaderboard,
	getLevelsByUser,
	getLevelData,
	getLevelNames,
	getDateDeltas,
	parseTime,
	fillInMissing,
	getUserTimes,
	getUserIds,
	generateLeaderboard,
	getLeaderboardOverview,
};
