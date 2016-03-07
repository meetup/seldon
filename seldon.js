const fs = require('fs');
const path = require('path');

const colors = require('colors');
const frontmatter = require('frontmatter');
const marked = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');
const recursive = require('recursive-readdir');

marked.setOptions({
	gfm: true,
	breaks: false,
	tables: true
})


var DocumentView = {}; // view for hbs templates
var templates = {};    // hbs template files


function addBlock(block) {
	var catKey = _.camelCase(block.category);

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
	var content = fs.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

	if ( comments ) {
		comments.forEach(parseDocComment);
	} else {
		console.warn("No documentation comments found.".italic);
	}
}

function parseFiles( src, dest ) {
	recursive(src, [], function(err, files) {
		var template = hbs.compile(templates.layout);
		files.forEach(handleFile);

		var doc = new Buffer(template({
			categoryObj: DocumentView
		}));

		fs.writeFile(dest + 'doc.html', doc, function(err) {
			if(err) {
				return console.log(err);
			}
			console.log('\n~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~'.rainbow);
			console.log("BUILD IS SUCCESS OK GOOD JOB NICE".cyan);
			console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n\n'.rainbow);
		});
	});
}


module.exports = {

	//
	// Pass the path to your `config.json` file to compile documentation
	//
	compile: function( configPath ) {
		var config = fs.readFileSync( configPath, "utf8" );

		if ( config ) {
			var C = JSON.parse(config);

			templates.layout = fs.readFileSync(C.templates.layout, "utf8");
			templates.example = fs.readFileSync(C.templates.example, "utf8");

			parseFiles( C.source, C.destination );
		}
	}
}
