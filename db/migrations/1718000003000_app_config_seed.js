/* eslint-disable @typescript-eslint/no-var-requires */
exports.shorthands = undefined;

// Seeds the singleton app_config row with placeholder values so the API is
// functional out of the box. An admin should update these (paybill number,
// contribution/fine amounts) with real values once known.
exports.up = (pgm) => {
  pgm.sql(`
    INSERT INTO app_config (id, paybill_number, account_prefix, monthly_contribution_amount, fine_per_missed_day)
    VALUES (1, '174379', 'UQ-', 500.00, 100.00)
    ON CONFLICT (id) DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM app_config WHERE id = 1;
  `);
};
