const shell = require('shelljs')
const fs = require('fs')

function createPackageJson() {
    const fromPkg = JSON.parse(fs.readFileSync('package.json'))
    const toPkg = { ...fromPkg }

    delete toPkg['devDependencies']
    delete toPkg['scripts']
    toPkg['main'] = 'cjs/index.js'
    toPkg['module'] = 'es/index.js'

    return JSON.stringify(toPkg, null, 4)
}

async function main() {
    shell.rm('-rf', 'dist')
    shell.mkdir('dist')
    shell.cp('-rf', './build/cjs', './build/es', 'dist/')
    fs.writeFileSync('dist/package.json', createPackageJson())
    shell.cp('-rf', 'README.md', 'dist/')
}

main()
