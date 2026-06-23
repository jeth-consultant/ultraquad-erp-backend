/* eslint-disable @typescript-eslint/no-var-requires */
exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE members
      ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','suspended'));

    UPDATE members SET status = 'approved';

    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('payment_received','fine_created','daily_push_reminder','admin_broadcast','account_approved','account_rejected'));
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
    ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
      CHECK (type IN ('payment_received','fine_created','daily_push_reminder','admin_broadcast'));

    ALTER TABLE members DROP COLUMN IF EXISTS status;
  `);
};
