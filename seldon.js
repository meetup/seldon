const fse = require('fs-extra');
const path = require('path');

const colors = require('colors');
const frontmatter = require('frontmatter');
const marked = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');

marked.setOptions({
	gfm: true,
	breaks: false,
	tables: true
});


var DocumentView = {}; // view for hbs templates
var templates = {};    // hbs template files


function addBlock(block) {
	var catKey = _.camelCase(block.category);

	if ( catKey == "" ) return;

	if ( !DocumentView[catKey] ) {
		DocumentView[catKey]  = {
			title: block.category,
			blocks: []
		}
	}

	console.log("Adding component: ".yellow, block.title);
	DocumentView[catKey].blocks.push(block);
}

// returns a new component description string
// with `html_example` code blocks replaced
// inline with rendered/escaped output
function renderHtmlExamples(blockDescription) {
	return new String(
		blockDescription.replace(/```html_example\n(.|\n)*?\n```/g, function(match) {
			var example = _.trim(match.replace(/```html_example/, '').replace(/```/, '')),
				template = hbs.compile(templates.example);

			return template({
				html: example
			});
		})
	);
}

function parseDocComment(comment) {
	var cleanComment = _.trim(comment.replace(/\/\*doc/, '').replace(/\*\//, ''));
		C = frontmatter(cleanComment),
		block = {};

	if ( !C.data ) {
		return;
	}
	
	block["name"] = C.data.name;
	block["title"] = C.data.title;
	block["category"] = C.data.category;
	block["description"] = marked( renderHtmlExamples(C.content) );

	addBlock(block);
}

function handleFile(file) {
	console.log("\nFILE: ".magenta, file);
	var content = fse.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

	if ( comments ) {
		comments.forEach(parseDocComment);
	} else {
		console.warn("No documentation comments found.".italic);
	}
}

function parseFiles( src, dest ) {
	var files = [],
		template = hbs.compile(templates.layout);

	fse.walk( src )
		.on('data', function(file) {
			if ( fse.statSync(file.path).isFile() ) {
				files.push(file.path)
			}
		})
		.on('end', function() {
			files.forEach(handleFile);

			var doc = new Buffer(template({
				categoryObj: DocumentView
			}));

			fse.writeFile(dest + 'doc.html', doc, function(err) {
				if(err) {
					return console.log(err);
				}
				console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.rainbow);
				console.log("BUILD IS SUCCESS OK GOOD JOB NICE".cyan);
				console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n'.rainbow);
			});
		})
}

function compile(configPath) {

	//
	// Pass the path to your `config.json` file to compile documentation
	//
	var config = fse.readFileSync( configPath, "utf8" );

	if ( config ) {
		var C = JSON.parse(config);

		// if the destination dir doesn't exist, create it
		fse.ensureDirSync(C.destination);

		// load hbs templates into global `templates` obj
		templates.layout = fse.readFileSync(C.templates.layout, "utf8");
		templates.example = fse.readFileSync(C.templates.example, "utf8");

		// read all files & populate DocumentView
		parseFiles( C.source, C.destination );

		// if a static assets dir has been specified,
		// copy that dir to the build destination
		if ( C.assets ) {
			try {
				fse.copySync( C.assets, C.destination );
			} catch (err) {
				console.error('\nCould not copy static assets dir to ' + C.destination + "\n" + err.message + "\n")
			}
		}
	}
}

//Run from command line.
if (process.argv[2]) {
	compile(process.argv[2]);
}


module.exports = {
	compile: compile
}

