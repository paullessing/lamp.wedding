const angularCli = require('@angular/cli').default;
const fs = require('fs-extra');
const path = require('path');
// const stringify = require('flatted/cjs').stringify;

class BuildAngularPlugin {

  constructor(data) {
    const angular = data.options.angular;
    this.deploy = !!angular;
    this.build = angular === 'build';
  }

  apply(compiler) {
    if (this.deploy) {
      compiler.hooks.emit.tapPromise('Build Angular', (compilation) => this.onEmit(compilation));
    }
  }

  async onEmit(compilation) {

    if (this.build) {
      const argArray = 'build --aot --prod'.split(/\s+/g);
      await angularCli({
        cliArgs: argArray,
        inputStream: process.stdin,
        outputStream: process.stdout
      });
    }

    const files = await this.generateFileList(path.join(__dirname, 'dist', 'frontend'), 'static', '');

    // console.log('File list =====');
    // console.log(files.join('\n'));
    // console.log('======');

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
