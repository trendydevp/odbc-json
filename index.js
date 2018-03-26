const isInteger = require('lodash/isInteger');
const isNumber = require('lodash/isNumber');
const isUndefined = require('lodash/isUndefined');
const fromPairs = require('lodash/fromPairs');

const Pool = require('odbc').Pool;
const dbPool = new Pool();

const cn = 'dsn=connectordb';

const http = require('http');
const url = require('url');
const port = 3000;

const isQueryPage = url => url.pathname === '/json';
const hasQueryParam = url => url.query.query && String(url.query.query).trim().length > 0;
const hasQueryTypeParam = url => url.query.types && String(url.query.types).trim().length > 0;
const hasQueryNameParam = url => url.query.names && String(url.query.names).trim().length > 0;
const parseURL = request => url.parse(request.url, true);

const requestHandler = (request, response) => {
  try {
    const pageDetails = parseURL(request);

    if (!isQueryPage(pageDetails)) {
      throw new Error(404);
    }

    if (!hasQueryParam(pageDetails)) {
      throw new Error(400);
    }

    const requestItemTypes = hasQueryTypeParam(pageDetails) ? fromPairs(pageDetails.query.types.split(',').map(item => item.split(':'))) : {};
    const requestItemNames = hasQueryNameParam(pageDetails) ? fromPairs(pageDetails.query.names.split(',').map(item => item.split(':'))) : {};

    dbPool.open(cn, function(error, db) {
      if (error) {
        response.writeHead(
          500, {
            'Content-Type': 'text/plain'
          }
        );

        response.write('500 DB');
        response.end();
        return;
      }

      db.query(pageDetails.query.query, function(error, data) {
        if (error) {
          response.writeHead(
            500, {
              'Content-Type': 'text/plain'
            }
          );

          response.write('500 Query');
          response.end();
          return;
        }

        // dbPool.close(() => {});
        if (data.length === 0) {
          response.end('{}');
        }

        const firstRow = data[0];
        let columns = [];

        for (item in firstRow) {
          let type = 'string';

          if (!isUndefined(requestItemTypes[item])) {
            type = requestItemTypes[item];
          } else if (item === 'year') {
            type = 'year';
          } else if (isInteger(firstRow[item])) {
            type = 'integer';
          } else if (isNumber(firstRow[item])) {
            type = 'number';
          }

          columns.push({
            name: item,
            type: type,
            friendly_name: !isUndefined(requestItemNames[item]) ? requestItemNames[item] : item
          });
        }

        response.end(JSON.stringify({
          columns: columns,
          rows: data
        }));
      });
    });
  } catch (error) {
    const message = error.message;

    response.writeHead(
      Number(message) ? message : 404, {
        'Content-Type': 'text/plain'
      }
    );

    response.write(String(Number(message) ? message : 404));
    response.end();
  }
}

const server = http.createServer(requestHandler);

server.listen(port, (error) => {
  if (error) {
    return console.error('Server could not start', err);
  }

  console.log(`Server is listening on ${port}`);
})
