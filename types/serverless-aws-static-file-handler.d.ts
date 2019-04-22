import { APIGatewayEvent } from 'aws-lambda';

declare module "serverless-aws-static-file-handler" {
  import { APIGatewayEventRequestContext, APIGatewayProxyResult } from 'aws-lambda';

  export class StaticFileHandler {
    constructor(clientFilesPath: string, customErrorPagePath?: string);

    public static getMimeType(filePath: string): string;
    public static isBinaryType(mimeType: string): string;

    public get(event: APIGatewayEvent, context: APIGatewayEventRequestContext): Promise<APIGatewayProxyResult>;
  }
}
