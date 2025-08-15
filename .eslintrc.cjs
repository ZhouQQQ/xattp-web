/**
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  root: true,
  extends: ['@antfu', './.eslintrc-auto-import.json', '@unocss'],

  rules: {
    'curly': ['warn', 'multi-line'],
    '@typescript-eslint/semi': ['warn', 'never'],
    '@typescript-eslint/no-use-before-define': ['off'],
    'vue/no-empty-component-block': ['off'],
    'no-restricted-imports': ['warn', {
    'comma-spacing': 'off',
      paths: [{
        name: '@vueuse/core',
        importNames: ['useClipboard'],
        message: 'Please use local useCopy from src/composable/copy.ts instead of useClipboard.',
      }],
    }],
  },
};
