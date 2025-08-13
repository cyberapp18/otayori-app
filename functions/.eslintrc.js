module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    "quotes": ["error", "double"],
    "max-len": ["off"],
    "no-unused-vars": ["error", { argsIgnorePattern: "^_|Type" }],
    "comma-dangle": ["error", "always-multiline"],
    "indent": ["error", 2],
    "object-curly-spacing": ["error", "always"],
  },
  parserOptions: {
    ecmaVersion: 2020,
  },
};
