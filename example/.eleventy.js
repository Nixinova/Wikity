const wikity = require('wikity');

module.exports = function (eleventyConfig) {
    const wikityOptions = {
        eleventy: true,
        templatesFolder: 'templates',
        imagesFolder: 'images',
        outputFolder: 'wikity-out/',
    };
    const wikityPlugin = () => wikity.compile('src', wikityOptions);
    eleventyConfig.addPlugin(wikityPlugin);
    eleventyConfig.addPassthroughCopy({ 'src/images': 'wiki/images' });
}
