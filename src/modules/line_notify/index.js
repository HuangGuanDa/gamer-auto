// src/modules/line_notify/index.ts
const fetch = require("node-fetch");
const DEFAULT_CONFIG = {
  title: "執行報告 $time$",
  description: "\u767C\u9001 Line Notify \u901A\u77E5",
};
exports.run = async ({ shared, params, logger }) => {
  if (!shared.report) {
    logger.error("\u8ACB\u8A2D\u5B9A report \u6A21\u7D44");
    return;
  }
  if (!params.token) {
    logger.error("\u8ACB\u8A2D\u5B9A Line Notify Token (token)");
    return;
  }
  if ((await shared.report.text()).length == 0) {
    logger.log("\u6C92\u6709\u5831\u544A\u5167\u5BB9");
    return;
  }
  const msg = await shared.report.markdown();
  const response = await fetch("https://notify-api.line.me/api/notify", {
    method: "POST",
    headers: { Authorization: `Bearer ${params.token}` },
    body: new URLSearchParams({ message: `${shared.report.title}
${msg}` })
  }).then((res) => res.json());
  if (response.status === 200) {
    logger.success("\u5DF2\u767C\u9001 Line Notify");
  } else {
    logger.error("\u767C\u9001 Line Notify \u5931\u6557\uFF01", response, msg);
  }
};

function time() {
  const date = new Date().toLocaleString("en", { timeZone: "Asia/Taipei" }).split(", ");
  let [month, day, year] = date[0].split("/");
  let [hour, minute, second] = date[1].match(/\d{1,2}/g);

  if (+hour === 12 && date[1].toLowerCase().includes("am")) hour = String(+hour - 12);
  if (+hour < 12 && date[1].toLowerCase().includes("pm")) hour = String(+hour + 12);
  return [year, month, day, hour, minute, second];
}

