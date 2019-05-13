declare module "serverless-aws-static-file-handler" {
  import { APIGatewayEvent, Context, APIGatewayProxyResult } from 'aws-lambda';

  class StaticFileHandler {
    constructor(clientFilesPath: string, customErrorPagePath?: string);

    public static getMimeType(filePath: string): string;
    public static isBinaryType(mimeType: string): string;

    public get(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult>;
  }

  export = StaticFileHandler;
}
