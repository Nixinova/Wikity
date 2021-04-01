const wikity = require('../src/index.js')

module.exports = function (eleventyConfig) {
    eleventyConfig.addPlugin(() => wikity.eleventyPlugin());
}
