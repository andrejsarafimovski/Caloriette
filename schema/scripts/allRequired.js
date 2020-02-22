const fs = require('fs');
const path = require('path');
const schemaFile = process.argv[2];
let schema, schemaJSON, props;

console.log('schema file', schemaFile);
try {
  schema = fs.readFileSync(path.join(__dirname, '../../', schemaFile)).toString();
} catch (e) {
  console.error('[ERROR] Invalid Schema location specified', e.message);
  process.exit(-1);
}

try {
  schemaJSON = JSON.parse(schema);
} catch (e) {
  console.error('[ERROR] Invalid schema format(not json)')
  process.exit(-1);
}

try {
  props = Object.keys(schemaJSON.properties)
} catch (e) {
  console.error('[ERROR] No Schema.properties in the provided JSON');
  process.exit(-1);
}

schemaJSON.required = props;

fs.writeFileSync(schemaFile, JSON.stringify(schemaJSON, null, 2).slice());

console.log('[SUCCESS] Schema forced all required');