import getDb from '../config/database.js';

export const getClickBySource = async (source) => {
  const db = getDb();
  const query = 'SELECT * FROM clicks_mapping WHERE source = ?';
  const result = await db.get(query, [source]);
  return result || null;
};

export const upsertClick = async (source, subId2, countryFlag, datetime) => {
  const db = getDb();
  // First, check if record exists and compare datetime
  const existing = await getClickBySource(source);
  
  if (existing) {
    const existingDateTime = new Date(existing.datetime);
    const newDateTime = new Date(datetime);
    
    // Only update if new datetime is later
    if (newDateTime > existingDateTime) {
      const updateQuery = `
        UPDATE clicks_mapping 
        SET sub_id_2 = ?, country_flag = ?, datetime = ?, updated_at = CURRENT_TIMESTAMP
        WHERE source = ?
      `;
      await db.run(updateQuery, [subId2, countryFlag, datetime, source]);
      
      // Get updated record
      const updated = await getClickBySource(source);
      return { ...updated, wasUpdated: true };
    } else {
      return { ...existing, wasUpdated: false };
    }
  } else {
    // Insert new record
    const insertQuery = `
      INSERT INTO clicks_mapping (source, sub_id_2, country_flag, datetime, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `;
    await db.run(insertQuery, [source, subId2, countryFlag, datetime]);
    
    // Get inserted record
    const inserted = await getClickBySource(source);
    return { ...inserted, wasUpdated: true };
  }
};

export const getAllClicks = async () => {
  const db = getDb();
  const query = 'SELECT * FROM clicks_mapping ORDER BY source ASC';
  const result = await db.all(query);
  return result;
};

