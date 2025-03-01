import { execaCommand } from 'execa';

async function publish(): Promise<void> {
  // publish the stable public packages
  await execaCommand(
    `yarn lerna exec --no-bail -- npm_config_registry=https://npm.pkg.github.com/ npm publish --access public`,
    {
      shell: 'bash',
    },
  );
}

publish();
