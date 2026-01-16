import { fetchAllClicksData } from '../services/apiService.js';
import { getLatestRecord, groupBySource } from '../utils/dateUtils.js';
import { upsertClick, getAllClicks, getClickBySource } from '../models/clickModel.js';

export const processClicksData = async (req, res) => {
  try {
    const { from, to } = req.body;

    if (!from || !to) {
      return res.status(400).json({ 
        error: 'Параметри from та to є обов\'язковими' 
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
      message: `Оброблено ${apiResponse.rows.length} записів`,
      stats: {
        totalFromAPI: apiResponse.total,
        processed: apiResponse.rows.length,
        inserted: insertedCount,
        updated: updatedCount,
        sourcesProcessed: Object.keys(groupedBySource).length
      },
      rawResponse: apiResponse
    });
  } catch (error) {
    console.error('Error processing clicks data:', error);
    res.status(500).json({ 
      error: 'Помилка обробки даних',
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
      error: 'Помилка отримання даних',
      details: error.message 
    });
  }
};

