import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Don't wait for empty event loop
  context.callbackWaitsForEmptyEventLoop = false;

  // Log the full event for debugging
  console.log('🔍 DEBUG EVENT:', JSON.stringify(event, null, 2));
  console.log('🔍 DEBUG CONTEXT:', JSON.stringify({
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    invokedFunctionArn: context.invokedFunctionArn,
    awsRequestId: context.awsRequestId,
    logGroupName: context.logGroupName,
    logStreamName: context.logStreamName,
  }, null, 2));

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Return full event details for debugging
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Debug endpoint',
      event: {
        path: event.path,
        resource: event.resource,
        httpMethod: event.httpMethod,
        pathParameters: event.pathParameters || {},
        queryStringParameters: event.queryStringParameters || {},
        headers: event.headers,
        requestContext: event.requestContext,
        // HTTP API specific properties
        routeKey: (event as any).routeKey,
        rawPath: (event as any).rawPath,
        version: (event as any).version,
        routeSelectionExpression: (event as any).routeSelectionExpression,
        // Try to capture all properties
        allEventProperties: Object.keys(event)
      },
      context: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        awsRequestId: context.awsRequestId,
        memoryLimitInMB: context.memoryLimitInMB,
        logGroupName: context.logGroupName,
        logStreamName: context.logStreamName,
      },
      timestamp: new Date().toISOString(),
    }, null, 2)
  };
};