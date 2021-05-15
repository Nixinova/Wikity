const wikity = require('../src/index.js')

module.exports = function (eleventyConfig) {
    eleventyConfig.addPassthroughCopy({ 'images/': 'wiki/images' });
    eleventyConfig.addPlugin(() => wikity.eleventyPlugin());
}
