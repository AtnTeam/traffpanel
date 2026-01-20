import getDb from '../config/database.js';

/**
 * Get setting value by key
 * @param {string} key - Setting key
 * @returns {Promise<string|null>} Setting value or null if not found
 */
export const getSetting = async (key) => {
  const db = getDb();
  const query = 'SELECT setting_value FROM user_settings WHERE setting_key = ?';
  const result = await db.get(query, [key]);
  return result ? result.setting_value : null;
};

/**
 * Set setting value by key (upsert)
 * @param {string} key - Setting key
 * @param {string} value - Setting value
 * @returns {Promise<Object>} Updated or created setting
 */
export const setSetting = async (key, value) => {
  const db = getDb();
  
  // Check if setting exists
  const existing = await getSetting(key);
  
  if (existing !== null) {
    // Update existing setting
    const updateQuery = `
      UPDATE user_settings 
      SET setting_value = ?, updated_at = CURRENT_TIMESTAMP
      WHERE setting_key = ?
    `;
    await db.run(updateQuery, [value, key]);
  } else {
    // Insert new setting
    const insertQuery = `
      INSERT INTO user_settings (setting_key, setting_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `;
    await db.run(insertQuery, [key, value]);
  }
  
  return {
    key,
    value,
    updated_at: new Date().toISOString()
  };
};

/**
 * Get all settings
 * @returns {Promise<Object>} Object with all settings as key-value pairs
 */
export const getAllSettings = async () => {
  const db = getDb();
  const query = 'SELECT setting_key, setting_value FROM user_settings';
  const results = await db.all(query);
  
  const settings = {};
  results.forEach(row => {
    settings[row.setting_key] = row.setting_value;
  });
  
  return settings;
};

/**
 * Delete setting by key
 * @param {string} key - Setting key
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
export const deleteSetting = async (key) => {
  const db = getDb();
  const result = await db.run('DELETE FROM user_settings WHERE setting_key = ?', [key]);
  return result.changes > 0;
};

