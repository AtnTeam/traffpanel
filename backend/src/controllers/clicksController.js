import { fetchAllClicksData } from '../services/apiService.js';
import { getLatestRecord, groupBySource } from '../utils/dateUtils.js';
import { upsertClick, getClickBySource, getAllClicks } from '../models/clickModel.js';

export const processClicksData = async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ 
        error: 'Parameters from and to are required' 
      });
    }

    console.log(`Fetching data from ${from} to ${to}...`);
    
    const apiResponse = await fetchAllClicksData(from, to);
    
    console.log(`Received ${apiResponse.rows.length} records from API`);
    
    const groupedBySource = groupBySource(apiResponse.rows);
    
    let updatedCount = 0;
    let insertedCount = 0;
    
    for (const [source, records] of Object.entries(groupedBySource)) {
      const latestRecord = getLatestRecord(records);
      
      if (latestRecord) {
        const existedBefore = await getClickBySource(latestRecord.source);
        const result = await upsertClick(
          latestRecord.source,
          latestRecord.sub_id_2,
          latestRecord.country_flag,
          latestRecord.datetime
        );
        
        if (result.wasUpdated) {
          if (existedBefore) {
            updatedCount++;
          } else {
            insertedCount++;
          }
        }
      }
    }

    console.log(`Processed: ${insertedCount} inserted, ${updatedCount} updated`);

    res.json({
      success: true,
      message: `Processed ${apiResponse.rows.length} records`,
      stats: {
        totalFromAPI: apiResponse.total,
        processed: apiResponse.rows.length,
        inserted: insertedCount,
        updated: updatedCount,
        sourcesProcessed: Object.keys(groupedBySource).length
      }
    });
  } catch (error) {
    console.error('Error processing clicks data:', error);
    res.status(500).json({ 
      error: 'Error processing data',
      details: error.message 
    });
  }
};

export const getAllClicksData = async (req, res) => {
  try {
    const clicks = await getAllClicks();
    res.json({
      success: true,
      data: clicks,
      count: clicks.length
    });
  } catch (error) {
    console.error('Error fetching clicks data:', error);
    res.status(500).json({ 
      error: 'Error fetching data',
      details: error.message 
    });
  }
};

