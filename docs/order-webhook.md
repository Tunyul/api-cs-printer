Order completed webhook

This project can POST a webhook when an order becomes `status: 'selesai'`.

Configuration

- ORDER_STATUS_WEBHOOK_URL (optional) - if set, this URL will be used for order-completed webhooks. If not set, INVOICE_WEBHOOK_URL will be used.
- ORDER_WEBHOOK_USER / ORDER_WEBHOOK_PASS (optional) - Basic Auth credentials for the webhook. If not set, INVOICE_WEBHOOK_USER / INVOICE_WEBHOOK_PASS will be used.

Payload

Minimal JSON body posted to webhook:

{
  "phone": "6288806301215",
  "invoice_link": "Hai... pesanan anda sudah selesai dibuat, silahkan ambil TRX-..."
}

Behavior

- The webhook call is non-blocking; failures are logged to `server.log` but do not block the main flow.
- The code attempts to derive phone from order.id_customer -> Customer.no_hp.

How to use with n8n

- Set ORDER_STATUS_WEBHOOK_URL to your n8n webhook endpoint (e.g., https://<n8n-host>/webhook/<id>).
- If you require Basic Auth, set ORDER_WEBHOOK_USER and ORDER_WEBHOOK_PASS (or use INVOICE_WEBHOOK_* env vars).
- In n8n, create a Webhook node to accept POST JSON and map `phone` and `invoice_link` to downstream nodes (WhatsApp/SMS).

Example n8n mapping: use the Webhook output field `{{$json["phone"]}}` and `{{$json["invoice_link"]}}`.
