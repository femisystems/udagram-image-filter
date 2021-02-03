import { NextFunction, Response, Request } from "express";
import { TIMEOUT, UNAUTHORIZED, BAD_REQUEST } from './response-codes';
import jwt from 'jsonwebtoken';

const reqTimeout = Number(process.env.REQUEST_TIMEOUT || 5000);

export const timeoutMiddleware = (_: Request, res: Response, next: NextFunction) => {
  res.setTimeout(reqTimeout, () => {
    res.status(TIMEOUT).send({
      error: 'Request timed out',
      details: `Request could have timed out due to poorly formatted url or image filtering taking longer than is required.`
    });
  });
  next();
};

// authorization middleware
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  const { authorization, key } = req.headers;
  try {
    const decodedToken: Record<string, any> = (jwt.verify(authorization.split(' ')[1], process.env.SECRET) as object);
    return decodedToken.key.toString() === key ?
      next() :
      res.status(UNAUTHORIZED).send({ error: 'Token and key mismatch ' });
  } catch (e) {
    res.status(BAD_REQUEST).send({ error: 'Unable to verify user. Be sure your auth token is not expired' })
  }
};