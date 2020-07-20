'use strict'
const path = require('path')
const archy = require('archy')
const klaw = require('klaw')

function addNode (tree, par, node) {
  if (par === tree.label) {
    tree.nodes.push({
      label: node,
      nodes: []
    })
  } else {
    tree.nodes.forEach(n => {
      if (typeof n === 'object' && n.label === par) {
        n.nodes.push({
          label: node,
          nodes: []
        })
      } else if (typeof n === 'object' && n.label !== par) {
        addNode(n, par, node)
      }
    })
  }
}

function dirTree (root, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  opts.label = opts.label || path.basename(root)
  opts.hidden = typeof opts.hidden !== 'undefined' ? opts.hidden : true

  const paths = []
  const filterFunc = item => {
    if (!opts.hidden) {
      const basename = path.basename(item)
      return basename === '.' || basename[0] !== '.'
    } else {
      return true
    }
  }

  klaw(root, { filter: filterFunc }).on('error', er => cb(er)).on('data', i => paths.push(i.path))
    .on('end', () => {
      const tree = {
        label: opts.label,
        nodes: []
      }
      for (var i = 0; i < paths.length; i += 1) {
        const p = paths[i]
        const par = path.dirname(p)
        if (par === root) {
          addNode(tree, opts.label, path.basename(p))
        } else {
          addNode(tree, path.basename(par), path.basename(p))
        }
      }
      return cb(null, archy(tree).trim())
    })
}

module.exports = dirTree
