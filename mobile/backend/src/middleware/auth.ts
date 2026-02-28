import { auth } from 'express-oauth2-jwt-bearer';
import { RequestHandler } from 'express';
import dotenv from 'dotenv';
dotenv.config({ override: true });

const audience = process.env.AUTH0_AUDIENCE;
const domain = process.env.AUTH0_DOMAIN;

// Allow local demo mode when Auth0 is not configured.
if (!audience || !domain) {
  console.warn("Auth0 env missing. Running API auth middleware in demo-bypass mode.");
}

const bypassAuth: RequestHandler = (_req, _res, next) => next();

export const checkJwt: RequestHandler =
  audience && domain
    ? auth({
        audience,
        issuerBaseURL: `https://${domain}`,
      })
    : bypassAuth;
