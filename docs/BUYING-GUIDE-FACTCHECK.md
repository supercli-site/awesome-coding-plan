# 选购路线与官方规则核对

核对日期：2026-11-03。本站的选购路线是 webkubor 的编辑判断，不是官方性价比认证；价格、额度、地区和支付条件以链接中的官方规则为准。不同厂商的积分、请求数和工具额度不能直接视为同等 token。

| 路线 | 核对结果 | 不能承诺的内容 | 官方来源 |
|---|---|---|---|
| 按量优先 DeepSeek Flash | 现名 deepseek-flash，旧名 deepseek-v4-flash 仍可用，实际由 DeepSeek-V4.1-Flash-1017 提供服务。人民币/百万 tokens：高峰未命中输入2、缓存命中0.04、输出8；空闲1、0.02、4。 | 缓存命中不代表所有输入均按命中价收费。 | https://api-docs.deepseek.com/zh-cn/quick_start/pricing/ |
| MiniMax M Plan 适合个人 Agent | 现售 Go/Explore/Build；非视频有5小时与周双窗口，未用额度不结转；旧Token Plan停止新售，符合条件的存量用户可续。 | 不能写无限量、团队共享个人账号或生产环境无限调用；官方定位个人交互使用，生产环境建议按量。额度耗尽可扣已购适用积分包，不会自动扣账户余额。 | https://platform.minimax.cn/docs/m-plan/intro.md · https://platform.minimax.cn/docs/m-plan/usage-rules.md · https://platform.minimax.cn/docs/m-plan/faq.md |
| 国内 Coding 优先看质谱 | Lite/Pro/Max有5小时和周积分窗；另有团队版。 | 个人版不供他人共享；只适用于官方指定工具，自建应用、SaaS集成走标准API。 | https://docs.bigmodel.cn/cn/coding-plan/overview · https://docs.bigmodel.cn/cn/coding-plan/faq · https://docs.bigmodel.cn/cn/coding-plan/team |
| 海外条件合适优先 Claude | 付费计划含 Claude Code，与聊天共享用量；Max有5小时和周限制，Ultra的免5小时限制有验证条件；超限可启用额外 usage credits。 | 订阅并非统一无限额度，也不代表自动满足地区、支付或账号资格。 | https://claude.com/pricing |
| Codex 作为替代 | 官方现价 Plus $20；Pro 从$100起，另有$200/$500档，当前Pro无5小时窗口限制；超限可另购credits。 | “经常重置”是个人体验，不是免费额外额度保证；具体重置看用量面板。API key使用按API计费，不等于订阅内额度。 | https://learn.chatgpt.com/docs/pricing （原 developers.openai.com/codex/pricing 重定向至此） |
| Grok 可以比较 | 官方可查产品能力；当前本仓未核实订阅价格，保留空值与未核实标记。 | 不承诺固定价格或与其他厂商等量配额。 | https://x.ai/grok |
| Cursor 工具订阅 | 官方现价Plus $8只用Grok；Premium $30起可用第三方模型，但第三方模型按API价另计，不含在月费里。 | 不能概括为“月费包所有模型”或客观性价比第一；应按主要模型和实际额外用量比较。 | https://cursor.com/pricing |

DeepSeek 的高峰为北京时间工作日09:00–12:00、14:00–18:00（中国法定节假日除外），其他时段、周末及中国法定节假日为空闲时段。Search/Fetch另按成功请求计费，各人民币5元/千次，自2026-11-01 00:00（北京时间）起实施，不包含在 token 单价里。

## 公开边界

公开仓只收录经过校验的官方渠道资料和本站编辑说明。不发布内部 `.research`、社媒采集、账号、密钥、Cookie、本机路径。Cursor等工具官方订阅与独立第三方API中转分开标注。第三方中转服务可作为中立信息记录，不进入本站推荐购买入口。

灵感与对标：https://github.com/mahonzhan/awesome-coding-plan 。本站单独维护来源、日期、峰谷、缓存和超额条件，不照搬对标仓的过期条目。
