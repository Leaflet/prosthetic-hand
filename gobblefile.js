

var gobble = require('gobble');


var src = gobble('src');

var rolledUpSrc = src.transform('rollup', {
	entry: 'Hand.js',
	dest: 'prosthetic-hand.js',
// 	format: 'cjs',
	format: 'umd',
	moduleName: 'Hand',
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

var demos = gobble('demos').moveTo('demos');


module.exports = gobble([rolledUpSrc, doc, demos]);
