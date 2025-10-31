import { Application } from 'typedoc';

// This monkey patches typedocs logger to stop listing errors
// when it can't find markdown files in relative links.
//
// I wish there was a better way to do this, but there currently
// does not seem to be. :-(

const reRelErr = /relative path (\.\/)?\w+\.md is not a file/;
export function load (app: Application) {
  const log = app.logger.log;
  app.logger.log = function (msg, level) {
    if (!reRelErr.test(msg)) {
      log.call(app.logger, msg, level);
    }
  }
}
