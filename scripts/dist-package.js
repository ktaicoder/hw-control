const shell = require('shelljs')

async function main() {
    shell.rm('-rf', 'dist')
    shell.mkdir('dist')
    shell.cp('-rf', './build/cjs', 'dist/')
    shell.cp('-rf', 'package-dist.json', 'dist/package.json')
    // shell.cp('-rf', '.npmrc', 'dist/.npmrc')
}

main()
