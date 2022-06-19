# packr

Helper utility for publishing [npm](https://www.npmjs.com) packages

## cli options

Option | Parameter | Description
--- | --- | ---
-o, --output | path | The output path where packr will copy files
--major | number | The major version number for this package
--minor | number | The minor version number for this package
--revision | number | The revision number for this package

---

## package.json options

```json
  "packr": {
    "output": "output",
    "properties": [
      "name",
      "version",
      "description",
      "main",
      "types",
      "homepage",
      "repository",
      "bugs",
      "author",
      "license",
      "dependencies",
      "type",
      "bin"
    ],
    "include": ["dist", "README.md", "LICENSE", "yarn.lock"]
  }
```

Value | Type | Description |
--- | --- | ---
output | `string` | The output path where packr will copy files
properties | `string[]` | The *package.json* properties to copy to the *output/package.json*
include | `stringp[]` | The files to copy to the output path. Values can be a glob