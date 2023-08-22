module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  settings: {
    "import/extensions": [".ts", ".tsx"],
    "import/ignore": ["node_modules", "\\.(css|scss|json)$"],
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:import/typescript",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
  },
  plugins: ["@typescript-eslint", "import", "sort-imports-es6-autofix"],
  ignorePatterns: ["*/bridge/src/*.ts"],
  rules: {
    "@typescript-eslint/no-var-requires": 0,
    "@typescript-eslint/no-empty-interface": "off",
    "space-in-parens": ["error", "never"],
    "no-extra-semi": "error",
    "no-const-assign": "error",
    "no-fallthrough": "error",
    "no-trailing-spaces": "warn",
    "no-unreachable": "error",
    "object-curly-spacing": ["error", "always"],
    semi: "error",
    "valid-typeof": "error",
    "no-duplicate-imports": "error",
    eqeqeq: "error",
    "space-before-function-paren": ["error", { anonymous: "always", named: "never", asyncArrow: "always" }],
    "no-cond-assign": "error",
    "comma-style": ["warn", "last"],
    "sort-imports": [
      "error",
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: true,
        memberSyntaxSortOrder: ["none", "all", "single", "multiple"],
      },
    ],
    "no-console": [
      "warn",
      {
        allow: ["error", "warn"],
      },
    ],
    "comma-spacing": [
      "warn",
      {
        before: false,
        after: true,
      },
    ],
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/ban-types": [
      "error",
      {
        extendDefaults: true,
        types: {
          "{}": false,
        },
      },
    ],
    "import/first": "error",
    "import/newline-after-import": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["webpack/**", "**/*.stories.tsx"],
      },
    ],
    "import/no-webpack-loader-syntax": "error",
    "import/order": [
      "error",
      {
        "newlines-between": "never",
        pathGroups: [
          {
            pattern: "@src/**",
            group: "internal",
            position: "after",
          },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
      },
    ],
  },
};
