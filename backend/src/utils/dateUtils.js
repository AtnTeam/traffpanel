export const parseDateTime = (dateTimeString) => {
  return new Date(dateTimeString);
};

export const compareDateTimes = (dateTime1, dateTime2) => {
  const date1 = parseDateTime(dateTime1);
  const date2 = parseDateTime(dateTime2);
  return date1.getTime() - date2.getTime();
};

export const getLatestRecord = (records) => {
  if (!records || records.length === 0) return null;
  
  return records.reduce((latest, current) => {
    if (!latest) return current;
    return compareDateTimes(current.datetime, latest.datetime) > 0 ? current : latest;
  }, null);
};

export const groupBySource = (records) => {
  const grouped = {};
  
  records.forEach(record => {
    const source = record.source;
    if (!grouped[source]) {
      grouped[source] = [];
    }
    grouped[source].push(record);
  });
  
  return grouped;
};

