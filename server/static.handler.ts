import { APIGatewayProxyHandler } from 'aws-lambda';
import StaticFileHandler from 'serverless-aws-static-file-handler';

const assetsPath = './static/assets';
const assetsFileHandler = new StaticFileHandler(assetsPath, '404.html');
const staticPath = './static';
const staticFileHandler = new StaticFileHandler(staticPath, 'index.html');

export const serveStatic: APIGatewayProxyHandler = async (event, context) => {
  console.log('Static serve:', event.path);
  if (event.path === '/') {
    event.path = '/index.html';
  }

  if (event.path.indexOf('/assets') === 0) {
    console.log('Looks like a thing', assetsPath, JSON.stringify(event, null, '  '));

    // TODO do proper error if not found
    return assetsFileHandler.get(event, context);
  } else {
    const result = await staticFileHandler.get(event, context);
    if (result.statusCode !== 404) {
      return result;
    } else {
      event.path = '/index.html';
      return staticFileHandler.get(event, context);
    }
  }
};
