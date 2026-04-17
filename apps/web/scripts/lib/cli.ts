/**
 * 通用 CLI 参数解析
 *
 * 支持的参数:
 *   --dry-run                 不写库,只预览
 *   --limit <N>               限制处理数量
 *   --verbose                 详细日志
 *   --no-ai                   跳过 OpenAI(纯规则推断)
 *   --region <name>           按区域过滤(如 'Auckland')
 *   --keyword <text>          关键词(如 'Holiday Park')
 *   --source <name>           只处理指定来源('doc'|'google'|...)
 *   --force-refresh           即使已 enriched 也重新拉
 */

export interface CliOptions {
  dryRun: boolean;
  limit?: number;
  verbose: boolean;
  noAi: boolean;
  region?: string;
  keyword?: string;
  source?: string;
  forceRefresh: boolean;
  /** 任意未识别的位置参数 */
  positional: string[];
}

export function parseCli(argv: string[] = process.argv.slice(2)): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    verbose: false,
    noAi: false,
    forceRefresh: false,
    positional: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--verbose':
      case '-v':
        opts.verbose = true;
        break;
      case '--no-ai':
        opts.noAi = true;
        break;
      case '--force-refresh':
        opts.forceRefresh = true;
        break;
      case '--limit': {
        const next = argv[++i];
        if (!next) throw new Error('--limit requires a number');
        opts.limit = parseInt(next, 10);
        if (isNaN(opts.limit)) throw new Error(`--limit invalid: ${next}`);
        break;
      }
      case '--region': {
        const next = argv[++i];
        if (!next) throw new Error('--region requires a value');
        opts.region = next;
        break;
      }
      case '--keyword': {
        const next = argv[++i];
        if (!next) throw new Error('--keyword requires a value');
        opts.keyword = next;
        break;
      }
      case '--source': {
        const next = argv[++i];
        if (!next) throw new Error('--source requires a value');
        opts.source = next;
        break;
      }
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
      // eslint-disable-next-line no-fallthrough
      default:
        if (arg.startsWith('--')) {
          console.warn(`[cli] 未知参数:${arg}`);
        } else {
          opts.positional.push(arg);
        }
    }
  }

  return opts;
}

function printHelp() {
  console.log(`Usage: tsx scripts/<script>.ts [options]

Options:
  --dry-run               不写库,只预览
  --limit <N>             限制处理数量
  --verbose / -v          详细日志
  --no-ai                 跳过 OpenAI 调用
  --force-refresh         即使已 enriched 也重新拉
  --region <name>         按区域过滤
  --keyword <text>        关键词
  --source <name>         数据源
  --help / -h             显示此帮助
`);
}

/**
 * 输出格式化进度
 */
export function progress(current: number, total: number, label = '') {
  const pct = ((current / total) * 100).toFixed(1);
  const bar = '█'.repeat(Math.floor(current / total * 20)).padEnd(20, '░');
  process.stdout.write(`\r[${bar}] ${pct}% ${current}/${total} ${label}    `);
}

export function progressEnd() {
  process.stdout.write('\n');
}
