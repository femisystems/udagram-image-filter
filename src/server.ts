import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import jwt from 'jsonwebtoken';
import { BAD_REQUEST, OK } from './response-codes';
import { timeoutMiddleware, verifyToken } from './middleware';
import dotenv from 'dotenv';

dotenv.config();

// https://image.shutterstock.com/image-photo/glodok-jakarta-indonesia-dec-6-600w-1869727789.jpg
(async () => {
  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  const secret = process.env.SECRET || 'S3CR3T';
  const reqTimeout = Number((process.env.REQUEST_TIMEOUT || 5000));
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Add a timeout to request
  app.use(timeoutMiddleware);

  // generate token
  app.post('/auth', async(req: Request, res: Response) => {
    const { key } = req.body;
    if (!key) return res.status(BAD_REQUEST).send({ error: 'Bad request. Please enter your "key" in the request body '});

    const authToken = jwt.sign({ key }, secret, { expiresIn: '24h' });
    res.status(OK).send({
      Authorization: `Bearer ${authToken}`,
      instruction: 'Add your Authorization and Key in the request header when passing your image url'
    });
  });

  // @TODO1 IMPLEMENT A RESTFUL ENDPOINT
  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  // IT SHOULD
  //    1
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]
  app.get('/filteredimage', verifyToken, async( req, res ) => {
    try {
      const validUrl = new URL(req.query.image_url);
      const filteredImage = await filterImageFromURL(validUrl.toString());
      res.status(OK).sendFile(filteredImage);
      setTimeout(() => deleteLocalFiles([filteredImage]), 0);
    } catch (e) {
      return res.status(OK).send({ 'message': 'invalid url' });
    }
  });

  /**************************************************************************** */

  //! END @TODO1
  
  // Root Endpoint
  // Displays a simple message to the user
  app.get( "/", async ( req, res ) => {
    res.send("try GET /filteredimage?image_url={{}}")
  } );

  // Start the Server
  app.listen( port, () => {
      console.log( `server running http://localhost:${ port }` );
      console.log( `press CTRL+C to stop server` );
  } );
})();