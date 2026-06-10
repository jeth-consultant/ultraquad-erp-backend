/* eslint-disable @typescript-eslint/no-var-requires */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE password_reset_otps (
      id          SERIAL PRIMARY KEY,
      member_id   INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
      otp_hash    VARCHAR(64) NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      used_at     TIMESTAMPTZ,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    CREATE INDEX idx_password_reset_otps_member ON password_reset_otps(member_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS password_reset_otps;
  `);
};
