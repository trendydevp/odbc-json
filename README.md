# ODBC-JSON

Launches an HTTP server which forwards SQL queries to an ODBC database and returns JSON results.

**Warning: INSECURE** To be used for testing purposed, or with additional security layer.

Two main security risks:

1. There's no sanitization layer, and can expose any data for a provided SQL query.
2. If the database access is not set to readonly, then SQL queries can overwrite data.
