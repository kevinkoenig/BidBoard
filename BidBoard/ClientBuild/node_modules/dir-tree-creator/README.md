dir-tree-creator
================

[![npm](https://img.shields.io/npm/v/dir-tree-creator.svg?style=flat-square)](https://www.npmjs.com/package/dir-tree-creator)
[![Build Status](https://travis-ci.org/manidlou/dir-tree-creator.svg?branch=master)](https://travis-ci.org/manidlou/dir-tree-creator)

<a href="https://github.com/feross/standard" style="float: right; padding: 0 0 20px 20px;"><img src="https://cdn.rawgit.com/feross/standard/master/sticker.svg" alt="Standard JavaScript" width="100" align="right"></a>

`dir-tree-creator` is a [Node.js](https://nodejs.org) module that creates an npm like directory tree structure of the given root path and returns the string representation of it.

Install
-------

`npm i dir-tree-creator`

Usage
-----

**dirtree(dir[, opts], cb)**

- `dir` `<String>` root directory path
- `opts` `<Object>` *(optional)* object with the following properties:
  - `label` `<String>` label for the root node of the directory tree; if nothing specified, the root path's basename will be used.
  - `hidden` `<Boolean>` determines if hidden files should be included; set to false to ignore hidden files; defaults to true.
- `cb` `<Function>`
  - `err` `<Error | null>`
  - `dirtree` `<String>` string representation of the directory structure

Example
-------

```js
const dirTree = require('dir-tree-creator')

dirTree('some/dir', (err, tr) => {
  if (err) return console.error(err)
  console.log(tr)
})
```

```js
const dirTree = require('dir-tree-creator')

dirTree('some/dir', { label: 'custom label' }, (err, tr) => {
  if (err) return console.error(err)
  console.log(tr)
})
```

Sample output
-------------

```
custom label
├─┬ dir0
│ └── file0.js  
├─┬ dir1
│ ├─┬ dir2  
│ │ └── file2.js  
│ └── file1.md
├── file-under-root.js
└── .gitignore  
```
