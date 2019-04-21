import { pathExists, readdir, readFile, stat } from 'fs-extra';
import { APIGatewayProxyHandler } from 'aws-lambda';
import path from 'path';
import { lookup } from 'mime-types';
// @ts-ignore
import StaticFileHandler from 'serverless-aws-static-file-handler';

// TODO this is specific to the assets directory. It should work differently for the other files in static
const clientFilesPath = './static/assets';
const fileHandler = new StaticFileHandler(clientFilesPath);

export const serveStatic: APIGatewayProxyHandler = async (event, context) => {
  const requestedFilePath = path.join('./static', event.path);

  const filePath = (await pathExists(requestedFilePath)) && (await stat(requestedFilePath)).isFile() ? requestedFilePath : './static/index.html';

  console.log(event.path, requestedFilePath, filePath);
  console.log(await readdir(__dirname));

  if (event.path.indexOf('/assets') === 0) {
    console.log('Looks like a thing', clientFilesPath, JSON.stringify(event, null, '  '));

    return fileHandler.get(event, context)

    // return await new StaticFileHandler(clientFilesPath).get(event, _context);
    // console.log('r1', response);
    // return {
    //   statusCode: 200,
    //   headers: { 'Content-Type': StaticFileHandler.getMimeType(event.path) },
    //   body: response.toString(),
    //   isBase64Encoded: true,
    // };
  }


  const content = (await readFile(filePath));
  const encoding = event.path.indexOf('/assets') === 0 ? 'base64' : 'utf8';

  console.log('Encoding', encoding);

  const response = {
    statusCode: 200,
    headers: {
      'Content-Type': lookup(filePath),
    },
    body: content.toString(encoding),
    isBase64Encoded: encoding === 'base64',
  };

  // console.log('Response', response);
  return response;
};
