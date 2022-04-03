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
	var errors = [];
	var renderedJobs = '';

	jobList.forEach(function(job) {
		if (!('Job Name' in job)) {
			return;
		}
		if (job['Job Name'].length === 0) {
			return;
		}

		for (var key in required) {
			if (!(key in job) || (job[key].length === 0)) {
				errors.push(`<li>job: "${job['Committee']}" "${job['Job Name']}" is missing required field: ${required[key]}</li>`);
			}
		}

		renderedJobs += renderJob(job);
	});

	var errorMsg = '';
	if (errors.length) {
		errorMsg += errors.reduce(function(html, entry) {
			return `${html}${entry}`;
		});

		errorMsg = `<section class="errors">
			<h1>Errors</h1>
			<ol>${errorMsg}</ol>
		</section>`;
	}
	document.body.innerHTML = errorMsg + renderedJobs;

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
		<p class="supplies">Supplies: ${job['Supplies Needed']} Location: ${job['Where will the supplies be for the job on the work day?']}</p>
	</div>

	<div class="lower">
		<div class="lower_left">
			<div>honcho: ${job['Honcho (leader who gives direction/provides supplies for project)']}</div>
			<div># workers: ${job['Number of workers: if Honcho is working this job then include them in this count.']}</div>
			<div>time: ${job['How long will it take per worker?']}</div>
		</div>

		<div class="lower_right">
			<div>priority: ${job['Priority - Indicate: Low, Medium, or High']}</div>
			<div>work day: ${job['Which work day: Sunday April 24, or Saturday May 14, or Flexible']}</div>
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
	console.log(header);
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

