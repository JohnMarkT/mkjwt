#!/usr/bin/env node
/*jshint node:true, esversion:6 */
const program = require('commander');
const ncp = require('copy-paste');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const pkgjson = require('./package.json');

const version = pkgjson.version.replace("+", " - ");

program
  .version(version)
  .description(pkgjson.description)
  .usage('[options]')
  .option('-p, --payload [file]', 'JSON file containing payload', 'payload.json')
  .option('-s, --secret <string>', 'Secret string with single quotes', 'secret')
  .option('-e, --expires [30d]', 'Expiration for token', '30d')
  .option('-c, --copy', 'Copy JWT to system clipboard')
  .option('-v, --verbose', 'Show details')
  .parse(process.argv);

const jwtOptions = {
        "algorithm": "HS256",
        "expiresIn": program.expires
    };

fs.readFile(program.payload, 'utf8', (err, data) => {
    if (err) {
        if (err.code === 'ENOENT') {
            handleError(`${program.payload} not found`);
        }
        handleError(err);
    }
    const payload = safeParse(data);
    if (!payload) {
        handleError("Please provide a valid JSON file for the payload");
    }
    createJWT(payload);
});

function createJWT(payload) {
    jwt.sign(payload, program.secret, jwtOptions, (err, token) => {
        if (err) {
            handleError(err);
        }
        
        if (program.verbose) {
            console.log("SECRET:", program.secret);
            console.log("PAYLOAD:", JSON.stringify(payload, null, 4));
            const exp = jwt.decode(token).exp;
            if (exp) {
                console.log("EXPIRES:", new Date(exp * 1000));
            }
            console.log("JWT:", token);
        } else {
            console.log(token);
        }

        if (program.copy) {
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