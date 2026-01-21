import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL;
const EXTERNAL_API_KEY = process.env.EXTERNAL_API_KEY;

if (!EXTERNAL_API_URL || !EXTERNAL_API_KEY) {
  throw new Error('EXTERNAL_API_URL and EXTERNAL_API_KEY must be set in environment variables');
}

export const fetchClicksData = async (from, to, offset = 0, limit = 5000) => {
  const requestBody = {
    range: {
      from: from,
      to: to,
      timezone: "Europe/Kyiv",
      interval: ""
    },
    limit: limit.toString(),
    offset: offset.toString(),
    columns: [
      "sub_id_2",
      "source",
      "datetime",
      "country_flag"
    ],
    filters: [
      {
        name: "is_bot",
        operator: "IS_FALSE",
        expression: "null"
      },
      {
        name: "sub_id_2",
        operator: "BEGINS_WITH",
        expression: "acc"
      },
      {
        name: "source",
        operator: "NOT_EQUAL",
        expression: ""
      },
      {
        name: "source",
        operator: "NOT_EQUAL",
        expression: "tiktok"
      },
      {
        name: "source",
        operator: "NOT_EQUAL",
        expression: "www.tiktok.com"
      },
      {
        name: "source",
        operator: "NOT_EQUAL",
        expression: "tiktok"
      },
      // {
      //   name: "parent_campaign_id",
      //   operator: "EQUALS",
      //   expression: "1"
      // },

    ],
    sort: [
      {
        name: "sub_id_2",
        order: "asc"
      }
    ]
  };

  try {
    const response = await fetch(EXTERNAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Api-Key': EXTERNAL_API_KEY
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching clicks data:', error);
    throw error;
  }
};

export const fetchAllClicksData = async (from, to) => {
  const allRows = [];
  let offset = 0;
  const limit = 5000;
  let total = null;
  let hasMore = true;

  while (hasMore) {
    try {
      const data = await fetchClicksData(from, to, offset, limit);
      
      if (total === null) {
        total = data.total;
      }

      if (data.rows && data.rows.length > 0) {
        allRows.push(...data.rows);
        offset += limit;
        
        if (allRows.length >= total || data.rows.length < limit) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error(`Error fetching data at offset ${offset}:`, error);
      throw error;
    }
  }

  return {
    rows: allRows,
    total: total || allRows.length
  };
};

