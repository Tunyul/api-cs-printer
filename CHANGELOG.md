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


## [1.3.3] - 2025-09-20
### Added
- Real-time notifications via Socket.IO for payments and invoice events (emitPaymentEvent).
- Invoice webhook sender with retry and basic auth support (sendInvoiceWebhook).
- Exposed helpers for scripts/tests: `syncPaymentEffects` and `ensurePiutangForCustomer` in `src/controllers/paymentController.js`.
- Migration added for invoice tokens: `src/migrations/20250920-create-invoice-tokens.js`.

### Fixed
- Improved payment allocation to `piutang` (FIFO) and status updates.
- Consistent handling of `bukti` / `bukti_pembayaran` fields across endpoints.


## [1.3.4] - 2025-09-21
### Changed
- Disable customer-targeted realtime and persisted notifications; notifications now delivered only to admin role (security/operational decision).

### Added
- Smoke test script: `scripts/smoke_test_notif.js` for bot flows (create customer, order, payment) with 3s delay between steps.

### Maintenance
- Truncated existing notifications table to remove customer notifications (one-off maintenance).


## [2.0.1] - 2025-09-21
### Changed
- Bumped package version to 2.0.1 and prepared release.

### Maintenance
- Minor packaging and version metadata updates.


## [2.0.3] - 2025-09-28
### Added
- Piutang API responses now include associated `Order` rows so clients receive order metadata alongside piutang entries (e.g., `id_order`, `no_transaksi`, `tanggal_order`, `total_bayar`, `status`).

### Changed
- Updated controller `src/controllers/piutangController.js` to include `Order` in `find` queries for `getAllPiutangs`, `getPiutangById`, `createPiutang`, `updatePiutang`, `getPiutangsByCustomerId`, and `getOverduePiutangs`.
## [2.0.4] - 2025-09-28
### Changed
- Updated invoice template to display a green "Lunas" badge when an order is fully paid and regenerated PDFs accordingly.
### Maintenance
- Bumped package version to 2.0.4 and applied minor documentation updates.


