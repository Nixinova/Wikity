const wikity = require('../dist/index.js')

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ 'images/': 'wiki/images' });
    eleventyConfig.addPlugin(() => wikity.eleventyPlugin());
}
