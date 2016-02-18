const fs = require('fs');
const path = require('path');

const frontmatter = require('frontmatter');
const marked = require('marked');
const hbs = require('handlebars');
const _ = require('lodash');
const recursive = require('recursive-readdir');

const FILE_TEST = '../sq2/sass/ui-components/_tabs.scss';
const DIR_SRC = '../sq2/sass/';
const DIR_TARGET = './'

const TEMPL_EXAMPLE = fs.readFileSync('templates/example.hbs', "utf8");
const TEMPL_DOC = fs.readFileSync('templates/index.hbs', "utf8");

marked.setOptions({
	gfm: true,
	breaks: true,
	tables: true
})


var DocumentView = {};


function addBlock(block) {
	var catKey = _.camelCase(block.category);

	if ( !DocumentView[catKey] ) {
		DocumentView[catKey]  = {
			title: block.category,
			blocks: []
		}
	}

	DocumentView[catKey].blocks.push(block);
}

// returns a new component description string
// with `html_example` code blocks replaced
// inline with rendered/escaped output
function renderHtmlExamples(blockDescription) {
	return new String(
		blockDescription.replace(/```html_example\n(.|\n)*?\n```/g, function(match) {
			var example = _.trim(match.replace(/```html_example/, '').replace(/```/, '')),
				template = hbs.compile(TEMPL_EXAMPLE);

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
	console.log("READING FILE: ", file);
	var content = fs.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

	if ( comments ) {
		comments.forEach(parseDocComment);
	}
}

recursive(DIR_SRC, [], function(err, files) {
	var template = hbs.compile(TEMPL_DOC);
	files.forEach(handleFile);

	var doc = new Buffer(template({
		categoryObj: DocumentView
	}));

	fs.writeFile(DIR_TARGET+'doc.html', doc, function(err) {
		if(err) {
			return console.log(err);
		}
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
		console.log("BUILD IS SUCCESS WOW OK GOOD JOB NICE");
		console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
	});
});
