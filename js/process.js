/**
 * A set of javascript utilities for parsing CSV and generating a series of
 * Kanban cards for the Great Oak workday.
 */

var url = 'https://docs.google.com/spreadsheets/d/15vNsL7VipkGY6FPpiNiRRNxgXt3x8-7a0J1fQaHLTfI/gviz/tq?tqx=out:csv&sheet=jobs';
var required = {
	"Committee": "Committee",
	"Job Name": "Job Name",
	"Job Description": "Description",
	"Supplies Needed": "Supplies Needed",
	"Where will the supplies be for the job on the work day?": "Supply Location",
	"Honcho (leader who gives direction/provides supplies for project)": "Honcho",
	"Number of workers: if Honcho is working this job then include them in this count.": "# workers",
	"How long will it take per worker?": "time",
	"Priority - Indicate: Low, Medium, or High": "priority",
	"Which work day: Sunday April 24, or Saturday May 14, or Flexible": "work day",
};

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
	var filtered = window.location.search.replace('?filter=', '');
	var clearFilter = '';

	// collect errors, rendered, and list of committees for nav
	jobList.forEach(function(job) {
		if (!('Job Name' in job)) {
			return;
		}
		if (job['Job Name'].length === 0) {
			return;
		}

		if (!committees[job['Committee']]) {
			committees[job['Committee']] = 0;
		}
		committees[job['Committee']]++;

		// don't render if job does not match filter
		if (filtered && (filtered !== job['Committee'])) {
			return;
		}

		// errors
		var errors = [];
		for (var key in required) {
			if (!(key in job) || (job[key].length === 0)) {
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
			<div>Work day: ${job['Which work day: Sunday April 24, or Saturday May 14, or Flexible']}</div>
		</div>
	</div>
</section>`;
};

/**
 * Evaluate the CSV and parse it into an array of objects.
 */
var evaluate = function(data) {
	var parsed = parse(data);
	var header = parsed.shift();
	var jobList = [];

	parsed.forEach(function(jobEntry) {
		var merged = header.reduce((obj, key, index) =>
			({ ...obj, [key]: jobEntry[index] }), {}
		);
		jobList.push(merged);
	});

	render(jobList);
};

/**
 * Get the data needed.
 */
var getData = function(url) {
	fetch(url)
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


