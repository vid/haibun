
export const WEBSERVER = 'webserver';
export const WEBSERVER_STEPPER = 'WebServerStepper';
export const CHECK_LISTENER = 'CHECK_LISTENER';
import * as express from 'express';

export interface IWebServer {
  addStaticFolder(subdir: string): Promise<string | undefined>;
  addKnownStaticFolder(subdir: string, mountAt?: string): Promise<string | undefined>;
  listen(port: number): Promise<IWebServer>;
  addRoute(type: TRouteType, path: string, route: TRequestHandler): void;
}

export type TRouteType = 'get';

export type IRequest = typeof express.request;

export type IResponse = typeof express.response;

export type TRequestHandler = (req: IRequest, res: IResponse) => void;
