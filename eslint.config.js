module.exports = [ {
    languageOptions: {
        ecmaVersion: 2021,
        sourceType: 'module',
        parserOptions: {
            ecmaFeatures: {
                jsx: true
            }
        }
    },
    rules: {
        'max-len': 'off',
        'semi': [ 'error', 'always' ],
        'no-underscore-dangle': 'off',
        'class-methods-use-this': 'off',
        'no-param-reassign': 'off',
        'no-restricted-syntax': 'warn',
        'no-continue': 'warn',
        'consistent-return': 'warn',
        'guard-for-in': 'warn',
        'import/no-commonjs': 'off',
        'import/no-dynamic-require': 'off',
        'new-cap': 'warn',
        'no-nested-ternary': 'off',
        'prefer-const': 'error',
        'newline-before-return': [ 'error', 'always' ],
        'quotes': [ 'error', 'single' ],
        'no-multiple-empty-lines': [ 'error', { max: 1 } ],
        'space-before-function-paren': [ 'error', 'always' ],
        'func-call-spacing': [ 'error', 'always' ],
        'block-spacing': [ 'error', 'always' ],
        'space-in-parens': [ 'error', 'always' ],
        'object-curly-spacing': [ 'error', 'always' ],
        'no-spaced-func': 'off',
        'space-unary-ops': [ 'error', { 'words': true, 'nonwords': false, 'overrides': { 'new': false, '++': false } } ],
        'arrow-spacing': [ 'error', { 'before': true, 'after': true } ],
        'indent': [ 'error', 4, { 'SwitchCase': 1 } ],
        'key-spacing': [ 'error', { 'beforeColon': false, 'afterColon': true } ],
        'computed-property-spacing': [ 'error', 'always' ],
        'array-bracket-spacing': [ 'error', 'never' ],
        'comma-spacing': [ 'error', { 'before': false, 'after': true } ],
        'brace-style': [ 'error', 'stroustrup' ],
        'space-infix-ops': 'error',
        'keyword-spacing': [ 'error', { overrides: {
            if: { after: true },
            for: { after: true },
            while: { after: true }
        } } ],
        'array-bracket-spacing': [ 'error', 'always' ],
    },
} ];
