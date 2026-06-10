/* eslint-disable @typescript-eslint/naming-convention, camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE members (
      id              SERIAL PRIMARY KEY,
      member_code     VARCHAR(12) UNIQUE NOT NULL,
      name            VARCHAR(120) NOT NULL,
      phone           VARCHAR(15) UNIQUE NOT NULL,
      email           VARCHAR(160) UNIQUE,
      password_hash   VARCHAR(60) NOT NULL,
      github_username VARCHAR(100),
      role            VARCHAR(10) NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin')),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_members_phone ON members(phone);
    CREATE INDEX idx_members_github ON members(github_username);

    CREATE TABLE refresh_tokens (
      id          SERIAL PRIMARY KEY,
      member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      token_hash  VARCHAR(64) NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      revoked_at  TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_refresh_member ON refresh_tokens(member_id);

    CREATE TABLE contributions (
      id            SERIAL PRIMARY KEY,
      member_id     INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
      amount        NUMERIC(10,2) NOT NULL CHECK (amount > 0),
      mpesa_receipt VARCHAR(20) UNIQUE NOT NULL,
      paid_at       TIMESTAMPTZ NOT NULL,
      period_month  CHAR(7) NOT NULL
    );
    CREATE INDEX idx_contrib_member_period ON contributions(member_id, period_month);

    CREATE TABLE fines (
      id              SERIAL PRIMARY KEY,
      member_id       INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
      reason          VARCHAR(20) NOT NULL CHECK (reason IN ('missed_push','manual')),
      amount          NUMERIC(10,2) NOT NULL CHECK (amount > 0),
      date_incurred   DATE NOT NULL,
      status          VARCHAR(10) NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid','waived')),
      paid_with_receipt VARCHAR(20),
      created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_fines_member_status ON fines(member_id, status);

    CREATE TABLE push_days (
      id            SERIAL PRIMARY KEY,
      member_id     INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      date          DATE NOT NULL,
      commits_count INTEGER NOT NULL DEFAULT 0,
      satisfied     BOOLEAN NOT NULL DEFAULT FALSE,
      UNIQUE (member_id, date)
    );
    CREATE INDEX idx_pushdays_member_date ON push_days(member_id, date);

    CREATE TABLE notifications (
      id          SERIAL PRIMARY KEY,
      member_id   INTEGER REFERENCES members(id) ON DELETE CASCADE,
      title       VARCHAR(120) NOT NULL,
      body        TEXT NOT NULL,
      type        VARCHAR(30) NOT NULL CHECK (type IN
                    ('payment_received','fine_created','daily_push_reminder','admin_broadcast')),
      sent_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_notifications_member ON notifications(member_id);

    CREATE TABLE device_tokens (
      id          SERIAL PRIMARY KEY,
      member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      token       VARCHAR(255) UNIQUE NOT NULL,
      platform    VARCHAR(10) NOT NULL CHECK (platform IN ('android','ios')),
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    CREATE TABLE app_config (
      id                          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
      paybill_number              VARCHAR(10) NOT NULL,
      account_prefix              VARCHAR(10) NOT NULL DEFAULT 'UQ-',
      monthly_contribution_amount NUMERIC(10,2) NOT NULL,
      fine_per_missed_day         NUMERIC(10,2) NOT NULL,
      required_push_weekdays      INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}',
      grace_hours                 INTEGER NOT NULL DEFAULT 2
    );

    CREATE TABLE stk_push_requests (
      id                  SERIAL PRIMARY KEY,
      member_id           INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
      amount              NUMERIC(10,2) NOT NULL CHECK (amount > 0),
      phone               VARCHAR(15) NOT NULL,
      account_reference   VARCHAR(20) NOT NULL,
      merchant_request_id VARCHAR(50) NOT NULL,
      checkout_request_id VARCHAR(50) UNIQUE NOT NULL,
      status              VARCHAR(12) NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','success','failed','cancelled')),
      result_code         INTEGER,
      result_desc         VARCHAR(255),
      mpesa_receipt       VARCHAR(20),
      created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
      resolved_at         TIMESTAMPTZ
    );
    CREATE INDEX idx_stk_member ON stk_push_requests(member_id);
    CREATE INDEX idx_stk_status ON stk_push_requests(status);

    CREATE TABLE mpesa_callbacks (
      id              SERIAL PRIMARY KEY,
      trans_id        VARCHAR(20) UNIQUE NOT NULL,
      raw_payload     JSONB NOT NULL,
      hmac_signature  VARCHAR(64) NOT NULL,
      processed       BOOLEAN NOT NULL DEFAULT FALSE,
      member_id       INTEGER REFERENCES members(id),
      received_at     TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_callbacks_processed ON mpesa_callbacks(processed);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS mpesa_callbacks;
    DROP TABLE IF EXISTS stk_push_requests;
    DROP TABLE IF EXISTS app_config;
    DROP TABLE IF EXISTS device_tokens;
    DROP TABLE IF EXISTS notifications;
    DROP TABLE IF EXISTS push_days;
    DROP TABLE IF EXISTS fines;
    DROP TABLE IF EXISTS contributions;
    DROP TABLE IF EXISTS refresh_tokens;
    DROP TABLE IF EXISTS members;
  `);
};
