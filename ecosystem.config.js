module.exports = {
  apps: [
    {
      name: "poopymarket",
      script: ".output/server/index.mjs",
      interpreter: "bun",

      args: "--env-file=.env",

      env: {
        PATH: `${process.env.HOME}/.bun/bin:${process.env.PATH}`,
        NODE_ENV: "production",
        PORT: 8008,
      },
    },
  ],
};
