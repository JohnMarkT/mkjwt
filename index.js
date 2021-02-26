#!/usr/bin/env node
/*jshint node:true, esversion:6 */
const { program } = require('commander');
const ncp = require('copy-paste');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const { version, description } = require('./package.json');

program
  .version(version.replace("+", " - "))
  .description(description)
  .usage('[options]')
  .option('-p, --payload <file>', 'JSON file containing payload', 'payload.json')
  .option('-s, --secret <string>', 'Secret string with single quotes', 'secret')
  .option('-e, --expires [30d]', 'Expiration for token', '30d')
  .option('-c, --copy', 'Copy JWT to system clipboard')
  .option('-v, --verbose', 'Show details')
  .parse(process.argv);

const { payload: file, secret, expires, copy, verbose } = program.opts();
const jwtOptions = {
        algorithm: "HS256",
        expiresIn: expires
    };

console.log('payload file:', file)

fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
        if (err.code === 'ENOENT') {
            handleError(`${file} not found`);
        }
        handleError(err);
    }
    const payload = safeParse(data);
    if (!payload) {
        handleError("Please provide a valid JSON file for the payload");
    }
    // delete expiration and issued properties from payload
    Reflect.deleteProperty(payload, 'exp');
    Reflect.deleteProperty(payload, 'iat');

    createJWT(payload);
});

function createJWT(payload) {
    jwt.sign(payload, secret, jwtOptions, (err, token) => {
        if (err) {
            handleError(err);
        }
        
        if (verbose) {
            console.log("SECRET: %s", secret);
            console.log("PAYLOAD: %o", payload);
            const exp = jwt.decode(token).exp;
            if (exp) {
                console.log("EXPIRES: %s", new Date(exp * 1000));
            }
            console.log("JWT: %s", token);
        } else {
            console.log(token);
        }

        if (copy) {
            ncp.copy(token);
        }
        process.exit(0);
    });
}

function handleError(...msgs) {
    msgs.forEach(msg => console.error(msg));
    program.help();
}

function safeParse(content){
  try {
    return JSON.parse(content);
  } catch(ex){
    return '';
  }
}