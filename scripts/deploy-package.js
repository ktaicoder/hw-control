const shell = require('shelljs')

function timestamp() {
    const now = new Date()
    const pad = (n) => (n < 10 ? '0' + n : n.toString())
    const ymd = [now.getFullYear(), now.getMonth() + 1, now.getDay()].map(pad).join('')
    const hms = [now.getHours(), now.getMinutes() + 1, now.getSeconds()].map(pad).join('')

    return ymd + '_' + hms
}

function exec(cmd) {
    shell.echo(cmd)
    shell.exec(cmd)
}

async function main() {
    shell.rm('-rf', 'tmp')
    shell.mkdir('tmp')
    shell.pushd('tmp')
    shell.exec('git clone -b release https://github.com/ktaicoder/hw-control.git')
    shell.cd('hw-control')
    exec('git rm -rf cjs')
    shell.cp('-rf', '../../dist/*', '.')
    exec('git add cjs package*')
    exec(`git commit -m 'release-${timestamp()}'`)
    exec('git push')
    shell.popd()
    shell.echo('remove tmp directory')
    shell.rm('-rf', 'tmp')
}

main()
