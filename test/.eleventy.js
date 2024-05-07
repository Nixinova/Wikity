const wikity = require('../dist/index.js')

module.exports = function (eleventyConfig) {
    const rootFolder = 'src';
    const options = { eleventy: true };
    eleventyConfig.addPlugin(() => wikity.compile(rootFolder, options));
    eleventyConfig.addPassthroughCopy({ [`${rootFolder}/images/`]: 'wiki/images' });
}
