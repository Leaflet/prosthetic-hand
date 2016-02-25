

var gobble = require('gobble');


var src = gobble('src');


var rolledUpSrc = src.transform('rollup', {
	entry: 'Hand.js',
	dest: 'prosthetic-hand.js',
	format: 'cjs',
	sourceMap: true,
	plugins: [
		require('rollup-plugin-babel')()	// See also .babelrc
	]
});

var doc = src.transform('leafdoc', {
	templateDir: 'node_modules/gobble-leafdoc/node_modules/leafdoc/templates/basic',
	files: [
		'**/*'
	],
	output: 'api-docs.html',
	leadingCharacter: '🖑'
});


module.exports = gobble([rolledUpSrc, doc]);
