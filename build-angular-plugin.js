const angularCli = require('@angular/cli').default;
const fs = require('fs-extra');
const path = require('path');

class BuildAngularPlugin {
  constructor(data) {
    // TODO determine when to call this
    // console.log(data.options);
    // for (const x in data.options) {
    //   console.log(x);
    // }
    // throw new Error('xx');
  }

  apply(compiler) {
    compiler.hooks.emit.tapPromise('Build Angular', (compilation) => this.onEmit(compilation));
  }

  async onEmit(compilation) {
    const argArray = 'build --aot --prod'.split(/\s+/g);

    // TODO enable or disable this
    await angularCli({
      cliArgs: argArray,
      inputStream: process.stdin,
      outputStream: process.stdout
    });

    const files = await this.generateFileList(path.join(__dirname, 'dist', 'frontend'), 'static', '');

    console.log('File list =====');
    console.log(files.join('\n'));
    console.log('======');

    files.forEach(({ path, source }) => {
      compilation.assets[path] = {
        source: () => source,
        size: () => source.length
      }
    });
  }

  async generateFileList(sourcePrefix, targetPrefix, currentDir, allFiles = []) {
    for (const file of await fs.readdir(path.join(sourcePrefix, currentDir))) {
      if (file.indexOf('.') === 0) {
        continue;
      }
      const relativePath = path.join(currentDir, file);
      const fullPath = path.join(sourcePrefix, relativePath);
      const targetPath = path.join(targetPrefix, relativePath);
      const stat = await fs.stat(fullPath);
      if (stat.isFile()) {
        allFiles.push({
          path: targetPath,
          source: await fs.readFile(fullPath)
        });
      } else if (stat.isDirectory()) {
        await this.generateFileList(sourcePrefix, targetPrefix, relativePath, allFiles);
      }
    }

    return allFiles;
  }
}

module.exports = BuildAngularPlugin;
