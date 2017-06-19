module.exports = ctx => ({
    plugins: [
        require('postcss-nesting')(),
        require('../lib')({
            debugMode: true,
            cssModulesMode: true
        })
    ]
});
