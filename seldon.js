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


var DocumentView = {};   // view for hbs templates
var templates = {};      // hbs template files
var childBlocks = [];    // contains block children; processed last


function addChildBlocks(blocks) {

	var attachChild = function(parent, child) {
		if ( !_.has(parent, 'children') ) parent.children = [];
		parent.children.push(child);
	}

	// look for the parent block in every category
	blocks.forEach(function(block) {
		_.forOwn(DocumentView, function(category) {

			category.blocks.forEach(function(categoryBlock) {
				if ( block.parent == categoryBlock.name ) {
					attachChild(categoryBlock, block);
				}
			});

		});
	});
};

function addBlock(block) {
	var catKey = _.camelCase(block.category);

	if ( catKey == "" ) return;

	// create the category if it doesn't already exist
	if ( !DocumentView[catKey] ) {
		DocumentView[catKey]  = {
			title: block.category,
			name: catKey,
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
				template = hbs.compile(templates.example);

			return template({
				html: example
			});
		})
	);
}

function parseDocComment(comment, file) {
	var cleanComment = _.trim(comment.replace(/\/\*doc/, '').replace(/\*\//, ''));
		C = frontmatter(cleanComment),
		block = {};

	if ( !C.data ) {
		console.error('\nERROR: no data found in frontmatter. Make sure all comments have a description in addition to frontmatter.'.red)
		console.log("\n\t@ ".red, file);
		return;
	}
	
	block["name"] = C.data.name;
	block["title"] = C.data.title;
	block["category"] = C.data.category;
	block["parent"] = C.data.parent;
	block["description"] = marked( renderHtmlExamples(C.content) );

	if ( !block.category && block.parent ) {
		childBlocks.push(block); // this block belongs to another block
	} else if ( block.category ) {
		addBlock(block); // this is a category-level block
	}
}

function handleFile(file) {
	var content = fse.readFileSync(file, "utf8"),
		comments = content.match(/\/\*doc\n(.|\n)*?\n\*\//g);

	if ( comments ) {
		comments.forEach(parseDocComment, file);
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
			addChildBlocks(childBlocks);

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
			C.assets.forEach(function(assetDir) {
				try {
					fse.copySync( assetDir, C.destination );
				} catch (err) {
					console.error('\nCould not copy static assets dir to ' + C.destination + "\n" + err.message + "\n")
				}
			})
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

