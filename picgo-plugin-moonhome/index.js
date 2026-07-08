const DEFAULT_REPO = 'XiaYue9009/picgo_moonhome';
const DEFAULT_BRANCH = 'main';
const DEFAULT_PATH = 'img/';

function buildPublicUrl({ repo, branch, path, customUrl }) {
  const normalizedPath = path.replace(/^\/+/, '');
  if (customUrl?.trim()) {
    return `${customUrl.replace(/\/+$/, '')}/${normalizedPath}`;
  }
  return `https://cdn.jsdelivr.net/gh/${repo}@${branch}/${normalizedPath}`;
}

async function handle(ctx) {
  const options = ctx.getConfig('picBed.moonhome');
  if (!options?.token) {
    throw new Error('MoonHome 图床未配置 GitHub Token');
  }

  const repo = options.repo?.trim() || DEFAULT_REPO;
  const branch = options.branch?.trim() || DEFAULT_BRANCH;
  const basePath = options.path?.trim() || DEFAULT_PATH;
  const customUrl = options.customUrl?.trim() || '';
  const [owner, repoName] = repo.split('/');

  if (!owner || !repoName) {
    throw new Error('仓库名格式应为 username/reponame');
  }

  for (const img of ctx.output) {
    if (!img.fileName || !img.buffer) continue;

    const filePath = `${basePath.replace(/\/?$/, '/')}${img.fileName}`;
    const content = img.buffer.toString('base64');

    await ctx.request({
      url: `https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`,
      method: 'PUT',
      headers: {
        Authorization: `token ${options.token}`,
        'User-Agent': 'picgo-plugin-moonhome',
        Accept: 'application/vnd.github+json',
      },
      data: {
        message: `upload ${img.fileName} via picgo-plugin-moonhome`,
        content,
        branch,
      },
    });

    const url = buildPublicUrl({ repo, branch, path: filePath, customUrl });
    img.imgUrl = url;
    img.url = url;
    delete img.base64Image;
    delete img.buffer;
  }

  return ctx;
}

function config(ctx) {
  return [
    {
      name: 'repo',
      type: 'input',
      default: DEFAULT_REPO,
      required: true,
      message: ctx.i18n.translate('PICBED_GITHUB_REPO'),
    },
    {
      name: 'branch',
      type: 'input',
      default: DEFAULT_BRANCH,
      required: true,
      message: ctx.i18n.translate('PICBED_GITHUB_BRANCH'),
    },
    {
      name: 'path',
      type: 'input',
      default: DEFAULT_PATH,
      required: false,
      message: ctx.i18n.translate('PICBED_GITHUB_PATH'),
    },
    {
      name: 'customUrl',
      type: 'input',
      default: '',
      required: false,
      message: ctx.i18n.translate('PICBED_GITHUB_CUSTOMURL'),
    },
    {
      name: 'token',
      type: 'input',
      default: '',
      required: true,
      message: ctx.i18n.translate('PICBED_GITHUB_TOKEN'),
    },
  ];
}

module.exports = (ctx) => {
  const register = () => {
    ctx.helper.uploader.register('moonhome', { handle, config });
  };

  return {
    register,
    uploader: 'moonhome',
  };
};
