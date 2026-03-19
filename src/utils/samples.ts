export const SAMPLES: Record<string, { label: string; old: string; new: string; format: string }> = {
  json: {
    label: 'JSON Schema',
    format: 'JSON Schema',
    old: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Order",
  "type": "object",
  "required": ["order_id", "customer_id", "amount", "status"],
  "properties": {
    "order_id": { "type": "string" },
    "customer_id": { "type": "integer" },
    "amount": { "type": "number" },
    "currency": { "type": "string", "default": "USD" },
    "status": {
      "type": "string",
      "enum": ["pending", "processing", "shipped", "delivered"]
    },
    "created_at": { "type": "string", "format": "date-time" },
    "metadata": { "type": "object" }
  }
}`,
    new: `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Order",
  "type": "object",
  "required": ["order_id", "customer_id", "amount", "status", "region"],
  "properties": {
    "order_id": { "type": "integer" },
    "customer_id": { "type": "integer" },
    "amount": { "type": "string" },
    "status": {
      "type": "string",
      "enum": ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"]
    },
    "region": { "type": "string" },
    "created_at": { "type": "string", "format": "date" },
    "updated_at": { "type": "string", "format": "date-time" }
  }
}`
  },
  avro: {
    label: 'Avro Schema',
    format: 'Apache Avro',
    old: `{
  "type": "record",
  "name": "UserEvent",
  "namespace": "com.company.events",
  "fields": [
    { "name": "user_id", "type": "string" },
    { "name": "event_type", "type": "string" },
    { "name": "timestamp", "type": "long", "logicalType": "timestamp-millis" },
    { "name": "session_id", "type": ["null", "string"], "default": null },
    { "name": "properties", "type": { "type": "map", "values": "string" } },
    { "name": "platform", "type": { "type": "enum", "name": "Platform", "symbols": ["WEB", "IOS", "ANDROID"] } }
  ]
}`,
    new: `{
  "type": "record",
  "name": "UserEvent",
  "namespace": "com.company.analytics",
  "fields": [
    { "name": "user_id", "type": "long" },
    { "name": "event_type", "type": "string" },
    { "name": "timestamp", "type": "long", "logicalType": "timestamp-millis" },
    { "name": "properties", "type": { "type": "map", "values": "string" } },
    { "name": "platform", "type": { "type": "enum", "name": "Platform", "symbols": ["WEB", "IOS", "ANDROID", "TV", "WATCH"] } },
    { "name": "geo_country", "type": "string" }
  ]
}`
  },
  sql: {
    label: 'SQL DDL',
    format: 'SQL DDL',
    old: `CREATE TABLE transactions (
    transaction_id  VARCHAR(36)    NOT NULL,
    account_id      INTEGER        NOT NULL,
    amount          DECIMAL(10,2)  NOT NULL,
    currency        CHAR(3)        NOT NULL DEFAULT 'USD',
    txn_type        VARCHAR(20)    NOT NULL,
    status          VARCHAR(10)    NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    description     TEXT,
    reference_id    VARCHAR(100),
    PRIMARY KEY (transaction_id)
);`,
    new: `CREATE TABLE transactions (
    transaction_id  BIGINT         NOT NULL,
    account_id      INTEGER        NOT NULL,
    amount          VARCHAR(20)    NOT NULL,
    txn_type        VARCHAR(20)    NOT NULL,
    status          VARCHAR(20)    NOT NULL DEFAULT 'pending',
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW(),
    processed_at    TIMESTAMP,
    description     VARCHAR(500),
    merchant_id     INTEGER        NOT NULL,
    PRIMARY KEY (transaction_id)
);`
  }
};
