const dayjs = require("dayjs");

function dateKeyFromDate(date = new Date()) {
  return dayjs(date).format("YYYY-MM-DD");
}

function monthKeyFromDate(date = new Date()) {
  return dayjs(date).format("YYYY-MM");
}

function startOfMonth(date = new Date()) {
  return dayjs(date).startOf("month").toDate();
}

function endOfMonth(date = new Date()) {
  return dayjs(date).endOf("month").toDate();
}

module.exports = { dateKeyFromDate, monthKeyFromDate, startOfMonth, endOfMonth };

