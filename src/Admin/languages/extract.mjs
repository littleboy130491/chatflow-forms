import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
const root = process.argv[2];
const messages = new Set();
for (const directory of ['assets/src/builder', 'assets/src/submissions', 'assets/src/blocks']) {
  for (const name of fs.readdirSync(path.join(root, directory)).filter((name) => /\.tsx?$/.test(name))) {
    const file = path.join(root, directory, name);
    const ast = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    function walk(node) {
      if (
        ts.isCallExpression(node) &&
        ts.isIdentifier(node.expression) &&
        node.expression.text === '__' &&
        node.arguments[0] &&
        ts.isStringLiteral(node.arguments[0])
      )
        messages.add(node.arguments[0].text);
      ts.forEachChild(node, walk);
    }
    walk(ast);
  }
}
for (const file of ['src/Admin/AdminModule.php','src/Integrations/Elementor/FormWidget.php','src/Rest/TemplatesController.php','src/Templates/Starter.php','src/Analytics/Report.php'])
  for (const match of fs.readFileSync(path.join(root,file), 'utf8').matchAll(/(?:__|esc_html__)\(\s*'((?:[^'\\]|\\.)*)'\s*,\s*'chatflow-forms'/g))
    messages.add(match[1].replace(/\\'/g, "'"));
console.log(JSON.stringify([...messages].sort()));
