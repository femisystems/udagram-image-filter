import express, { NextFunction, Request, Response } from 'express';
import bodyParser from 'body-parser';
import {filterImageFromURL, deleteLocalFiles} from './util/util';
import jwt from 'jsonwebtoken';

// https://image.shutterstock.com/image-photo/glodok-jakarta-indonesia-dec-6-600w-1869727789.jpg
(async () => {

  // Init the Express application
  const app = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  
  // Use the body parser middleware for post requests
  app.use(bodyParser.json());

  // Add a timeout to request
  app.use((req, res, next) => {
    res.setTimeout(5000, () => {
      res.status(408).send({
        error: 'Request timed out',
        details: `Request could have timed out due to poorly formatted url
          or image filtering taking longer than is required.
        `
      });
    });
    next();
  });

  // generate token
  app.post('/auth', async(req, res) => {
    const { key } = req.body;
    if (!key) return res.status(500).send({ error: 'Bad request. Please enter your "key" in the request body '});

    const authToken = jwt.sign({ key }, 'SECRET', { expiresIn: '24h' });
    res.status(200).send({
      Authorization: `Bearer ${authToken}`,
      instruction: 'Add your Authorization and Key in the request header when passing your image url'
    });
  });

  // authorization middleware
  const verify = async (req: Request, res: Response, next: NextFunction) => {
    const { authorization, key } = req.headers;
    try {
      const decodedToken: Record<string, any> = (jwt.verify(authorization.split(' ')[1], 'SECRET') as object);
      console.log(decodedToken.key, key);
      return decodedToken.key.toString() === key ?
        next() :
        res.status(401).send({ error: 'Token and key mismatch '});  
    } catch(e) {
      res.status(401).send({ error: 'Unable to verify user. Be sure your auth token is not expired' })
    }
  }

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
  app.get('/filteredimage', verify, async( req, res ) => {
    try {
      const validUrl = new URL(req.query.image_url);
      const filteredImage = await filterImageFromURL(validUrl.toString());
      res.status(200).sendFile(filteredImage);
      setTimeout(() => deleteLocalFiles([filteredImage]), 0);
    } catch (e) {
      return res.status(200).send({ 'message': 'invalid url' });
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