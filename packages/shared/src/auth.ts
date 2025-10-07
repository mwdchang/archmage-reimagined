import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// const TEST_TOKEN_KEY = '1ok26XPbx6pyeA9lJSM1TrPSdLIJx+2D6MpRKHq7UrGHAC4O9RXsp20n25ZnjusPvL8XEvWGK2qOtG6gH7hvmIXOcBL1z3QEfClcerwLXNRV04xb5vPtDJXYjii6qf63V39wRTjPpZ0wMXxB43Abu3DNLRCQ0sVpNVvwHeUASrgWQTGkBtos2ani3px4pS0bf8s8fcfD3nqUDXF3YbZoIdVQLYNxKXyBPWEZSizdvCUWrEjBYnTTAUaJ+yWTd5xMgPi/y+VtTGG46fRT8z8jkJnxjK0ecIDRXi2wwfejhfGE4WVAvKFtS3DyxIrevJ0YwVhce9N+x2qrZmj5L58bAw';


const TEST_TOKEN_KEY = crypto.randomBytes(256).toString('base64');

export const MAX_AGE = 4 * 60 * 60;

export const getToken = (username: string) => {
  const token = jwt.sign(
    { username },
    TEST_TOKEN_KEY,
    { expiresIn: MAX_AGE }
  );
  return token;
}

// Routes that do not need a mage/user
const whitelist = [
  '/api/register',
  '/api/login',
  '/api/logout',
  '/api/server-clock'
];

// See http://expressjs.com/en/guide/using-middleware.html
export const verifyAccessToken = (req: any, res: any, next: any) => {
  let token: string;

  if (whitelist.includes(req.path)) {
    return next();
  }

  // authenticate through Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1]
    // console.log('auth bearer token')
    // console.log({ token })
  } else {
    token = req.headers['x-access-token'];
    if (!token && req.cookies) {
      // console.log('hello', req.cookies);
      token = req.cookies['amr-jwt'] || null;
    }
    // console.log('our token is from x-access-token header, a cookie or null')
    // console.log({ token })
  }

  // if we can't get our token anywhere then the response is an error
  if (!token) {
    return res.status(403).send('A token is required for authentication');
  }
  try {
    // we use the JWT library to verify the token
    // and we need to know the token_key which we encrypted our information
    const decoded = jwt.verify(token, TEST_TOKEN_KEY);
    // console.log({ decoded })
    //the middleware adds the user information to the request and sends it to the route
    req.user = decoded;
  } catch (err) {
    return res.status(401).send('Invalid Token');
  }
  return next();
}

