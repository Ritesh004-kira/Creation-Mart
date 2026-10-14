import tsParser from '@typescript-eslint/parser';
import hooks from 'eslint-plugin-react-hooks';
const config=[
  {ignores:['.next/**','node_modules/**','work/**','.design-reference/**','supabase/functions/**','next-env.d.ts']},
  {files:['**/*.ts','**/*.tsx'],languageOptions:{parser:tsParser,parserOptions:{ecmaVersion:'latest',sourceType:'module',ecmaFeatures:{jsx:true}}},
    plugins:{'react-hooks':hooks},rules:{'react-hooks/rules-of-hooks':'error','react-hooks/exhaustive-deps':'warn'}},
];
export default config;
