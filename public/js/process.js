/**
 * A set of javascript utilities for parsing CSV and generating a series of
 * Kanban cards for the Great Oak workday.
 *
 * Directions to follow each season:
 * 1. update the URL
 * 2. update the whichWorkDay variable with the new header name
 * 3. push it live, and check the results
 */

// 
var url = 'https://docs.google.com/spreadsheets/d/1uxs0P2CMhz4cOMPSHReiZ4gdN5tBAGxUJ4_-JEukzqQ/';
var googleDocSuffix = 'export?format=csv&gid=0';
url += googleDocSuffix;


// XXX change each season
var whichWorkDay = 'Which work day Sunday 10/20 or Saturday 10/26 or Flexible';

var required = {
	"Name of person supplying Info": "Reporter",
	"Committee": "Committee",
	"Job Name": "Job Name",
	"Job Description": "Description",
	"Supplies Needed": "Supplies Needed",
	"Priority - Indicate: Low, Medium, or High": "priority",
	"Honcho (leader who gives direction/provides supplies for project)": "Honcho",
	"Where will the supplies be for the job on the work day?": "Supply Location",
	"Number of workers: if Honcho is working this job then include them in this count.": "# workers",
	"How long will it take per worker?": "time",
};
required[whichWorkDay] = "work day";



/**
 * Render the array of objects into HTML.
 */
var render = function(jobList) {
	var errorsByJob = [];
	var renderedJobs = '';
	var committees = {};
	var committeeLinks = [];
	var committeeNav = [];
	var errorMsg = '';
	var filtered = decodeURI(window.location.search.replace('?filter=', ''));
	var clearFilter = '';

	// collect errors, rendered, and list of committees for nav
	jobList.forEach(function(job) {
		if (!('Job Name' in job)) {
			console.log('missing "Job Name" - cannot render anything without a job name');
			return;
		}
		if (job['Job Name'].length === 0) {
			return;
		}

		// initialize the dict entry?
		if (!committees[job['Committee']]) {
			committees[job['Committee']] = 0;
		}
		committees[job['Committee']]++;

		// skip if job does not match filter
		if (filtered && (filtered !== job['Committee'])) {
			return;
		}

		// errors
		var errors = [];
		for (var key in required) {
			// if empty
			if (!(key in job) || (job[key].length === 0)) {
				console.log('missing:', {"key": key, "job": job, "jobkey": job[key]});
				errors.push(required[key]);
			}
		}

		if (errors.length) {
			var msg = errors.join(' & ');
			errorsByJob.push(`<li>job: "${job['Committee']}" "${job['Job Name']}" is missing: [${msg}]</li>`);
		}

		renderedJobs += renderJob(job);
	});

	// if errors exist, render them
	if (errorsByJob.length) {
		errorMsg += errorsByJob.reduce(function(prev, entry) {
			return `${prev}${entry}`;
		});

		errorMsg = `<section id="errors" class="no_print">
			<h1>Errors</h1>
			<a href="#" id="hide_errors">Close</a>
			<ol>${errorMsg}</ol>
		</section>`;
	}

	// generate a nav list for filtering
	Object.keys(committees).forEach(function(entry) {
		var count = committees[entry];
		committeeLinks.push(`<a href="?filter=${entry}">${entry} (${count})</a>`);
	});

	if (committeeLinks.length) {
		if (filtered) {
			clearFilter = `<a href="${window.location.origin}${window.location.pathname}">Show all</a>`;
		}

		committeeNav = `<p class="no_print">
			${committeeLinks.join(' ')}
			${clearFilter}
		</p>`;
	}
	document.body.innerHTML = errorMsg + committeeNav + renderedJobs;

};

/**
 * Render the html for a single job entry
 */
var renderJob = function(job) {
	return `
<section>
	<div class="main">
		<h1>${job['Committee']}</h1>
		<h2>${job['Job Name']}</h2>
		<p class="desc">${job['Job Description']}</p>
		<p class="supplies">Supplies: ${job['Supplies Needed']} <span class="more">Location: ${job['Where will the supplies be for the job on the work day?']}</span></p>
	</div>

	<div class="lower">
		<div class="lower_left">
			<div>Honcho: ${job['Honcho (leader who gives direction/provides supplies for project)']}</div>
			<div># Workers: ${job['Number of workers: if Honcho is working this job then include them in this count.']}</div>
			<div>Time: ${job['How long will it take per worker?']}</div>
		</div>

		<div class="lower_right">
			<div>Priority: ${job['Priority - Indicate: Low, Medium, or High']}</div>
			<div>Work day: ${job[whichWorkDay]}</div>
		</div>
	</div>
</section>`;
};

/**
 * Evaluate the CSV and parse it into an array of objects.
 */
var evaluate = function(data) {
	var parsed = parse(data),
		header = parsed.shift(),
		jobList = [],
		missing = [],
		index = 0;

	// trim whitespace
	header = header.map(s => s.trim());

	// confirm that the required keys appear in the header - quit if not
	for (var entry in required) {
		index = header.findIndex((element) => element === entry);
		if (index === -1) {
			missing.push(entry);
		}
	};
	if (missing.length) {
		document.body.innerHTML = "<h1>Unable to find the required headers</h1>" + missing.join('<br>');
		console.log({missing, parsed, header, url});
		return;
	}

	// go through the content lines
	parsed.forEach(function(jobEntry) {
		var merged = header.reduce((obj, key, index) =>
			({ ...obj, [key.trim()]: jobEntry[index].trim() }), {}
		);
		jobList.push(merged);
	});

	render(jobList);
};

/**
 * Get the data needed.
 */
var getData = function(url) {
	fetch(url, { redirect: 'follow' })
		.then(response => response.text())
		.then(text => evaluate(text))
};

getData(url);

/**
 * Add listener for "hide errors" link
 */
document.addEventListener('click', function (event) {
	if (!event.target.matches('#hide_errors')) {
		return;
	}
	event.preventDefault();

	var errorsDiv = document.querySelector('#errors');
	errorsDiv.parentNode.removeChild(errorsDiv);
}, false);


