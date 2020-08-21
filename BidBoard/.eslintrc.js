    module.exports = {
    rules: {
        "indent": ["error", 4, { "SwitchCase": 1 }],
        "semi": ["error", "always"],
        "quotes": ["error", "double", { "avoidEscape": true }],
        "one-var": ["off"],
        "no-use-before-define": ["off"],
        "spaced-comment": ["off"]
    },

    globals: {
        "NameSpace": true,
        "AttachmentControl": true,
        "kendo": true,
        "Math": true
    },

    env: {
        "jquery": true,
        "es6": true,
        "browser": true,
        "commonjs": true
    }
};
