'use strict';

const { google } = require('googleapis');
const async = require('async');
const config = require('./config/config');
const privateKey = require(config.auth.key);
const DRIVE_AUTH_URL = 'https://www.googleapis.com/auth/youtube.force-ssl';

let jwtClient;
let Logger;

/**
 *
 * @param entities
 * @param options
 * @param cb
 */
async function doLookup(entities, options, cb) {
  Logger.debug({ entities: entities }, 'doLookup');
  let lookupResults = [];
  let youtube;

  //authenticate request
  try {
    await jwtClient.authorize();
    youtube = google.youtube({ version: 'v3', auth: jwtClient });
  } catch (authErr) {
    authErr = errorToPojo('Error authenticating', authErr);
    Logger.error(authErr, 'Error');
    return cb(authErr);
  }

  try {
    await async.each(entities, async (entity) => {
      const searchResults = await youtube.search.list(getSearchOptions(entity, options));
      Logger.trace({ result: searchResults }, 'Search results');
      if (!searchResults.data || !searchResults.data.items || searchResults.data.items.length === 0) {
        lookupResults.push({
          entity: entity,
          data: null
        });
      } else {
        lookupResults.push({
          entity: entity,
          data: {
            summary: [`${searchResults.data.items.length} videos`],
            details: searchResults.data.items
          }
        });
      }
    });
  } catch (searchErr) {
    searchErr = errorToPojo('Error running search', searchErr);
    Logger.error(searchErr, 'Error');
    return cb(searchErr);
  }

  cb(null, lookupResults);
}

function getSearchOptions(entity, options) {
  return {
    part: 'id,snippet',
    maxResults: 30,
    type: 'video',
    q: `${entity.value}`
  };
}

function errorToPojo(detail, err) {
  if (err instanceof Error) {
    return {
      // Pull all enumerable properties, supporting properties on custom Errors
      ...err,
      // Explicitly pull Error's non-enumerable properties
      name: err.name,
      message: err.message,
      stack: err.stack,
      detail: detail ? detail : 'Unexpected error encountered'
    };
  }
  return err;
}

function startup(logger) {
  Logger = logger;

  // configure a JWT auth client
  jwtClient = new google.auth.JWT(privateKey.client_email, null, privateKey.private_key, [DRIVE_AUTH_URL]);
}

module.exports = {
  doLookup: doLookup,
  startup: startup
};
