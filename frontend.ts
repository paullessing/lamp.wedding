import { pathExists, readFile, stat } from 'fs-extra';
import { APIGatewayProxyHandler } from 'aws-lambda';
import path from 'path';
import { lookup } from 'mime-types';
// @ts-ignore
import StaticFileHandler from 'serverless-aws-static-file-handler';

export const serveStatic: APIGatewayProxyHandler = async (event, _context) => {
  const requestedFilePath = path.join('./static', event.path);

  const filePath = (await pathExists(requestedFilePath)) && (await stat(requestedFilePath)).isFile() ? requestedFilePath : './static/index.html';

  console.log(event.path, requestedFilePath, filePath);

  if (event.path.indexOf('/assets') === 0) {
    const clientFilesPath = path.join(__dirname, './static');
    console.log('Looks like a thing', JSON.stringify(event, null, '  '));
    const response = await new StaticFileHandler(clientFilesPath).get(event, _context);
    console.log('r1', response);
    return {
      statusCode: 200,
      headers: { 'Content-Type': StaticFileHandler.getMimeType(event.path) },
      body: response.toString(),
      isBase64Encoded: true,
    };
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
