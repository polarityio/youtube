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
function doLookup(entities, options, cb) {
  Logger.debug({ entities: entities }, 'doLookup');
  let lookupResults = [];

  //authenticate request
  jwtClient.authorize(function (err, tokens) {
    if (err) {
      Logger.error({ err: err }, 'Failed to authorize client');
      return cb({
        detail: 'Failed to authenticate with Youtube',
        err: err
      });
    }

    async.each(
      entities,
      async (entity, done) => {
        try {
          const youtube = google.youtube({ version: 'v3', auth: jwtClient });
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
        } catch (searchErr) {
          done({
            detail: 'Search failed',
            err: err
          });
        }
      },
      (err) => {
        if (err) {
          Logger.error(err, 'Error');
        }
        cb(err, lookupResults);
      }
    );
  });
}

function getSearchOptions(entity, options) {
  return {
    part: 'id,snippet',
    maxResults: 30,
    type: 'video',
    q: `${entity.value}`
  };
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
