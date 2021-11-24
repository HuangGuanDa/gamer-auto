const fetch = require("node-fetch");

exports.parameters = [
    {
        name: "tg_id",
        required: true,
    },
];

exports.run = async ({ outputs, params, logger }) => {
    const log = (...args) => logger.log("\u001b[95m[Telegram]\u001b[m", ...args);
    const error = (...args) => logger.error("\u001b[95m[Telegram]\u001b[m", ...args);
    const info = (...args) => logger.info("\u001b[95m[Telegram]\u001b[m", ...args);

    const { tg_id } = params;

    if (!outputs.report) {
        error("請設定 report 模組");
        return;
    }

    if (!tg_id) {
        error("請設定 Telegram ID (tg_id)");
        return;
    }

    const msg = (await outputs.report.markdown()).replace(/^#+([^#].*)/gm, () => `**${RegExp.$1}**`);

    const { ok } = await fetch("https://automia.jacob.workers.dev/", {
        method: "POST",
        body: JSON.stringify({
            id: tg_id,
            send: msg,
        }),
    }).then((r) => r.json());

    if (ok) {
        log("已發送 Telegram 報告！");
    } else {
        info(msg);
        error("發送 Telegram 報告失敗！");
    }
};
