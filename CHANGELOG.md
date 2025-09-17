# Changelog

## [1.0.0] - 2025-09-17
### Added
- Initial release of api-cs-printer
- Authentication (login/register)
- CRUD for Customer, Product, Order, Payment, Piutang
- Swagger API documentation
- Database migration and seeder scripts
- Middleware for authentication
- Logging and audit

## [1.3.0] - 2025-09-18
### Changed
- Bumped package version to 1.3.0

### Fixed
- Fixed malformed Swagger JSDoc YAML in `src/routes/bot.js` that caused YAML parsing errors on startup.

### Added
- New BOT API: DELETE `/api/bot/order?no_hp=...` to delete pending order(s) by customer phone; transactionally deletes related order details and payments.

