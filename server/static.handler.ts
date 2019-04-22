import { APIGatewayProxyHandler } from 'aws-lambda';
import StaticFileHandler from 'serverless-aws-static-file-handler';

// TODO this is specific to the assets directory. It should work differently for the other files in static
const assetsPath = './static/assets';
const assetsFileHandler = new StaticFileHandler(assetsPath);
const staticPath = './static';
const staticFileHandler = new StaticFileHandler(staticPath, 'index.html');

export const serveStatic: APIGatewayProxyHandler = async (event, context) => {
  if (event.path.indexOf('/assets') === 0) {
    console.log('Looks like a thing', assetsPath, JSON.stringify(event, null, '  '));

    // TODO do proper error if not found
    return assetsFileHandler.get(event, context);
  } else {
    return staticFileHandler.get(event, context);
  }
};
