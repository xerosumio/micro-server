module.exports = () => ({
  default: true,
  static: {
    enabled: true,
    dirName: 'public',
    opts: {
      apiPrefix: '/api', // default to '/api', can be set to ''
      index: 'index.html',
    },
  },
  sse: {
    enabled: true,
    filePath: './sse',
    opts: {
      matchPath: '/events', // SSE endpoint path
    },
    config: {},
  },
});
