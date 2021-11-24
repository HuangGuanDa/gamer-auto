const md = require("markdown-it")();
const td = new (require("turndown"))({ headingStyle: "atx" });
const { convert: html_to_text } = require("html-to-text");

exports.parameters = [
    {
        name: "report_title",
        required: false,
    },
    {
        name: "report_ignore",
        required: false,
    },
];

const DEFAULT_CONFIG = {
    title: "巴哈自動化！ 報告 $time$",
    ignore: ["login", "logout", "report"],
};

exports.run = async ({ params, outputs, logger }) => {
    const log = (...args) => logger.log("\u001b[95m[報告]\u001b[m", ...args);

    const config = Object.assign({}, DEFAULT_CONFIG, JSON.parse(JSON.stringify(params)));

    if (typeof config.labels === "string") config.labels = config.labels.split(",");
    if (typeof config.ignore === "string") config.ignore = config.ignore.split(",");

    log("DONE");

    return {
        text: () => text(outputs, config),
        markdown: () => markdown(outputs, config),
        html: () => html(outputs, config),
        title: replace(config.title),
    };
};

async function text(outputs, config) {
    const { html } = await normalize(outputs, config);
    const text = html_to_text(html).replace(/\n\n\n+/g, "\n\n");
    return text;
}

async function markdown(outputs, config) {
    const { markdown } = await normalize(outputs, config);
    return markdown;
}

async function html(outputs, config) {
    const { html } = await normalize(outputs, config);
    return html;
}

async function normalize(outputs, config) {
    let report = "";

    report += `# ${config.title}\n\n`;

    for (const module in outputs) {
        // ignored
        if (config.ignore.includes(module)) continue;
        // no output
        if (!outputs[module]) continue;
        // no report
        if (!outputs[module].report) continue;

        report += `## ${module}\n`;

        const module_report = outputs[module].report;

        if (typeof module_report === "string") {
            report += module_report + "\n";
        } else if (typeof module_report === "function") {
            report += (await module_report(JSON.parse(JSON.stringify(outputs[module])))) + "\n";
        }
    }

    const raw_md = replace(report);

    const html = md.render(raw_md, {
        html: true,
        linkify: true,
        typographer: true,
    });

    const markdown = td.turndown(html);

    return { html, markdown };
}

function replace(str) {
    const t = time();
    const rules = [
        [/\$time\$/g, `$year$/$month$/$day$ $hour$:$minute$:$second$`],
        [/\$year\$/g, t[0]],
        [/\$month\$/g, t[1]],
        [/\$day\$/g, t[2]],
        [/\$hour\$/g, t[3]],
        [/\$minute\$/g, t[4]],
        [/\$second\$/g, t[5]],
    ];

    for (let i = 0; i < rules.length; i++) str = str.replace(rules[i][0], rules[i][1]);

    return str;
}

function time() {
    const date = new Date().toLocaleString("en", { timeZone: "Asia/Taipei" }).split(", ");
    let [month, day, year] = date[0].split("/");
    let [hour, minute, second] = date[1].match(/\d{1,2}/g);

    if (+hour === 12 && date[1].toLowerCase().includes("am")) hour = String(+hour - 12);
    if (+hour < 12 && date[1].toLowerCase().includes("pm")) hour = String(+hour + 12);
    return [year, month, day, hour, minute, second];
}
